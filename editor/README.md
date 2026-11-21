# GuliKit APG Editor

Offline-first editor for GuliKit macro JSON and APG files. The same codec and action model are used by the browser editor and the Windows Electron desktop application.

## Run the browser editor

From the repository root:

\`\`\`bash
python -m http.server 8000
\`\`\`

Open http://localhost:8000/editor/. The editor uses local ES modules and CSS only; no CDN, remote API, login, or network service is required after the files are available locally.

## Features

- Import official macro JSON and preserve supported fields and unknown JSON properties.
- Import APG with PC/Switch ABXY interpretation and conservative record-range detection, or enter a record count manually.
- Create, edit, delete, reorder, and clear action steps and blank-delay steps.
- Edit each step's delay independently.
- Select buttons, triggers, D-pad directions, and cardinal left/right stick directions with 0–100% strength.
- Export official JSON.
- Export APG for arbitrary macro step counts using the audited generic serializer rules; no 17-step/29-step profile gate.
- Preserve unchanged imported APG record ranges byte-for-byte where provenance and baseline match; regenerate changed/new steps.
- Report inferred delays, ambiguous record boundaries, counter discontinuities, and fixed-container truncation.

## APG compatibility notes

- The UI defaults to Switch ABXY layout; JSON itself does not encode the PC/Switch choice.
- The low-level \`encodeAPG()\` API defaults to PC unless \`abxyLayout\` is explicitly passed. The UI always passes the selected layout.
- Official APG output uses a 1 MiB container, 18-byte records, Marker 0x02, Counter 11 then +14 modulo 16-bit, and 0xFF tail fill.
- APG-to-JSON is lossy: APG does not retain original JSON step boundaries, arbitrary simultaneous directions, or exact millisecond delays.
- Automatic APG record-range detection is heuristic. If ambiguous, enter recordCount manually.
- The application does not write macros to controllers over USB/Bluetooth.

## Run tests

Node.js 22 is used in CI. Install Playwright temporarily and install Chromium:

\`\`\`bash
npm install --no-save --no-package-lock playwright
npx playwright install chromium
node --check editor/app.mjs
node --check desktop/main.cjs
node --test editor/browser-e2e.test.mjs
node --test codec/*.test.mjs editor/editor-smoke.test.mjs
\`\`\`

The repository currently does not define an \`npm test\` script.

## Build the Windows x64 installer

\`\`\`bash
npm install
npm run dist
\`\`\`

The NSIS installer is written to \`release/\`. CI workflow: \`.github/workflows/build-windows.yml\`.

## Technical handoff

The complete AI reproduction specification, verified APG format details, module responsibilities, acceptance criteria, and evidence boundaries are maintained in [ai-knowledge/APG_KNOWLEDGE.md](../ai-knowledge/APG_KNOWLEDGE.md).
