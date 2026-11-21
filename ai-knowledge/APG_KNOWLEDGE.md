# GuliKit APG Knowledge Base

> Canonical AI context file. This is the **only** maintained knowledge document in `ai-knowledge/`.
> Update this file in place; do not create dated copies, versioned copies, or additional documents in this folder.

## 1. Purpose and operating rules

This document records only APG format facts and button/action mappings that have been verified from official GuliKit source code or official GuliKit webpages.

For every new finding:

1. Read the relevant official source code or official webpage directly.
2. Trace the complete data flow from UI control to internal state to APG serialization.
3. Record the exact source path, function/identifier, and evidence location.
4. Mark each statement as **VERIFIED**, **PARTIALLY VERIFIED**, or **UNRESOLVED**.
5. Never infer a byte value, field meaning, button mapping, timing unit, frame layout, checksum, or file-ending rule from a name or appearance alone.
6. Update this file in place. Preserve previous verified facts unless new official evidence disproves them; document corrections in the change log.

Do not use prior conversation conclusions, old reports, test outputs, sample APG files, or pre-existing generator implementations as technical evidence. The evidence baseline is the official GuliKit source and official GuliKit webpages.

## 2. Current audit status

- Repository: https://github.com/ankpsx/gulikit-source
- Default branch: `main`
- Official macro editor page snapshot: `js/index.html`
- Script inventory: `js/script_list.txt`
- Main editor implementation candidate: `js/script_17.js` (official URL listed in `js/script_list.txt` as `https://macro.gulikit.com/./js/macroEditor.js`)
- Audit tracker: `APG_SOURCE_AUDIT_PROGRESS.md`
- Audit tracker currently reports **0 of 17 JavaScript files fully audited**. Therefore, this knowledge base intentionally does not claim that the APG binary format or complete button mapping has been established.

### Source inventory (from official page/script inventory)

| Local source path | Official script URL | Initial role/status |
|---|---|---|
| `js/script_01.js` | `https://macro.gulikit.com/./js/tailwindcss.js` | Tailwind CSS bundle; not fully audited |
| `js/script_02.js` | `https://macro.gulikit.com/./js/layui.js` | Not fully audited |
| `js/script_03.js` | `https://macro.gulikit.com/./js/jquery-3.6.3.min.js` | jQuery 3.6.3 header observed; not fully audited |
| `js/script_04.js` | `https://macro.gulikit.com/./js/jquery.lazyload.min.js` | Lazy Load 1.9.3 header observed; not fully audited |
| `js/script_05.js` | `https://macro.gulikit.com/./js/smart.animation.min.js` | Not fully audited |
| `js/script_06.js` | `https://macro.gulikit.com/./js/kino.razor.min.js` | Not fully audited |
| `js/script_07.js` | `https://macro.gulikit.com/./js/common.min.js` | Not fully audited |
| `js/script_08.js` | `https://macro.gulikit.com/./js/admin.validator.min.js` | Not fully audited |
| `js/script_09.js` | `https://macro.gulikit.com/./js/jquery.cookie.js` | Not fully audited |
| `js/script_10.js` | `https://macro.gulikit.com/./js/jquery.jqueryzoom.js` | Not fully audited |
| `js/script_11.js` | `https://macro.gulikit.com/./js/minHeight.js` | Not fully audited |
| `js/script_12.js` | `https://macro.gulikit.com/./js/prefixfree.min.js` | Not fully audited |
| `js/script_13.js` | `https://macro.gulikit.com/./js/bootstrap.bundle.min.js` | Not fully audited |
| `js/script_14.js` | `https://macro.gulikit.com/./js/generateColor.js` | Obfuscation reported; decode and verify |
| `js/script_15.js` | `https://macro.gulikit.com/./js/iro.min.js` | Not fully audited |
| `js/script_16.js` | `https://macro.gulikit.com/./js/http.js` | Obfuscation reported; decode and verify |
| `js/script_17.js` | `https://macro.gulikit.com/./js/macroEditor.js` | Obfuscation reported; primary APG editor candidate; decode and verify |

