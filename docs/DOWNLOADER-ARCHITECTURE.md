# AUDIOX Downloader Architecture

## Goal

Increase source compatibility without coupling Downloader, Converter and Stems. The downloader accepts a URL, identifies its source, selects an authorized adapter, and returns a media file to the existing local conversion queue.

## Delivery phases

### Phase 1: source recognition (implemented in the web client)

- Identify common providers: YouTube, Vimeo, Instagram, TikTok, Facebook and X.
- Identify direct media file extensions.
- Identify HLS (.m3u8) and MPEG-DASH (.mpd) manifests.
- Explain whether a source is a direct-file candidate, needs an official integration, or uses a streaming format that is not enabled.
- Recognition is informational. It does not claim that a provider can be downloaded.

### Phase 2: direct media and open streaming

- Add a server-side resolver for public direct media URLs and permitted HLS/DASH sources.
- Enforce HTTPS, public-host validation, redirect validation, response-size limits, timeouts, MIME checks and per-user quotas.
- Never expose an unrestricted URL proxy. This avoids turning the service into an SSRF/open-proxy endpoint.
- Stream large files instead of buffering them entirely in memory.
- Preserve source attribution and require users to confirm they have rights or permission to download.

### Phase 3: official provider adapters

Each adapter must be independently enabled and documented. OAuth credentials and tokens must be stored as server secrets, never in the browser bundle.

- YouTube: official APIs do not provide a general-purpose downloadable media-file endpoint. Support only workflows explicitly permitted by YouTube, such as the creator's own export/download path where available. Do not use scraping, signature deciphering, cookie forwarding or access-control workarounds.
- Vimeo: use owner-enabled downloads and authorized API access.
- Instagram/Facebook: use eligible account/media access through Meta's official APIs and permissions.
- TikTok and X: enable only capabilities explicitly exposed by their current official APIs and granted scopes.
- Other providers: add adapters only after reviewing their terms, permissions, technical interface and data handling.

A platform appearing in the recognition list does not mean its download adapter is available.

## Cloud deployment and spending

- Initial development and tests stay on free tiers.
- No paid worker, VPS, storage bucket, API plan or third-party download service is activated automatically.
- The web frontend will call a configurable API base URL only after a backend is deployed.
- Add hard limits before public activation: max file size, max duration, concurrent jobs, daily usage, retention window and request rate.
- Require explicit user action before any cloud upload. Show destination, expected size and retention policy.
- Do not retain source media after delivery unless the user explicitly chooses to save it.
- Add usage reporting and provider-level kill switches.
- Any paid tier requires a separate budget decision after measuring real free-tier usage.

## Current status

The browser now identifies common source types and explains the current compatibility route. The server resolver and official provider adapters are not deployed yet. Direct-file downloads remain dependent on the origin's CORS and access policy. HLS/DASH assembly and social-platform page downloads are not enabled in this release.

## Acceptance tests

- Direct public MP3/MP4 link with permissive CORS: download, save to Library, and convert.
- Direct link blocked by CORS: show a clear message without claiming success.
- YouTube/social page URL: identify provider and explain official-integration requirement.
- HLS/DASH manifest: identify streaming type and state that assembly is not enabled.
- Private/local IP, credentials in URL, oversized file and redirect to a disallowed host: reject safely in the future server resolver.
