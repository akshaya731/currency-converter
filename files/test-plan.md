# Test plan

Status: **written, not yet executed.** Record results in the "Result" column when you run each case.
Run via a local server (see README). Live tests use the real Frankfurter API.

## A. Functional (live API)
| # | Case | Steps | Expected | Result |
|---|------|-------|----------|--------|
| 1 | USD → INR | Defaults, amount `100`, Convert | Result shows `100.00 USD`, converted INR amount, rate, rate date. Converted = 100 × displayed rate (within rounding) | |
| 2 | INR → USD | Use swap, amount `8300` | Result for INR→USD; rate is roughly the inverse of case 1 | |
| 3 | EUR → GBP | Select EUR/GBP, `250` | Correct pair labels in result and rate panel | |
| 4 | Decimal | `12.345` USD→EUR | Accepted; no truncation to integer | |
| 5 | Large valid | `999999999999` | Accepted; result wraps cleanly, no horizontal scroll | |
| 6 | Same currency | USD→USD, `50` | `50.00 USD = 50.00 USD`, rate 1, **no network request** (check DevTools Network) | |
| 7 | Zero-decimal currency | USD→JPY | JPY amount shows 0 decimals | |
| 8 | Cache | Convert same pair twice | Second shows "reused from cache"; no new request | |
| 9 | Stale result | Convert, then change either currency or amount | Old result disappears immediately | |

## B. Validation (no API call must be made)
| # | Input | Expected message |
|---|-------|------------------|
| 10 | empty | Enter an amount to convert. |
| 11 | `0` | Amount must be greater than zero. |
| 12 | `-5` | Numbers-only message |
| 13 | `abc`, `1e5`, `1,000`, `Infinity` | Numbers-only message |
| 14 | `1000000000001` | Too large message |
| 15 | `1.123456789` (9 decimals) | Numbers-only message |

Check the error is read by a screen reader and `aria-invalid` is set on the input.

## C. API failure scenarios (DevTools → Network)
| # | Case | How to simulate | Expected |
|---|------|-----------------|----------|
| 16 | Network failure | Set throttling to Offline, Convert | "Could not reach…" alert with Try again; button re-enabled; no result shown |
| 17 | Currency list fails | Offline before page load | Error with Retry; dropdowns stay disabled; Retry works once online |
| 18 | Rate limit (429) | DevTools → Network → right-click request → Override/Local override or a Playwright route returning 429 | "Too many requests…" message |
| 19 | Malformed JSON | Override response body with `{oops` | "unexpected response" message |
| 20 | Wrong structure | Override body `{"rate":-1}` | "unexpected response" message |
| 21 | Unsupported pair | Override status 404/422 | "pair is not available" message |
| 22 | Timeout | Throttle to a very slow profile / block request | "took too long" after 10 s; button re-enabled |
| 23 | No false success | After each of 16–22 | Result area shows the neutral prompt, never numbers |
| 24 | Out-of-order responses | Throttle to Slow 3G, convert USD→EUR then immediately change to GBP and convert | Only the GBP result is ever displayed |

## D. Accessibility
| # | Check |
|---|-------|
| 25 | Tab order: skip link → nav → From → swap → To → Amount → Convert. Focus ring visible everywhere |
| 26 | Enter in the amount field submits |
| 27 | Result region is announced (aria-live polite) after conversion |
| 28 | Errors are shown with text and a ⚠ icon, not colour alone |
| 29 | Contrast checked with a tool (e.g. Lighthouse) |
| 30 | OS "reduce motion" disables the result animation |

## E. Responsive (DevTools device toolbar)
| # | Viewport | Check |
|---|----------|-------|
| 31 | 1440×900 | Header nav inline, card centred, From / swap / To on one row |
| 32 | 768×1024 | Same row layout fits; no clipping |
| 33 | 375×812 | Hamburger menu; fields stacked; button ≥44px tall; long currency names truncate; no horizontal scroll |

## Optional automation
Add Playwright later (`npm i -D @playwright/test`, outside the app itself) and use `page.route('**/v2/rate/**', ...)` to fulfil 429/malformed cases deterministically.