## 3. APG file format

**Status: UNRESOLVED — no byte-level field layout is certified yet.**

The following must be established from official source before being documented as format facts:

| Format element | Status | Required evidence |
|---|---|---|
| File extension and container type | UNRESOLVED | Official export/download implementation |
| Header / magic bytes | UNRESOLVED | Exact serializer and byte-writing path |
| Version field | UNRESOLVED | Serializer/parser and version handling |
| Action/record structure | UNRESOLVED | UI state to serialized record mapping |
| Button encoding | UNRESOLVED | Button identifier to serialized numeric/byte value |
| Press/release representation | UNRESOLVED | Event generation and serialization |
| Delay / duration unit and range | UNRESOLVED | UI input, conversion, serialization |
| Sequence ordering | UNRESOLVED | Record append/order logic |
| Frame, packet, or block boundaries | UNRESOLVED | Complete serializer |
| Length/count fields | UNRESOLVED | Exact write and read logic |
| Checksum/CRC | UNRESOLVED | Explicit implementation, if present |
| End marker / trailing bytes | UNRESOLVED | Exact finalization logic |
| Import/parser behavior | UNRESOLVED | Official APG import/read path, if present |

Do not fill these rows with guesses. When established, replace the status with VERIFIED and include exact values, offsets, widths, endianness, units, valid ranges, and source evidence as applicable.

## 4. Button and control mapping

**Status: UNRESOLVED — complete mapping not yet verified.**

A visible excerpt of the obfuscated editor source contains a call resembling `isButtonSelected(..., 'R3')`. This only establishes that the string `R3` appears in a selection-checking expression; it does **not** establish its serialized value, complete meaning, or relationship to a physical controller input. Treat it as a lead for source tracing, not as a verified mapping.

No complete button-to-APG-value mapping is certified in this document yet.

Use this table as the canonical mapping registry. Add rows only after tracing both the UI identifier and its serialization path.

| UI label | Internal identifier | APG encoded value | Meaning / physical control | Evidence | Status |
|---|---|---|---|---|---|
| — | — | — | No mapping verified yet | — | UNRESOLVED |

The audit must check all categories exposed by the official editor, where present:

- Face/action buttons
- D-pad directions
- Left and right shoulder / trigger controls
- Left and right stick clicks and axes
- System, menu, capture, or auxiliary buttons
- Turbo, repeat, or modifier controls
- Macro step types such as press, release, wait/delay, and combinations

This list is an audit checklist only; it does not assert that every category is supported by every GuliKit device or APG version.

## 5. Required trace for each mapping

For every button or action, record:

- Exact visible UI label.
- Exact HTML element ID/name/value or data attribute.
- Exact JavaScript state key / internal identifier.
- Any translation table, enum, lookup array, or conversion function.
- Exact serialized byte/value and its width/endianness.
- Whether press and release are separate records or represented another way.
- Whether the mapping changes by device, firmware, editor mode, or file version.
- Source path and exact function/line or a stable code excerpt identifier.
- Verification status and any remaining ambiguity.

## 6. Source-of-truth policy

Preferred evidence, in order:

1. Official GuliKit macro editor webpage and its directly loaded scripts.
2. Official GuliKit documentation/download pages that define APG behavior.
3. Other official GuliKit source material explicitly linked from the official site.

Repository mirror paths are used to locate the captured source. The official URL and repository path should both be recorded when available.

Third-party descriptions, forum posts, reverse-engineered assumptions, prior generated files, and unverified APG samples must not be used to promote a fact to VERIFIED.

## 7. Next audit actions

1. Complete the audit of all 17 JavaScript files and update `APG_SOURCE_AUDIT_PROGRESS.md`.
2. Trace the macro editor's UI event handlers and state model.
3. Decode obfuscated editor code and verify decoded behavior against the official webpage.
4. Trace the APG export path end-to-end, from user action through byte construction to download.
5. Trace any official APG import path and compare its interpretation with export.
6. Populate the format table and complete button mapping only after the evidence chain is complete.
7. Re-check all recorded facts against the current official source before any future format or mapping change.

