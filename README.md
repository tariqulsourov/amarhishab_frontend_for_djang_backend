# Amar Hishab - Frontend

Modern React Single Page Application (SPA) built with Vite for the **Amar Hishab** budgeting and cost management platform.

## Features

- **React 18** with **Vite** for fast development and optimized production builds.
- **Authentication**: JWT token authentication with auto-refresh and Google OAuth integration.
- **Modules**:
  - Wallets & Transfers
  - Income & Cost tracking with categorisation
  - Loans & Planned / Scheduled transactions
  - Dashboard analytics & financial summaries
- **PWA & Push Notifications**: Web push notification support via VAPID service worker (`sw.js`).
- **Hostinger / Apache Support**: Pre-configured with `.htaccess` for smooth client-side routing.

## Setup & Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Set `VITE_API_URL` to your backend URL (e.g., `http://127.0.0.1:8000` or Render URL).

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```
   The production-ready output will be in the `dist/` directory.
