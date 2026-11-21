# GuliKit APG Editor — Windows desktop shell

This Electron wrapper packages the existing `editor/` UI and `codec/` modules into a Windows x64 NSIS installer.

## Local development

From the repository root:

```bash
npm install
npm start
```

## Build the Windows installer

On Windows x64:

```bash
npm install
npm run dist
```

The installer is written to `release/`.

## Offline and security behavior

- The editor and codec are packaged locally; no CDN or remote API is used.
- Electron serves the packaged files from a random-port HTTP server bound only to `127.0.0.1`.
- Renderer Node.js integration is disabled; context isolation, sandboxing and web security are enabled.
- External navigation and popup windows are blocked.
- A Content Security Policy restricts scripts, styles and connections to local resources.
- The loopback server is stopped when the application exits.

The wrapper does not implement USB/Bluetooth device writing. The current product remains an offline file editor for APG and JSON files.