## 8. Change log

- 2026-11-21: Created this single canonical AI knowledge file. Initial repository audit tracker states 0/17 JavaScript files fully audited; no APG byte layout or complete button mapping is certified yet.


## 9. JavaScript file role overview (preliminary source reading)

The following descriptions are based on reading the corresponding files in the repository and checking the official page's script inventory/loading context. They are **role summaries, not full audits**. A file being classified as a general-purpose library does not prove that it has no indirect effect on the editor. The three obfuscated files remain subject to decoding and call-chain verification.

| File | Brief purpose | APG relevance / audit priority |
|---|---|---|
| `script_01.js` — `tailwindcss.js` | Tailwind CSS browser/runtime bundle used for utility-style page styling. | Low direct relevance; presentation layer, not currently identified as APG serialization logic. |
| `script_02.js` — `layui.js` | Layui 2.11.2 UI framework, including modules for forms, layers, sliders, tabs, upload and other interface widgets. | Medium indirect relevance: may provide editor controls and event/UI behavior; inspect only where the macro editor uses its APIs. |
| `script_03.js` — `jquery-3.6.3.min.js` | jQuery 3.6.3 DOM, event, AJAX and utility library. | Medium indirect relevance: editor handlers may use jQuery; library itself is not the APG format definition. |
| `script_04.js` — `jquery.lazyload.min.js` | jQuery Lazy Load 1.9.3 plugin for deferring image loading until images approach the viewport. | Low relevance; page presentation/performance. |
| `script_05.js` — `smart.animation.min.js` | Site-builder animation/layout helper; exposes animation-related behavior such as `smartH$` and jQuery animation plugins. | Low relevance unless editor controls explicitly depend on its layout behavior. |
| `script_06.js` — `kino.razor.min.js` | Razor-like client-side template parser/renderer; converts template strings with variables, conditions and loops into render functions. | Low-to-medium indirect relevance if editor UI is rendered through these templates; no APG byte format established here. |
| `script_07.js` — `common.min.js` | Shared GuliKit site/page behavior: navigation, responsive/layout handling, language switching and common UI interactions. | Medium indirect relevance; page integration and language labels may surround the editor, but this is not yet proven to encode APG actions. |
| `script_08.js` — `admin.validator.min.js` | Adds `$.wezhan` validation helpers for email, mobile, numeric, text and related input validation. | Low relevance; generic form validation. |
| `script_09.js` — `jquery.cookie.js` | jQuery Cookie Plugin 1.4.1 for reading, writing and deleting browser cookies. | Low relevance unless editor preferences/session state are stored through it; no APG serialization role identified. |
| `script_10.js` — `jquery.jqueryzoom.js` | jQuery image-zoom plugin that displays a magnified image on hover and preloads the zoom image. | Low relevance; image presentation. |
| `script_11.js` — `minHeight.js` | Sets minimum heights of page containers from the browser viewport height and updates them on window resize. | Low relevance; page layout only. |
| `script_12.js` — `prefixfree.min.js` | Prefix-free CSS compatibility helper; detects browser CSS prefixes and rewrites/registers prefixed CSS rules. | Low relevance; styling compatibility. |
| `script_13.js` — `bootstrap.bundle.min.js` | Bootstrap 5.3.3 bundled JavaScript components, including dropdowns, modals, tabs, tooltips and related UI behavior. | Medium indirect relevance if editor UI uses Bootstrap components; not the APG data model itself. |
| `script_14.js` — `generateColor.js` | Obfuscated color utility code; visible decoded string/function clues include color/background styling, RGB/hex conversion and color lightening. | Low APG relevance; needs deobfuscation confirmation, but appears to concern visual color generation rather than macro records. |
| `script_15.js` — `iro.min.js` | iro.js 5.5.2 color-picker library, exposing color and color-picker UI components. | Low APG relevance; color selection/presentation. |
| `script_16.js` — `http.js` | Obfuscated HTTP helper defining an async `request` wrapper around `fetch`, JSON handling, and AES-GCM encryption for POST payloads; embedded service base is `https://game.gulikit.com/gulikit`. | Medium investigation priority for network behavior/security and possible account/service calls; no evidence yet that this defines APG file serialization. Decode fully before concluding endpoint purposes. |
| `script_17.js` — `macroEditor.js` | Obfuscated primary macro-editor implementation. Visible symbols include `ButtonType` with `BUTTON`, `STICK`, `TRIGGER`; surrounding code includes macro editor access/count logic. | **Highest priority**: primary candidate for controller control selection, macro step state, import/export and APG serialization. Must be deobfuscated and traced end-to-end. |

