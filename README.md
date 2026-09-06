# Sanwariya Kitchen Cashier POS

Browser-based cashier POS for Windows terminals, built with React, TypeScript, and Vite.
The existing POS screens, state stores, responsive touch layout, billing flows, reports,
Socket.IO updates, and dark/light themes are preserved from the original application.

## Run on Windows

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Set `VITE_PUBLIC_API_URL` in `.env` to the backend URL, for example
   `VITE_PUBLIC_API_URL=http://localhost:4000/api`.
4. Run `npm run dev` for development or `npm run build` for production.
5. Serve the generated `dist` directory from any static web server.
