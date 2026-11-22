# AUDIOX platform and delivery plan

## Delivery targets
- Browser: Vite web application.
- Windows: Tauri 2 installer (NSIS .exe).
- macOS: Tauri 2 disk image (.dmg).

## Browser conversion engine
The browser conversion engine uses the single-thread FFmpeg.wasm core loaded from a pinned CDN release. Files are processed locally in the browser and are not uploaded by the conversion workflow. Browser memory, available codecs, device performance and file size limit what can be converted reliably.

## Desktop engine
The Tauri shell is configured for Windows NSIS and macOS DMG packaging. The next desktop milestone is packaging a native FFmpeg binary per operating system, invoking it through a safe process API, and adding OS-specific integration tests. Native binaries and codecs require license and redistribution review.

## Release requirements
- Build Windows installers on Windows runners and macOS DMGs on macOS runners.
- Sign Windows installers for public distribution.
- Sign and notarize macOS apps with a Developer ID certificate.
- Test clean installs, upgrades, file permissions, large files, and output playback.
- Publish checksums and release notes.

## Download policy
Only integrate sources and workflows that explicitly authorize downloading. Do not bypass DRM, paywalls, access controls, or platform restrictions.