### Page-level context

The official `js/index.html` identifies the page as “GuliKit Macro editor” and contains editor-facing controls/text for button selection, adding steps, step delay, blank delay, clearing the list, importing, saving and exporting an APG file. This confirms the page's intended editor functions, but the HTML labels alone do not define the serialized file format or encoded button values.

### Audit status clarification

- The 17 files have now received an initial role classification from source reading.
- **Full audit completion remains 0/17** under the stricter completion criteria in the audit tracker.
- This overview must not be interpreted as proof that all 17 files have been exhaustively analyzed or that APG format/mappings have been verified.
- Next priority: deobfuscate `script_17.js`, trace each UI action through state changes to export/import code, and inspect `script_16.js` only as needed to establish any relationship with editor service calls.


## 10. script_17.js — primary macro editor: first-pass functional analysis

Source inspected: `js/script_17.js`, 4,430 lines, 234,346 characters, blob SHA `60be095e889ef9a248882c2444513c9c74db8dfb` (main at time of inspection). The file is heavily string-array obfuscated: identifiers such as `_0x2b8964` resolve strings through `_0x2c2b()`. The descriptions below distinguish directly visible behavior from details that still require full deobfuscation.

### Overall purpose

This is the main browser-side GuliKit macro editor. It builds the controller selection UI, maintains selected controls and an ordered macro-step list, supports delays and blank-delay steps, allows reordering/removal, imports/exports an editor JSON configuration, and generates/downloads APG binary data.

### Main data model visible in source

- `ButtonType`: separates ordinary buttons, sticks and triggers.
- `gamepadButtons`: controller control catalogue with internal `id`, visible `label`, type and UI grid position. Visible entries include A/B/X/Y, LB/RB, LT/RT, L3/R3, additional system/menu controls and directional/diagonal directions. Some identifiers are hidden behind the obfuscation lookup and must be resolved before publishing a complete canonical mapping.
- `gamepadSticks`: two stick controls, with identifiers and labels resolved through the string table.
- `stickDirections`: eight directional states (UP/DOWN/LEFT/RIGHT and four diagonals); visible Chinese labels identify their directions.
- `appState`: `selectedButtons`, `selectedSticks`, `stepDelay` (initial value 200), `blankDelay` (initial value 200), `macroList`, `fileName`, `abxyLayout`, and drag state.
- A normal macro step is constructed with `id`, `buttons`, `sticks`, `delay`, `isBlankDelay:false`. A blank-delay step has empty `buttons` and `sticks`, a `delay`, and `isBlankDelay:true`.
- Each selected stick entry is treated as a stick plus a direction (the code accesses a nested stick `id` and a direction `id`).

### Functional groups and important functions

