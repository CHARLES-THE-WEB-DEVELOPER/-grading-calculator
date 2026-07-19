This project already includes a PWA manifest and a service worker.

Quick steps to make the app installable and distribute to phones:

1. Verify PWA installability

- Open the app in Chrome (served over HTTPS) and run Lighthouse → "Progressive Web App".
- Confirm "Installable" and fix any missing icons/manifest issues.

2. Host the site (HTTPS required)

- Quick options: Netlify, Vercel, GitHub Pages, or your VPS behind an SSL reverse proxy.
- Example (Netlify): push repo to GitHub and connect in Netlify — it will serve over HTTPS automatically.

3. Test 'Add to Home screen' on phone

- Open the hosted site in mobile Chrome or Safari.
- In Chrome: menu → "Install app" or "Add to Home screen".
- In iOS Safari: tap share → "Add to Home Screen".

4. Optional: wrap with Capacitor for app store binaries

- Install Capacitor locally:

```bash
npm install @capacitor/core @capacitor/cli --save
npx cap init grading-calculator com.example.gradingcalculator
```

- Build web assets (prepare `www` folder). For this project, the `server/public` folder is the web root.

```bash
# Simple copy step (Windows PowerShell)
rm -Recurse -Force www || true
Copy-Item -Recurse server\public www
```

- Copy assets into native projects:

```bash
npx cap add android
npx cap copy
npx cap open android
```

- Use Android Studio to build an APK and run on device. For iOS you need Xcode on a Mac:

```bash
npx cap add ios
npx cap copy
npx cap open ios
```

5. Notes & tips

- iOS does not support service worker-based background sync; PWA behavior on iOS is more limited.
- Provide PNG icons in multiple sizes (192, 256, 512) for best compatibility in app stores and Android.
- For CI/CD deployments, add an automated deploy to Netlify or Vercel.

If you want, I can:

- Add PNG icon files to `server/public/icons/` (you'll need to review/replace them) — SVG icons were added already.
- Prepare a small script to copy `server/public` → `www` for Capacitor — `scripts/copy-public.js` was added.
- Scaffold a basic Capacitor setup in `package.json` — a minimal `capacitor` block was added.
