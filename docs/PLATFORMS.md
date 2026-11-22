# AUDIOX delivery platforms

AUDIOX shares one React + TypeScript frontend across the browser and desktop applications.

## Browser
- Vite production build deployed as a web application.
- Responsive layout and installable PWA support planned.
- Browser conversion uses a browser-compatible FFmpeg build within browser memory and codec limitations.

## Windows
- Tauri 2 desktop shell.
- Installer target: NSIS (.exe).
- Desktop build command: `npm run desktop:build` on a supported Windows build host.

## macOS
- Tauri 2 desktop shell.
- Installer target: DMG (.dmg).
- Desktop build command: `npm run desktop:build` on a supported macOS build host.

## Build and release notes
- Windows and macOS packages should be built on their respective operating systems or on dedicated CI runners.
- macOS distribution outside the App Store should be signed with a Developer ID certificate and notarized for a smooth Gatekeeper experience.
- Windows signing is recommended for public distribution to reduce SmartScreen warnings.
- Native FFmpeg binaries and their required licenses must be packaged and audited separately before enabling server-grade codec support in desktop builds.
- Do not bundle third-party codecs or libraries without reviewing their licenses and redistribution terms.