| Function / group | Role |
|---|---|
| `initializeApp` | Locates required page elements, renders both panels, and registers event listeners. |
| `renderLeftPanel`, `renderRightPanel` | Builds the control-selection and macro-list panels. |
| `renderSelectionDisplay`, `renderSelectedItems`, `renderSelectionActions` | Displays current selections and their actions. |
| `renderMacroList`, `renderMacroItem` | Displays ordered macro steps. |
| `toggleButton`, `addStickToSelection`, `removeSelectedButton`, `removeSelectedStick`, `clearSelection` | Maintains selected controls. |
| `updateSelectionUI`, `updateImageUI`, `updateAllImageUI`, `updateUIById`, `updateUIByStick`, `updateStackUI` | Synchronizes selected state with controller illustrations and UI. |
| `addSelectionToMacro` | Copies current button/stick selections and current step delay into a new non-blank macro step, then clears the selection. |
| `addBlankDelay` | Appends a step with no controls and `isBlankDelay:true`. |
| `updateMacroItemDelay`, `removeMacroItem`, `clearMacroList` | Edits delays and removes/clears macro steps. |
| `setAbxyLayout` | Changes the ABXY visual layout (including PC vs alternate layout) and updates control-image states. This is UI layout behavior; it does not by itself prove APG button encoding changes. |
| `generateAPGContent` | Converts the in-memory macro list into a fixed-size `Uint8Array` for APG download. This is the key serialization function. |
| `exportAPG` | Calls `generateAPGContent`, wraps the resulting bytes in a Blob, and downloads the APG file. |
| `exportConfig` | Exports a separate JSON editor backup containing `fileName`, `macroList`, and `version`. This JSON backup is not the APG binary file. |
| `importConfig` | Reads a JSON file with FileReader, parses it, checks for `fileName` and array-valued `macroList`, then restores those values into app state. This is editor-config import, not proof of APG binary import support. |
| `initializeDragAndDrop` through `updateDataOrder` | Implements drag sorting, visual movement, auto-scroll and synchronization of the macro list's data order. |
| `findMacroEditorAccessCount`, `mouseOverMacroEditorAccess` | Makes an asynchronous request related to macro-editor access/count; exact endpoint semantics need decoding and comparison with `script_16.js`. |

### APG serialization facts established directly by `generateAPGContent`

1. The function allocates a `Uint8Array` of **1,024 bytes**.
2. It uses a per-step record stride of **18 bytes** (`0x12`).
3. The output loop writes a record for each generated time slice of each macro step, in the order of `appState.macroList`.
4. The number of generated slices for a step is calculated as `Math.ceil((delay - 79) / 1000)` from the visible integer expressions. This indicates a delay-to-record expansion/quantization rule in this implementation. Do not yet equate this with the hardware's playback clock or claim the unit is conclusively milliseconds without cross-checking official format documentation or known-good official APG samples.
5. The loop stops when the record counter reaches the integer capacity `1024 / 18`; therefore at most **56 complete 18-byte records** can be written. The remaining 16 bytes cannot form another complete record.
6. Unused bytes at the end of the allocated buffer are filled with zero.
7. Each non-blank record encodes left-stick and right-stick directional values, trigger states (LT/RT), button bit fields, and a directional-pad value. The code constructs two button masks using bitwise OR and assigns values based on the selected control IDs; ABXY mask values depend on whether `appState.abxyLayout === 'PC'`.
8. Blank-delay records skip the normal button/stick/trigger/d-pad population path, while still occupying generated record slots and carrying delay-related data.
9. The exact byte offsets, byte order, numeric button bit assignments, stick numeric values and d-pad codes must be transcribed into the mapping table only after decoding the string table and independently checking every arithmetic expression. This first-pass summary intentionally does not guess those values.

### Important distinction: two different export formats

- **APG export**: binary `Uint8Array` generated by `generateAPGContent`, downloaded by `exportAPG`.
- **Editor configuration export**: JSON object `{fileName, macroList, version}`, downloaded by `exportConfig`. The import function shown in this file reads this JSON structure.
- Do not treat the JSON backup structure as the APG file structure.

### Current conclusion / remaining work

This source proves that APG output is a fixed 1,024-byte buffer populated with 18-byte step records, with a maximum of 56 complete records in this implementation. It also proves the broad categories of data written into each record. It does **not yet** establish the full header/trailer semantics, all byte offsets and encodings, the complete controller mapping table, or the hardware interpretation of the delay calculation. Keep those unresolved until the remaining deobfuscation and official-source cross-checks are complete.

Audit tracker: `script_17.js` has received a first-pass functional and serializer review, but is **not yet marked fully audited**.
