# AUDIOX

**A NEXUS Product** · Download • Convert • Manage

A responsive, installable audio workspace for converting user-owned or authorized audio files.

## Stack
- React + TypeScript + Vite
- FFmpeg.wasm for local browser conversion
- PWA-ready architecture

## Development
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

The downloader module will only integrate sources and workflows that explicitly permit downloading. This starter does not bypass platform restrictions or extract protected streams. Converting lossy audio to WAV does not restore information lost in the original encoding.


## Audio and video format strategy

AUDIOX is designed for broad media compatibility. The interface accepts common audio and video files, while actual import/export support is determined by the FFmpeg build and available codecs.

### Audio containers and formats
MP3, WAV, FLAC, M4A, AAC, OGG, Opus, WMA, AIFF, ALAC, APE, AC3, DTS, AMR, MP2, AU, CAF, WV, TTA, VOC.

### Video containers and formats
MP4, MKV, MOV, AVI, WebM, WMV, FLV, MPEG, MPG, M4V, 3GP, 3G2, TS, MTS, M2TS, VOB, OGV, MXF, ASF, DV, GIF.

### Media capabilities planned
- Extract audio from user-owned or authorized video files.
- Convert between supported audio and video containers.
- Batch conversion and per-file progress.
- Configure audio bitrate, sample rate, channels and bit depth where supported.
- Configure video codec, resolution, frame rate and quality where supported.
- Inspect media streams before conversion and show unsupported codec/container combinations clearly.

**Important:** a file extension is not a codec. For example, MP4 is a container that may hold H.264, HEVC or AV1 video. The UI must inspect actual streams and the selected FFmpeg build must include the relevant demuxers, muxers, decoders and encoders. Not every format can be encoded by every browser build. Server-side FFmpeg will provide the broader compatibility tier.

AUDIOX only downloads from sources and workflows that explicitly permit downloading. It does not bypass platform restrictions or DRM.
