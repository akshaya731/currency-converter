# 💱 Real-Time Global Currency Converter

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Deploy on Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![Deploy on Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?logo=netlify)](https://netlify.com)

A high-performance, real-time Currency Converter web application built with modern vanilla web technologies. Features a sleek fintech glassmorphism design, instant rate conversions powered by the **Frankfurter v2 REST API** with automated fallback to Open ER-API, an interactive **Multi-Currency Global Comparison Matrix**, dark/light mode, and in-memory intelligent caching.

![Currency Converter Preview](./assets/og-image.jpg)

---

## ✨ Features

- **⚡ Real-Time Reference Rates**: Seamlessly integrated with [Frankfurter v2 API](https://api.frankfurter.dev/v2) and automated failover layer.
- **🌍 150+ World Currencies**: Full ISO 4217 currency support with flag emojis and country names.
- **🔍 Searchable Currency Modal**: Fast filter and search by currency code (e.g. `USD`, `EUR`), country, or name (`Yen`, `Pound`, `Rupee`).
- **📊 Multi-Currency Global Matrix**: Simultaneously compares your entered amount across major global currencies (EUR, GBP, JPY, INR, CAD, AUD, CHF) with 1-click selection.
- **🌙 Dark / Light Mode**: Dynamic theme switcher with automatic OS preference detection (`prefers-color-scheme`) and `localStorage` persistence.
- **⚡ Quick Amount & Pair Chips**: 1-click conversion presets ($10, $50, $100, $500, $1,000, $5,000) and popular currency pairs.
- **🔄 Animated Currency Swap**: 360-degree interactive rotation on swap with instant recalculation.
- **🛡️ 30-Minute In-Memory Rate Cache**: Minimizes network roundtrips, optimizes quota, and supports offline cache reuse.
- **📋 One-Click Copy**: Instant result copying with animated toast notifications.
- **📱 PWA & Mobile-First**: Responsive layout crafted for desktop (1440px), tablet, and mobile (375px) with full PWA web manifest.
- **🚀 LinkedIn Share Integration**: Built-in modal with pre-crafted post copy and social preview card.

---

## 🛠️ Tech Stack & Architecture

- **Markup**: Semantic HTML5 with ARIA live announcements (`aria-live="polite"`), skip links, and full keyboard accessibility.
- **Styles**: Modern Vanilla CSS3 with CSS custom properties (design tokens), glassmorphism (`backdrop-filter: blur`), CSS Grid, and micro-animations.
- **Logic**: Modular Vanilla JavaScript (ES6+), Fetch API, `AbortController` cancellation for in-flight requests, and structured error boundaries.
- **API**: Frankfurter v2 (`https://api.frankfurter.dev/v2`) + Open ER-API fallback.
- **Zero Build Step**: No bundler, no node_modules required to run or deploy.

---

## 📂 Project Structure

```
currency-converter/
├── index.html            # Main application entry point & SEO metadata
├── manifest.json         # PWA Web App Manifest
├── vercel.json           # Vercel deployment configuration & security headers
├── netlify.toml          # Netlify zero-config deployment settings
├── .gitignore            # Git ignore file
├── README.md             # Project documentation & LinkedIn showcase
├── css/
│   └── style.css         # Modern fintech design system (light/dark mode)
├── js/
│   ├── currency-api.js   # API client with cache, timeout, and fallback
│   └── app.js            # UI controller, matrix updates & event handlers
└── assets/
    ├── favicon.svg       # Crisp vector favicon
    └── og-image.jpg      # Open Graph social preview banner (1200x630)
```

---

## 🚀 Run Locally

No compilation or installation required!

1. Clone or open this repository:
   ```bash
   cd currency-converter
   ```
2. Start any local static server:
   - **Python 3**:
     ```bash
     python -m http.server 8080
     ```
   - **Node.js (npx)**:
     ```bash
     npx serve .
     ```
   - Or open `index.html` directly in your browser.
3. Open `http://localhost:8080` in your browser.

---

## 🌐 Instant 1-Click Deployment

### Option 1: Vercel (Recommended)
1. Push your repository to GitHub.
2. Visit [vercel.com/new](https://vercel.com/new) and import the repository.
3. Framework Preset: **Other** (Root directory: `./`).
4. Click **Deploy**. Done in 5 seconds!

### Option 2: Netlify
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag and drop the `currency-converter` project folder.
3. Your site is instantly live with free HTTPS.

### Option 3: GitHub Pages
1. Push this folder to a GitHub repository on branch `main`.
2. Go to **Settings** > **Pages**.
3. Under **Build and deployment** > Source: **Deploy from a branch**.
4. Branch: `main`, Folder: `/ (root)`.
5. Click **Save**.

---

## 💼 LinkedIn Showcase & Ready-to-Post Copy

Use the built-in **"Share"** button in the header or copy the post template below to announce this project on LinkedIn:

```markdown
🚀 Just launched my Currency Converter web application! 💱✨

Built a high-performance, real-time currency conversion platform featuring:
⚡ Live Exchange Rates powered by Frankfurter v2 API & Open ER-API fallback
🌍 Instant conversion between 150+ global currencies
📊 Multi-Currency Global Matrix comparing top currencies in real-time
🌙 Sleek Fintech UI with Dark/Light mode & fluid glassmorphism
🛡️ 30-minute in-memory intelligent caching & zero-latency offline resilience
📱 100% Mobile responsive & PWA ready

Check out the live demo and let me know your thoughts! 👇
🔗 Live App: <YOUR_DEPLOYED_URL_HERE>
💻 Code Repository: <YOUR_GITHUB_REPO_HERE>

#webdevelopment #javascript #frontend #fintech #portfolio #opensource #coding #webdev
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
