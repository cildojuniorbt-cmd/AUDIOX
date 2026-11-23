# AUDIOX Stems Worker Contract

Status: design contract. No AI model is bundled or enabled by this document.

## Process boundary

The desktop shell communicates with a local worker process. The worker must never expose a network listener. Standard input and standard output carry UTF-8 JSON Lines. Standard error is reserved for diagnostic logs.

## Commands

### capabilities

Request:
`{"id":"request-uuid","command":"capabilities"}`

Response:
`{"id":"request-uuid","ok":true,"engine":{"available":false,"engineId":null,"engineVersion":null,"device":"unknown","reason":"No approved model runtime is installed."},"formats":["wav","mp3"],"stems":["vocals","drums","bass","other"]}`

### separate

Request:
`{"id":"request-uuid","command":"separate","inputPath":"...","outputDirectory":"...","format":"wav","mp3BitrateKbps":320,"modelId":"approved-model-id"}`

The worker must reject paths outside the app-managed temporary workspace, unsupported formats, unknown model IDs, and files exceeding configured limits. The command must return a job ID or a structured error.

### cancel

Request:
`{"id":"request-uuid","command":"cancel","jobId":"job-uuid"}`

Cancellation is best-effort and must trigger cleanup.

### cleanup

Request:
`{"id":"request-uuid","command":"cleanup","jobId":"job-uuid"}`

Remove temporary input, intermediate tensors, and uncollected outputs for that job.

## Events

Progress events are JSON Lines:
`{"event":"progress","jobId":"job-uuid","stage":"separating","progress":0.42}`

Progress may be null when the underlying engine cannot report a reliable percentage. Never fabricate progress.

Completion:
`{"event":"completed","jobId":"job-uuid","outputs":[{"stem":"vocals","path":"...","format":"wav","sizeBytes":1234}]}`

Failure:
`{"event":"failed","jobId":"job-uuid","code":"MODEL_UNAVAILABLE","message":"..."}`

## Required safeguards

- Use argument arrays, never shell interpolation.
- Use generated job IDs and app-managed temporary paths.
- Validate input file type, size, duration, and output format.
- Do not download model weights without explicit user action and a recorded license/provenance entry.
- Do not silently upload audio to a remote service.
- Remove temporary files on success, failure, cancellation, and app shutdown where possible.
- Report GPU backend and fallback behavior accurately.
- Preserve source files; never overwrite the input.

## Model registry

A model is eligible only when its registry entry records:
- Stable model ID and version
- Model/checkpoint source URL and SHA-256
- Architecture/code license
- Checkpoint/weights license and commercial-use status
- Attribution and redistribution obligations
- Supported stems, sample rates, and known limitations

Unknown or non-commercial checkpoint terms are not eligible for bundling in a commercial AUDIOX distribution.
