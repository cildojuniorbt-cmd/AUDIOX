# AUDIOX

**Nexus Works Digital** · Convert • Extract • Manage

AUDIOX is a cross-platform audio and video workspace with one shared React + TypeScript frontend.

## Delivery platforms
- Browser: responsive web application with installable PWA support.
- Windows: Tauri 2 desktop application, packaged as an NSIS `.exe`.
- macOS: Tauri 2 desktop application, packaged as a `.dmg`.

## Current implementation
- Local browser conversion powered by FFmpeg.wasm.
- Multi-file queue with per-file progress, status and individual output downloads.
- Audio extraction from video by selecting an audio output format.
- Audio and video output format selectors.
- Conversion logs and per-file error handling.
- Tauri desktop shell and platform package workflows.

## Public web version

The production web app is published through GitHub Pages at `https://cildojuniorbt-cmd.github.io/AUDIOX/`. Pushes to `main` trigger the Pages deployment workflow.

## Development
```bash
npm install
npm run dev
```

## Web production build
```bash
npm run build
```

## Desktop development and packaging
```bash
npm run desktop:dev
npm run desktop:build
```

Desktop packages must be built on their target operating systems. The GitHub Actions workflow can build Windows and macOS artifacts manually or when a version tag beginning with `v` is pushed. Signing and macOS notarization are separate release requirements.

## Media compatibility
The interface offers a broad selection of audio and video containers. Actual conversion depends on the codecs, demuxers and muxers compiled into the FFmpeg build. MP4, for example, is a container and may contain H.264, HEVC or AV1 video. Unsupported combinations should be reported rather than silently producing invalid files.

The current browser engine uses the single-thread FFmpeg.wasm core. Processing occurs locally in the browser, but browser memory and device performance limit practical file size and speed. The desktop native FFmpeg engine and a server worker tier remain future milestones for broader codec coverage and large-file processing.

## Downloader policy
Downloader integrations are not enabled yet. They will only support sources and workflows that explicitly authorize downloading. AUDIOX will not bypass DRM, paywalls, access controls or platform restrictions.

## Quality note
Converting lossy audio to WAV or another lossless container does not restore information discarded by the original encoding.

## Release checklist
- Validate conversion with representative audio and video samples on each target OS.
- Verify supported codecs and containers against the actual FFmpeg build.
- Test large files, memory pressure, interrupted jobs and output playback.
- Package native FFmpeg binaries only after license and redistribution review.
- Sign Windows installers and sign/notarize macOS releases before public distribution.
