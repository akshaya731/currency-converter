/**
 * currency-api.js
 * High-performance, fault-tolerant exchange rate client.
 * Integrates Frankfurter v2 API (https://api.frankfurter.dev/v2) with automated fallback,
 * in-memory rate caching (30 min TTL), request abort controllers, and multi-currency querying.
 * Exposes global: CurrencyApi
 */
(function (global) {
  'use strict';

  const PRIMARY_BASE_URL = 'https://api.frankfurter.dev/v2';
  const FALLBACK_BASE_URL = 'https://open.er-api.com/v6/latest';
  const TIMEOUT_MS = 9000;
  const RATE_TTL_MS = 30 * 60 * 1000; // 30 minutes
  const CODE_RE = /^[A-Z]{3}$/;

  const rateCache = new Map(); // "USD>INR" -> { fetchedAt, data }
  let cachedCurrencies = null;

  class ApiError extends Error {
    constructor(code, message, details = null) {
      super(message);
      this.name = 'ApiError';
      this.code = code; // network | timeout | aborted | rate_limit | unsupported | http | malformed
      this.details = details;
    }
  }

  async function requestWithTimeout(url, options = {}, externalSignal = null) {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, TIMEOUT_MS);

    const onExternalAbort = () => controller.abort();
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort();
      else externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers: { Accept: 'application/json', ...(options.headers || {}) },
        signal: controller.signal
      });

      if (res.status === 429) throw new ApiError('rate_limit', 'Rate limit exceeded. Please wait a moment.');
      if (res.status === 404 || res.status === 422) throw new ApiError('unsupported', 'Selected currency is not supported.');
      if (!res.ok) throw new ApiError('http', `Service responded with HTTP ${res.status}.`);

      try {
        return await res.json();
      } catch (jsonErr) {
        throw new ApiError('malformed', 'Response format invalid (expected JSON).');
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err && err.name === 'AbortError') {
        throw new ApiError(timedOut ? 'timeout' : 'aborted', timedOut ? 'Request timed out after 9 seconds.' : 'Request cancelled.');
      }
      throw new ApiError('network', 'Unable to connect to currency exchange service. Please check your internet connection.');
    } finally {
      clearTimeout(timer);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    }
  }

  /**
   * Fetch list of supported currencies.
   * Returns sorted array of { code, name, symbol }
   */
  async function getCurrencies(signal) {
    if (cachedCurrencies && cachedCurrencies.length > 0) {
      return cachedCurrencies;
    }

    try {
      const data = await requestWithTimeout(`${PRIMARY_BASE_URL}/currencies`, {}, signal);
      if (!Array.isArray(data)) throw new ApiError('malformed', 'Currencies response was not a list.');

      const list = data
        .filter((c) => c && typeof c.iso_code === 'string' && CODE_RE.test(c.iso_code) && typeof c.name === 'string')
        .map((c) => ({
          code: c.iso_code,
          name: c.name,
          symbol: typeof c.symbol === 'string' ? c.symbol : ''
        }))
        .sort((a, b) => a.code.localeCompare(b.code));

      if (list.length < 5) throw new ApiError('malformed', 'Currency list incomplete.');
      cachedCurrencies = list;
      return list;
    } catch (primaryErr) {
      if (primaryErr.code === 'aborted') throw primaryErr;
      console.warn('Primary currency list fetch failed, trying fallback...', primaryErr);

      // Fallback currency list using open.er-api
      try {
        const fbData = await requestWithTimeout(`${FALLBACK_BASE_URL}/USD`, {}, signal);
        if (fbData && fbData.rates && typeof fbData.rates === 'object') {
          const list = Object.keys(fbData.rates)
            .filter((c) => CODE_RE.test(c))
            .map((c) => ({ code: c, name: c, symbol: '' }))
            .sort((a, b) => a.code.localeCompare(b.code));
          cachedCurrencies = list;
          return list;
        }
      } catch (fbErr) {
        // rethrow original error
      }
      throw primaryErr;
    }
  }

  /**
   * Fetch exchange rate from base to quote.
   * Returns: { base, quote, rate, date, fetchedAt, fromCache, provider }
   */
  async function getRate(base, quote, signal) {
    base = (base || '').toUpperCase().trim();
    quote = (quote || '').toUpperCase().trim();

    if (!CODE_RE.test(base) || !CODE_RE.test(quote)) {
      throw new ApiError('unsupported', 'Invalid ISO currency code format.');
    }

    if (base === quote) {
      return {
        base,
        quote,
        rate: 1,
        date: new Date().toISOString().split('T')[0],
        fetchedAt: Date.now(),
        fromCache: false,
        provider: 'Identity'
      };
    }

    const cacheKey = `${base}>${quote}`;
    const cached = rateCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < RATE_TTL_MS) {
      return { ...cached.data, fromCache: true };
    }

    // Try primary provider (Frankfurter v2)
    try {
      const data = await requestWithTimeout(`${PRIMARY_BASE_URL}/rate/${base}/${quote}`, {}, signal);
      const rate = data && data.rate;
      const isValid =
        data &&
        typeof data === 'object' &&
        data.base === base &&
        data.quote === quote &&
        typeof rate === 'number' &&
        Number.isFinite(rate) &&
        rate > 0;

      if (!isValid) throw new ApiError('malformed', 'Invalid rate data from primary provider.');

      const result = {
        base,
        quote,
        rate,
        date: data.date || new Date().toISOString().split('T')[0],
        fetchedAt: Date.now(),
        fromCache: false,
        provider: 'Frankfurter v2'
      };

      rateCache.set(cacheKey, { fetchedAt: result.fetchedAt, data: result });
      // Also cache inverse for quick swapping
      const inverseKey = `${quote}>${base}`;
      rateCache.set(inverseKey, {
        fetchedAt: result.fetchedAt,
        data: {
          base: quote,
          quote: base,
          rate: 1 / rate,
          date: result.date,
          fetchedAt: result.fetchedAt,
          fromCache: false,
          provider: 'Frankfurter v2 (Calculated Inverse)'
        }
      });

      return result;
    } catch (primaryErr) {
      if (primaryErr.code === 'aborted') throw primaryErr;
      console.warn('Primary rate fetch failed, trying fallback...', primaryErr);

      // Fallback via open.er-api
      try {
        const fbData = await requestWithTimeout(`${FALLBACK_BASE_URL}/${base}`, {}, signal);
        if (fbData && fbData.rates && typeof fbData.rates[quote] === 'number') {
          const rate = fbData.rates[quote];
          const result = {
            base,
            quote,
            rate,
            date: fbData.time_last_update_utc ? fbData.time_last_update_utc.slice(0, 10) : new Date().toISOString().split('T')[0],
            fetchedAt: Date.now(),
            fromCache: false,
            provider: 'Open ER-API (Fallback)'
          };
          rateCache.set(cacheKey, { fetchedAt: result.fetchedAt, data: result });
          return result;
        }
      } catch (fbErr) {
        // Fallback failed as well, throw original primary error
      }
      throw primaryErr;
    }
  }

  /**
   * Fetch batch rates for multiple target currencies
   */
  async function getMultipleRates(base, quotes = [], signal) {
    const results = {};
    const fetchPromises = quotes.map(async (quote) => {
      try {
        const rateData = await getRate(base, quote, signal);
        results[quote] = rateData;
      } catch (e) {
        results[quote] = null;
      }
    });
    await Promise.allSettled(fetchPromises);
    return results;
  }

  // Clear cache if needed
  function clearCache() {
    rateCache.clear();
  }

  global.CurrencyApi = {
    getCurrencies,
    getRate,
    getMultipleRates,
    clearCache,
    ApiError,
    RATE_TTL_MS
  };
})(typeof window !== 'undefined' ? window : this);
