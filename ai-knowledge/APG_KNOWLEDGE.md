# GuliKit APG Knowledge Base

> Canonical AI context file. This is the **only** maintained knowledge document in `ai-knowledge/`.
> Update this file in place; do not create dated copies, versioned copies, or additional documents in this folder.

## 1. Purpose and operating rules

This document is the single canonical technical knowledge base for developing a local, offline Windows application that can both generate GuliKit-compatible APG files and read/parse existing APG files into editable JSON. The product requirements are recorded in Section 14; all implementation must remain evidence-driven and must not promote unverified format assumptions into confirmed behavior.

This document also records APG format facts and button/action mappings, with verification status and evidence provenance, from official GuliKit source code/webpages and clearly distinguished user-supplied sample observations.

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


## 9A. Actual APG file size — user-confirmed observation

- The user confirms that the actual generated `.apg` file is **1 MB**.
- Do not state that the actual APG file is 1,024 bytes.
- `script_17.js` contains a `new Uint8Array(1024)` allocation in the inspected `generateAPGContent()` code path. This establishes a 1,024-byte buffer in that code path only; it does not establish the size of the final APG file.
- The relationship between the 1,024-byte buffer and the observed 1 MB output remains **UNRESOLVED**. Investigate the complete export path, other official source code, and any packaging / padding / transfer steps before concluding how the final file reaches 1 MB.
- Keep these facts separate: **observed final file size = 1 MB**; **inspected JS buffer allocation = 1,024 bytes**.

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


## 11. Third-party APG implementation comparison — external lead, not official evidence

Reference repository supplied by the user: https://github.com/hurui200320/GuliKitAPG
- Repository default branch: `master`; repository metadata reports it as archived.
- README describes the target as the GuliKit KingKong 2 Pro controller.
- Relevant source files inspected:
  - `src/main/kotlin/info/skyblond/gulikit/apg/APGFile.kt`
  - `src/main/kotlin/info/skyblond/gulikit/apg/ControlWord.kt`
  - `src/main/kotlin/info/skyblond/gulikit/apg/DPad.kt`
  - `src/main/kotlin/info/skyblond/gulikit/generator/SplatoonCanvas.kt`
- This is a third-party reverse-engineered implementation. It is recorded only as a comparison lead. It must not be used to promote any APG fact in Sections 3–5 to VERIFIED, because the official-source-only evidence policy remains in force.

### 11.1 Third-party implementation's stated file model

The third-party README and `APGFile.kt` describe a fixed array of 65,536 control words, each 16 bytes:
- Total size: 65,536 × 16 = 1,048,576 bytes (1 MiB).
- `APGFile.MAX_CONTROL_WORD = 65536`.
- `APGFile.finish()` fills every unused word with a padding word.
- `ControlWord.setPadding(true)` fills all 16 bytes with `0xFF`.
- A normal word is initialized with zeroes except the final byte, which is `0x02`, and the four joystick axes are centered.

### 11.2 Third-party 16-byte ControlWord layout

Offsets below are directly visible in `ControlWord.kt`; meanings are the third-party author's interpretation:

| Offset | Width | Third-party field | Status in this reference |
|---|---:|---|---|
| 0–1 | 2 | Left joystick horizontal, unsigned little-endian 12-bit value stored in 16 bits | Implemented by third party |
| 2–3 | 2 | Left joystick vertical | Implemented by third party |
| 4–5 | 2 | Right joystick horizontal | Implemented by third party |
| 6–7 | 2 | Right joystick vertical | Implemented by third party |
| 8 | 1 | Reserved/zero byte | Inferred from initialization/layout |
| 9 | 1 | ZL linear value | Declared offset; setter requires further scrutiny |
| 10 | 1 | Reserved/zero byte | Inferred from initialization/layout |
| 11 | 1 | ZR linear value | Declared offset; setter requires further scrutiny |
| 12 | 1 | Button group 1 | Implemented bit masks below |
| 13 | 1 | Button group 2 | Implemented bit masks below |
| 14 | 1 | D-pad enum | Implemented enum below |
| 15 | 1 | Normal-word end marker `0x02`; padding uses `0xFF` | Implemented by third party |

Joystick raw values are described as 0–4095, with 2048 centered; horizontal 0=left and 4095=right, vertical 0=down and 4095=up. The code maps signed logical values -2048..2047 to raw values by adding 2048 and writes little-endian 16-bit values.

### 11.3 Third-party button masks

At offset 12:
- A = `0x01`
- B = `0x02`
- Y = `0x04`
- X = `0x08`
- L = `0x10`
- R = `0x20`
- ZL click = `0x40`
- ZR click = `0x80`

At offset 13:
- Left stick click = `0x01`
- Right stick click = `0x02`
- Minus = `0x04`
- Plus = `0x08`
- Home = `0x10`
- Screenshot = `0x20`
- Upper two bits are marked unknown by the author.

The third-party README says ABXY uses Nintendo layout (A right, B bottom, X top, Y left). This mapping is specific to that implementation and target context; do not assume it matches every official editor layout.

### 11.4 Third-party D-pad enum

The third-party `DPad.kt` implements:
- 0: not pressed
- 1: up
- 2: up-right
- 3: right
- 4: down-right
- 5: down
- 6: down-left
- 7: left
- 8: up-left
- 15: padding

### 11.5 Important code-level caution

In `ControlWord.kt`, both `zlLinear` and `zrLinear` setters call `mapJoystickWrite(value, offset)`, rather than `mapTriggerLinearWrite(value, offset)`. The joystick writer writes a 16-bit value after adding 2048, while the corresponding readers read only one byte. This appears inconsistent with the documented one-byte linear-trigger fields and may overwrite the adjacent reserved byte. Treat this as a likely implementation defect in the third-party code, not as evidence of the hardware format. Do not copy this setter behavior into a generator without independent validation.

### 11.6 Comparison against current official web editor source

Current official source inspected: `js/script_17.js`, blob SHA `60be095e889ef9a248882c2444513c9c74db8dfb`.
- The current `generateAPGContent()` allocates `new Uint8Array(1024)`. The obfuscated arithmetic resolves to 1,024 bytes.
- The record stride arithmetic resolves to 18 bytes.
- The function therefore operates on a 1,024-byte buffer with at most 56 complete 18-byte records (16 bytes remain).
- `exportAPG()` wraps the returned typed-array buffer in a Blob for download.
- This source path is structurally different from the third-party fixed 1 MiB / 16-byte-word model.

The user's observation that an actual generated `.apg` file is 1 MB remains important and is not invalidated by this source excerpt. The mismatch is still **UNRESOLVED**: determine whether the observed file came from the physical controller, a different editor build/version, another official export path, or a later packaging/transfer stage. Do not conflate the 1,024-byte browser buffer with the user's 1 MB file.

### 11.7 Next comparison tasks

1. Fully transcribe all 18 byte offsets and masks in official `generateAPGContent()`.
2. Decode the obfuscated identifiers for every official button and stick direction.
3. Compare the official 18-byte fields with the third-party 16-byte model field-by-field; explicitly identify added/removed/reserved bytes.
4. Verify which APG generation/device families each structure applies to. The official page currently lists KK3, TT and Elves 2; the third-party README targets KingKong 2 Pro.
5. Establish the provenance of the user's 1 MB file before reconciling the two sizes.
6. Keep third-party facts labeled as external comparative evidence; only official GuliKit source can promote the canonical format/mapping registry to VERIFIED.


## 10A. script_17.js — deeper 18-byte record offset trace (partial)

Source: `generateAPGContent()` in `js/script_17.js`, same inspected blob SHA `60be095e889ef9a248882c2444513c9c74db8dfb`. The obfuscated arithmetic expressions for the record stride and each indexed write have been evaluated. This establishes the offsets below; semantic labels are based on the variables and surrounding control flow and remain subject to final deobfuscation review.

| Record-relative offset | Width | Current interpretation | Evidence/status |
|---|---:|---|---|
| 0–1 | 2 | Left stick horizontal value; high byte then low byte | PARTIALLY VERIFIED |
| 2–3 | 2 | Left stick vertical value; high byte then low byte | PARTIALLY VERIFIED |
| 4–5 | 2 | Right stick horizontal value; high byte then low byte | PARTIALLY VERIFIED |
| 6–7 | 2 | Right stick vertical value; high byte then low byte | PARTIALLY VERIFIED |
| 8–9 | 2 | LT selected state value; high byte then low byte; code sets 0 or 4095 | PARTIALLY VERIFIED |
| 10–11 | 2 | RT selected state value; high byte then low byte; code sets 0 or 4095 | PARTIALLY VERIFIED |
| 12 | 1 | First button bitmask | PARTIALLY VERIFIED |
| 13 | 1 | Second button bitmask | PARTIALLY VERIFIED |
| 14 | 1 | D-pad direction code | PARTIALLY VERIFIED |
| 15 | 1 | Constant `0x02` | VERIFIED as a written constant in this serializer |
| 16–17 | 2 | Rolling per-record counter; high byte then low byte | PARTIALLY VERIFIED |

Important details:
- The first four 16-bit axis values are written high byte first, then low byte (big-endian byte order in this serializer). This differs from the third-party `ControlWord.kt` implementation, which explicitly reads/writes joystick values little-endian.
- The LT and RT values are each set to 0 when not selected and 4095 when selected in this serializer. They occupy two bytes apiece, unlike the third-party model's one-byte linear trigger fields at offsets 9 and 11.
- The two button masks are written at offsets 12 and 13.
- The D-pad code is written at offset 14; offset 15 is written as `0x02`.
- The 16-bit value written at offsets 16–17 starts at 11, increases by 14 for each record after the first, and resets to 11 when it exceeds 65535. Its hardware meaning is not yet established; call it a rolling counter, not a confirmed time unit.
- The loop's record stride is 18 bytes, and the buffer is 1,024 bytes, so only 56 complete records fit.

### Official button mask values decoded from arithmetic

First mask at record offset 12:
- A: PC layout = `0x02`; alternate layout = `0x01`.
- B: PC layout = `0x01`; alternate layout = `0x02`.
- X: PC layout = `0x08`; alternate layout = `0x04`.
- Y: PC layout = `0x04`; alternate layout = `0x08`.
- LB = `0x10`.
- RB = `0x20`.
- LT = `0x40`.
- RT = `0x80`.

Second mask at record offset 13:
- L3 = `0x02`.
- R3 = `0x01`.
- Three further control cases resolve numerically to `0x04`, `0x08`, and `0x10`; their visible control names still need string-table decoding before being added to the canonical button registry.

### D-pad numeric values

The eight non-neutral D-pad cases in the serializer assign the numeric values 1 through 8 in the conventional order:
- UP = 1
- DOWN = 5
- LEFT = 7
- RIGHT = 3
- UP-LEFT = 8
- UP-RIGHT = 2
- DOWN-LEFT = 6
- DOWN-RIGHT = 4

Neutral initializes to 0. These numeric values match the third-party `DPad.kt` enum, but the agreement is comparative evidence only; the official values above are derived from the official serializer's own switch branches.

### Explicit remaining uncertainty

The exact helper-function identities used for every high-byte/low-byte operation and the obfuscated names for the final three controls still need a complete string-table decode. The 16-bit counter's device-side meaning is unknown. No conclusion is made that the official 18-byte record is a universally applicable APG standard.

## Section 12 — 1 MiB browser-export discrepancy (2026-11-21)

### Source provenance clarified by the user
- The user clarifies that the repository's `main/js` directory is the JavaScript source downloaded from the official GuliKit web editor page. Treat this directory as the downloaded source snapshot for the official editor; do not continue describing it as an unverified third-party mirror or assume that a separate live-asset URL must first be discovered.
- The user's approximately 1 MB `.apg` file was also downloaded by clicking 「导出 APG 文件」 in the official web editor, not copied from the controller's USB storage.
- These are two user-confirmed provenance facts: the repository `js/` source came from the editor page, and the 1 MB APG file came from that editor's export button.

### Source-code observation and unresolved size discrepancy
- The inspected `js/script_17.js` blob SHA is `60be095e889ef9a248882c2444513c9c74db8dfb`. Its `generateAPGContent()` allocates `new Uint8Array(1024)`, and `exportAPG()` wraps the returned typed array in a Blob. On the inspected code path, the returned payload therefore appears to be 1,024 bytes.
- This source observation conflicts with the user's confirmed approximately 1 MB browser download. Do not dismiss either observation. The discrepancy remains unexplained and requires checking the complete `js/` directory for another export path, additional script/module behavior, or a distinction between the inspected function and the actual exported payload.
- The official editor page is https://macro.gulikit.com/?language=2 and states support for KK3, TT, and Elves 2 APG-capable firmware. The repository `js/` directory is the user-confirmed downloaded source snapshot for that editor.
- Cross-check within the repository confirms the role of `script_17.js`: `js/index.html` loads `./js/macroEditor.js`, while `js/script_list.txt` maps `script_17.js` to `https://macro.gulikit.com/./js/macroEditor.js`. Thus `script_17.js` is the archived/downloaded `macroEditor.js` asset, not an unrelated numbered script. `js/index.html` and `js/script_list.txt` were both fetched from `main` and inspected.

### Status / next verification
- UNRESOLVED: why the user-confirmed browser export is approximately 1 MiB while the inspected `script_17.js` serializer allocates 1,024 bytes.
- Do not assume 1 MiB is a controller-wide APG format specification, and do not claim that the 1,024-byte allocation is the complete observed APG file.
- Next investigation should inspect all files in the repository's `js/` directory and trace every export-related call path, then compare that complete source behavior with the user's actual exported file if binary evidence becomes available.


### Section 12 follow-up — complete page/export path audit (2026-11-21)

The page and archive were rechecked beyond the serializer function:

1. **Page entry and script order:** `js/index.html` contains the APG editor UI and loads `./js/http.js` followed by `./js/macroEditor.js`. The HTML's remaining inline scripts handle page presentation/language/site behavior; the inspected HTML does not define a second APG serializer or a second export handler.
2. **Archive inventory:** the complete GitHub API listing of `js/` contains `index.html`, `script_01.js` through `script_17.js`, `script_list.txt`, and a two-byte readme. There is no second archived macro-editor script or separate APG export module in this directory. `script_list.txt` maps `script_17.js` to `https://macro.gulikit.com/./js/macroEditor.js`.
3. **Export call path:** in `script_17.js`, `exportAPG()` calls `generateAPGContent()`, constructs `new Blob([returnedTypedArray.buffer], ...)`, creates an object URL, assigns it to a temporary anchor's `href`, sets the download filename, clicks the anchor, removes it, and revokes the object URL. There is no visible concatenation, padding-to-1-MiB, network fetch, or second payload appended between the generated buffer and Blob construction in this function.
4. **Buffer allocation arithmetic:** the obfuscated allocation expression evaluates to 1,024 bytes. The record stride expression evaluates to 18 bytes. The serializer returns that same typed array; the Blob is built from its backing `ArrayBuffer`. Thus, for this exact inspected source path and assuming an ordinary unmodified `Uint8Array`, the Blob payload length is 1,024 bytes.
5. **Separate HTTP helper:** archived `script_16.js` maps to `http.js`; it defines a JSON request helper and AES-GCM encryption for requests to `game.gulikit.com`. Its `new Uint8Array(0xc)` is a 12-byte cryptographic IV, not an APG buffer. No APG serialization or APG Blob export was found in this helper.
6. **Separate config export:** `exportConfig()` serializes `fileName`, `macroList`, and `version` as JSON and downloads a configuration file. It is not the APG binary export path.

**Updated conclusion:** the inspected downloaded-source snapshot provides no second export route or in-page size-expansion step that explains the user's approximately 1 MiB download. The mismatch is now narrower: either the actual browser session used a different/different-revision asset than this archived snapshot, or there is another factor not represented in the inspected page/source files. These are hypotheses, not findings. The user's reported approximately 1 MiB download remains a confirmed observation and must not be re-labelled as 1,024 bytes.

**Still unresolved:** no binary sample of the actual 1 MiB download has been inspected, so its exact byte count, header/footer, padding pattern, record count, and relationship to the 1,024-byte source-generated buffer are unknown. Do not claim that the 1,024-byte buffer is the full real-world APG file.


### Section 12 follow-up — source history and live-page cross-check (2026-11-21)

- GitHub path history for `js/script_17.js` currently returns only one commit (`b9a3b770f545f3be845a4e2d012541ed8ef277de`, 2026-11-19, “Add files via upload”). The repository therefore provides no earlier revision of this file to compare for a former 1-MiB serializer.
- The official editor HTML page remains accessible and still describes the page as the controller learning-file editor, supporting KK3, TT, and Elves 2 APG-capable firmware. This confirms the public editor page context, but its rendered text does not expose the binary payload implementation.
- A direct text-page retrieval of the live `macroEditor.js` URL was rejected by the web retrieval layer because the response is JavaScript content rather than HTML/text page content. This is a retrieval limitation, not evidence that the asset is unavailable or identical/different from the archived copy.
- Consequently, the live JavaScript asset has not yet been independently compared byte-for-byte with `script_17.js`. Do not claim that the current live editor necessarily uses the archived serializer, even though the user confirms that the repository source was downloaded from the editor page.

**Next discriminating evidence:** obtain the exact downloaded APG binary (or at least its exact byte count and a hex dump of the first and last 64 bytes) and compare it with a locally reproduced 1,024-byte output from the archived serializer; alternatively, obtain the live `macroEditor.js` response as raw JavaScript through a retrieval route that preserves its bytes. Without one of these, the 1-MiB discrepancy cannot be resolved from the repository history alone.


## 13. User-supplied official-browser-export sample — Auto.apg (2026-11-21)

### Provenance and exact file facts
- The user uploaded `Auto.zip`; its sole entry is `Auto.apg`.
- ZIP entry uncompressed size: **1,048,576 bytes (1 MiB)**.
- SHA-256 of the extracted `Auto.apg` bytes: `15b6c5f4d55e50e08e734c9e337f7b739b3d42c612917941373a4b6c66707617`.
- The user previously confirmed that this file was downloaded using 「导出 APG 文件」 from the official GuliKit browser editor. Treat that as user-supplied provenance, not independent proof of which exact live JavaScript revision ran.

### Direct binary observations
- Bytes 0–575 contain exactly **32 consecutive 18-byte records**.
- Byte offset 576 through 1,048,575 is entirely `0xFF` (1,048,000 bytes of trailing fill).
- The first 18-byte record is:
  `0F FF 00 01 0F FF 00 01 0F FF 0F FF FF 1F 06 02 00 0B`.
- Record-relative offsets 0–17 in this sample align with the 18-byte layout previously traced in official `generateAPGContent()`: four 16-bit axis values, two 16-bit trigger values, two button masks, D-pad code, `0x02` marker, and a 16-bit counter. This is strong sample-to-source structural correspondence, but the sample alone does not prove all hardware semantics.
- For records 0–15, the first 16 bytes repeat as `0F FF 00 01 0F FF 00 01 0F FF 0F FF FF 1F 06 02`; the counter at offsets 16–17 starts at 11 and increments by 14 each record (11, 25, 39, …, 221).
- For records 16–31, the first 16 bytes repeat as `08 00 08 00 08 00 08 00 00 00 00 00 00 00 00 02`; the same counter sequence continues (235, 249, …, 445).
- The 32nd record ends at byte 575; the remainder begins immediately with `0xFF` fill. There is no separate 1-MiB header observed before the records in this sample.

### Reconciliation and limits
- This sample confirms that the user's actual browser-exported file is 1 MiB, and that its populated prefix uses 18-byte records matching the official archived serializer's record stride and field arrangement.
- The sample does **not** match the archived serializer's complete 1,024-byte output behavior: the sample is 1 MiB and its unused region is `0xFF`, whereas the inspected archived function allocates 1,024 bytes and fills unused bytes with zero. Therefore, the size and fill discrepancy remains unresolved.
- The sample's exact populated length is 32 records × 18 bytes = 576 bytes. Do not interpret the 1-MiB file as 65,536 16-byte records merely because that is the third-party implementation's model: this sample's active prefix demonstrably aligns on 18-byte boundaries, and its first record's offsets 15–17 contain the `0x02` marker plus the 16-bit counter.
- These are observations about this one user-supplied sample. Do not generalize the 1-MiB container size, `0xFF` fill rule, or maximum record count to every GuliKit device/editor version without further official evidence.


### Section 13 follow-up — user-described actions that produced Auto.apg (2026-11-21)

The user clarifies the test procedure used to create the uploaded `Auto.apg` through the official browser editor:
- They configured an action in which many controls were selected/pressed together, with a 200 ms delay.
- They then added one blank-delay action of 200 ms.
- They exported the resulting file from the editor.

Re-analysis of the 32 populated 18-byte records in this sample:
- Records 1–16 have identical first 16 bytes: `0F FF 00 01 0F FF 00 01 0F FF 0F FF FF 1F 06 02`.
- Records 17–32 have identical first 16 bytes: `08 00 08 00 08 00 08 00 00 00 00 00 00 00 00 02`.
- The 16-bit counter at bytes 16–17 continues monotonically across both groups, increasing by 14 per record.
- The second group is a neutral-control state in the sample (centered axes 0x0800, zero triggers, zero button masks, neutral D-pad), and is consistent with the user's described blank-delay action. This is a sample-level correspondence, not yet a universal semantic rule.
- The user's described action sequence and the observed two groups are now linked as provenance. However, do not yet claim that one 200 ms editor step necessarily expands to 16 records: the source-side expansion rule and the precise number/organization of configured actions must be reconciled with the user's UI setup. The observed fact is 16 repeated records in each group.


### Section 13 follow-up — user confirms exactly one normal step plus one blank-delay step (2026-11-21)

The user explicitly confirms the editor setup was:
- Exactly **one** normal macro action: many controls selected simultaneously, delay set to 200 ms.
- Then exactly **one** blank-delay action, also set to 200 ms.
- Not 16 separately-added normal actions.

This establishes the sample-level correspondence:
- The first 16 populated records represent the one user-created simultaneous-button action.
- The next 16 populated records represent the one user-created blank-delay action.
- Therefore, in this sample, each 200 ms UI step corresponds to 16 identical 18-byte state records (32 records total for the two steps).
- 200 ms / 16 = 12.5 ms per record as a mathematical average only. Do not assert this is the controller playback tick or exact record duration until verified from official playback/format documentation.
- This observation creates a discrepancy with the previously inspected archived `script_17.js` first-pass delay expansion formula, which appeared to produce one record for a 200 ms step. Re-open and re-evaluate the exact delay expression and its input field, and establish whether the archived source snapshot differs from the live export implementation. Do not silently force the sample into the archived formula or change the observed 16+16 record count.


### Section 13 follow-up — second user-supplied APG + JSON pair, automated cross-check (2026-11-21)

The user uploaded a new APG file and its companion JSON export directly to the repository, then both files were moved into `verification/apg-sample-validator/`. The earlier sample-specific hash was not reused.

**Exact new APG observations from GitHub Actions (Node.js 22):**
- File: `verification/apg-sample-validator/Auto.apg`.
- Size: **1,048,576 bytes (1 MiB)**.
- SHA-256: `4db8546e0f81620a05c7606888897b4ab46f38823ea809b2c386848c92eaacb2`.
- The first 576 bytes are 32 records × 18 bytes.
- The remaining 1,048,000 bytes are uniformly `0xFF`.
- Every record has `0x02` at relative byte offset 15.
- The big-endian 16-bit counter begins at 11 and advances by 14, ending at 445.
- The first 16 records repeat the same 16-byte controller state; the next 16 records repeat another state.
- The second group's axes decode as four centered `0x0800` values; triggers, both button-mask bytes and D-pad are zero.

**Companion JSON observations:**
- File: `verification/apg-sample-validator/macro.json`.
- `macroList` contains exactly two steps.
- Step 1 is a non-blank action with 200 ms delay and 21 selected button entries.
- Step 2 is a blank delay with 200 ms delay, no buttons and no stick directions.
- The normal action JSON includes both `LT` and `RT`; the corresponding APG trigger fields are non-zero.
- The normal APG state has non-zero button-mask and D-pad fields.

**Automated verification:**
- GitHub Actions workflow: `.github/workflows/validate-apg-sample.yml`.
- Validator: `verification/apg-sample-validator/verify-apg.mjs`.
- Successful run: https://github.com/ankpsx/gulikit-source/actions/runs/44905863216 (run 4, conclusion `success`).
- Job log reports PASS for file size, JSON step count/types/delays, 16+16 record grouping, repeated state within each group, neutral blank state, LT/RT non-zero trigger correspondence, normal button/D-pad presence, marker, counter progression, and uniform `0xFF` tail.
- The validator is intentionally sample-scoped. It does not yet decode and verify every individual button bit against all 21 JSON entries, nor establish a universal APG rule or per-record playback duration.
- This is direct binary evidence from the user's new uploaded file, checked in the GitHub-hosted runner; it is distinct from the earlier deleted sample. The new SHA-256 differs from the old sample's hash.

**Important limitation:** successful checks establish agreement only for the fields explicitly tested. Do not describe this as a complete byte-for-byte serialization proof for every selected control. The official source-to-field mapping still requires full deobfuscation and a direct check of each selected identifier against its corresponding bit/value.


## 14. Final product goal — bidirectional local APG application (user-confirmed, 2026-11-21)

### Product objective

The final deliverable is a **Windows desktop application that works locally and offline**, without depending on the GuliKit website, which supports both directions:

1. **JSON → APG generation:** import an editable macro JSON configuration, allow the user to create/edit/reorder macro actions and their controls/delays, then generate a GuliKit-compatible `.apg` file.
2. **APG → JSON reading:** open an existing `.apg` file, parse its macro/action records and recognized controls/delays, display the recovered actions in the editor, and export the parsed configuration as editable JSON.
3. **Bidirectional editing/conversion:** allow a user to read an existing APG, edit the recovered macro, save JSON, and generate a new APG. Also support JSON import followed by APG generation.
4. **Validation and fidelity:** compare parsed/generated results at the semantic and byte levels where justified by verified format knowledge; report unsupported or ambiguous data rather than silently guessing.
5. **Unknown-data preservation:** when reading an APG, retain unrecognized bytes, fields, padding, and record data wherever possible. If the user re-exports without changing the corresponding content, preserve it rather than discarding or rewriting it. Unknown data must not be misrepresented as understood.
6. **Windows delivery:** provide a graphical desktop interface and ultimately package the application as a Windows `.exe`. The application must be usable offline after installation.

### Core interface capabilities

- Open/import APG and JSON files.
- Display an ordered macro-step list.
- Edit ordinary actions, selected buttons, stick directions/axes, triggers, action delays, and blank-delay steps, to the extent each capability is confirmed by format/source analysis.
- Add, remove, duplicate, reorder, and edit actions.
- Export JSON configuration.
- Generate/export APG.
- Show parse warnings, unsupported fields, and validation differences clearly.

### Engineering requirements and acceptance criteria

- Do not implement a one-way APG writer only: APG reading/parsing and JSON export are required first-class features.
- Do not treat the current single APG/JSON sample as a complete specification. Current sample checks are sample-scoped and do not prove every button bit, stick direction, delay rule, or all APG variants.
- Trace official editor UI identifiers through internal state and serialization. For APG parsing, establish field boundaries, record counts, padding/fill behavior, and any version/device distinctions from evidence.
- Build a reusable APG codec layer with separate, testable operations for parsing APG to an intermediate representation/JSON and serializing that representation to APG.
- Keep parsing loss-aware: preserve raw source bytes and unknown fields so a read/edit/write cycle does not destroy information that the parser cannot yet interpret.
- Test both directions against user-provided APG + JSON pairs, including semantic comparisons and byte-for-byte comparisons only where exact preservation is expected.
- Expand automated tests to cover individual buttons, all stick directions, triggers, blank delays, multiple steps, ordering, unusual/unknown records, and malformed/truncated files.
- Do not package or describe the application as complete until APG reading, APG generation, JSON import/export, and Windows offline operation have all been tested.

### Development priority

1. Continue source and sample analysis until the APG record layout, per-control mappings, delay expansion, and file-size/fill behavior are sufficiently established.
2. Implement and test the APG parser (APG → intermediate model/JSON), including preservation of unknown data.
3. Implement and test the APG serializer (JSON/intermediate model → APG), comparing its output with official-editor samples.
4. Complete the GUI for editing and bidirectional conversion.
5. Package and test the offline Windows executable.

This section records the user's final product requirement; it is a product specification, **not evidence that the APG format or implementation is already complete**.


---

## 15. Current remaining work and execution checklist (user-requested, 2026-11-21)

This section is the current actionable backlog for completing the user-confirmed offline Windows APG bidirectional application. It records work that remains to be done; it must not be read as a claim that these features have already been implemented or verified.

### A. Finish the format investigation

- [ ] Re-fetch and inspect the current official GuliKit editor source, especially `js/script_17.js` (`macroEditor.js`), and trace the complete `generateAPGContent()` path from UI state to every output byte.
- [ ] Resolve the exact APG output allocation size and initialization/fill behavior. Reconcile the older 1,024-byte interpretation, the 1 MiB sample, and the observed `0xFF` sample tail using the actual source expression and actual binary bytes. Do not leave contradictory interpretations presented as simultaneously current facts.
- [ ] Decode the exact delay-to-record expansion formula, including normal action delay, blank-delay behavior, boundary values, and rounding/clamping behavior.
- [ ] Trace all UI control identifiers into the serializer and establish the complete mapping for every button, trigger, D-pad direction, and all eight stick directions. Mark any mapping that cannot be proven as unresolved.
- [ ] Establish record sequencing, counter behavior/wraparound, header/version/device markers (if any), trailing padding, and whether multiple APG variants exist.
- [ ] Confirm whether the official web editor has an APG import/parser. Distinguish JSON configuration import from binary APG import; do not describe JSON import as APG import.

### B. Build the APG codec (core functionality)

- [ ] Define a documented intermediate macro model that can represent every confirmed JSON/APG field without losing action order or simultaneous inputs.
- [ ] Implement APG binary parsing: APG → intermediate model → JSON. Validate file length, record boundaries, markers, counters, and malformed/truncated input.
- [ ] Implement APG serialization: JSON/intermediate model → APG. Match official output behavior only where supported by source and sample evidence.
- [ ] Preserve original bytes and unknown fields/records when parsing and re-exporting. If a file cannot be safely interpreted or modified, report the limitation instead of silently discarding or fabricating data.
- [ ] Keep parser and serializer independent from the GUI so they can be tested automatically and reused by the application.

### C. Expand evidence and automated validation

- [ ] Use the existing sample pair in `verification/apg-sample-validator/Auto.apg` and `macro.json` as a baseline, not as a complete format specification.
- [ ] Add isolated test fixtures or independently generated samples for each individual button, all eight D-pad directions, all eight stick directions on both sticks, LT/RT, simultaneous controls, normal delays, blank delays, and multiple ordered actions.
- [ ] Add tests for zero/minimum/maximum/unusual delay values, record counter wraparound, unknown bytes, alternate markers/versions if found, empty files, wrong-size files, and truncated records.
- [ ] Compare APG → model/JSON → APG semantically for all supported fields. Require byte-for-byte equality only for cases where lossless preservation is the stated expectation.
- [ ] Make validation output explicit about what passed, what is only sample-specific, and what remains unproven. A passing current sample validator must not be presented as proof of complete APG compatibility.

### D. Build the Windows offline application

- [ ] Create the desktop application shell (Electron is a viable option, but the final framework choice should be based on maintainability and packaging needs).
- [ ] Implement JSON import, APG import, action-list editing, adding/removing/duplicating/reordering actions, editing simultaneous buttons/stick directions/triggers/delays, and blank-delay actions.
- [ ] Implement JSON export and APG export using the tested codec layer.
- [ ] Provide clear parse errors, unsupported-field warnings, validation results, and safeguards against exporting data that would lose unknown information.
- [ ] Ensure the application works fully offline after installation and does not depend on the official GuliKit website or remote APIs for core conversion.

### E. Package, test, and deliver

- [ ] Build a Windows x64 installer/executable.
- [ ] Test installation, launch, import, edit, export, and reopen workflows on Windows.
- [ ] Test that the packaged application works without an internet connection.
- [ ] Verify generated APG files against the official editor/device behavior where a safe test path is available; do not claim device compatibility solely from internal round-trip tests.
- [ ] Publish the finished application source/build artifacts and concise user instructions in the existing project repository, without creating another knowledge document.

### Recommended execution order

1. Resolve the official serializer and sample discrepancies.
2. Complete control mappings and delay semantics with isolated evidence.
3. Implement the loss-aware APG parser and tests.
4. Implement the APG serializer and bidirectional round-trip tests.
5. Build the editing GUI and JSON/APG import/export workflows.
6. Package the offline Windows application and perform end-to-end verification.

### Completion definition

The project is complete only when a user can independently open an APG file and export its contents to JSON, open/edit JSON and generate an APG file, edit parsed APG actions and export them again without unintended information loss, and run these workflows in the packaged Windows application offline. Any unsupported or unverified APG fields must be disclosed rather than guessed.

**Maintenance rule:** Keep this backlog and all APG project knowledge in this single file, `ai-knowledge/APG_KNOWLEDGE.md`. Do not create a second knowledge file, dated copy, or parallel specification. Update checklist items only when implementation or verification evidence exists, and re-fetch the file after each GitHub update to confirm the change.


---

## 16. Official-source audit — first pass (2026-11-21)

This is a source-derived preliminary audit of the current repository copies of the official GuliKit macro editor. It takes precedence over assumptions inferred only from the sample binary where the two disagree, but it does not yet resolve why the current source and the archived sample differ.

### Official files re-fetched

- `js/script_17.js` — official macro editor source, mapped by `js/script_list.txt` to `https://macro.gulikit.com/./js/macroEditor.js`. Current repository blob SHA: `60be095e889ef9a248882c2444513c9c74db8dfb`; 234,346 characters.
- `js/index.html` — official page entry. Current repository blob SHA: `916814fd8695c1f0dc5b94ffc174c13baf8aa9d1`.
- `js/script_16.js` — official `http.js` helper. Current repository blob SHA: `01873c3ffbe31b57cd32446c76531ee9d2fddd2a`.
- `js/script_list.txt` maps `script_17.js` to the official `macroEditor.js` URL and `script_16.js` to `http.js`.

### Findings directly visible in the official source

1. **The official macro editor generates APG but its built-in import path is JSON configuration import.**
   - `generateAPGContent()` creates a `Uint8Array`, and `exportAPG()` wraps its buffer in an APG download Blob.
   - `exportConfig()` serializes `fileName`, `macroList`, and `version` to JSON.
   - `importConfig()` uses `FileReader.readAsText()`, parses the content with `JSON.parse()`, and requires a `fileName` plus an array-valued `macroList`.
   - The page binds its import-file input to `importConfig`. The inspected editor source has no `readAsArrayBuffer()`, `parseAPG()`, or binary APG import routine. Therefore the official page's “Import File” function must not be represented as proof that it can read APG binaries.
   - The inspected `http.js` helper contains no APG parser or APG-specific keyword path. Its role is separate from the binary serializer.

2. **Current official serializer allocates a 1 MiB output buffer.**
   - In `generateAPGContent()`, the two operands passed to the local multiplication helper each evaluate to 1,024; their product is 1,048,576 bytes.
   - This is source evidence for a 1 MiB allocation in the currently fetched official script, not a 1,024-byte output allocation.

3. **Current official serializer explicitly fills the unused tail with byte `0x67`.**
   - After writing records, a loop fills every remaining byte from the end of the written records to the end of the allocated buffer.
   - The fill expression evaluates to decimal 5,991; assignment to a `Uint8Array` truncates it to the low byte, `0x67`.
   - This conflicts with the archived sample observation that its tail is all `0xFF`. Do not silently reconcile these observations. Investigate whether the sample came from a different official editor revision, a different export path, or another transformation. Until then, treat the fill byte as source-version-specific and the `0xFF` tail as sample-specific.

4. **The source loop uses 18-byte records.**
   - The serializer computes each record base as a record index multiplied by 18 and writes fields at offsets within that record.
   - The source writes axis values as two bytes each, two trigger values as two bytes each, button masks, a D-pad value, a fixed marker byte, and a two-byte rolling counter. The exact complete field mapping still needs a line-by-line decoded audit.

5. **The delay expansion expression requires careful validation against the sample.**
   - The visible expression for the per-action record count is `Math.ceil(delay * 259 / 1000)` after evaluating the obfuscated integer constants in the current source.
   - This is the expression present in the fetched script; it must not yet be promoted to a universal timing rule because the archived 200 ms sample's previously observed record count does not straightforwardly match this result.
   - Re-check the actual state property feeding this expression, the exact per-step loop behavior, and sample provenance before implementing the delay conversion. Do not substitute a guessed 16-record-per-200-ms rule.

### Immediate follow-up investigation

- [ ] Decode the official obfuscation table systematically so every property name, control identifier, and serializer branch is readable and independently auditable.
- [ ] Verify the source-derived 1 MiB buffer and `0x67` tail behavior by running a controlled export from the current official page or obtaining a current official-generated file, if possible without asking the user.
- [ ] Explain the current-source `0x67` tail versus archived-sample `0xFF` tail discrepancy with version/provenance evidence.
- [ ] Trace the exact property used for per-action duration and all calculations that determine record count.
- [ ] Decode every control mapping, including all stick directions and the five currently unresolved secondary-mask controls, from official UI state through serializer writes.
- [ ] Inspect all other official page scripts and linked resources only where they can affect macro state, APG serialization, file import, or export.

**User-provided material policy:** Do not ask the user for another file or sample while the needed information can still be obtained from official GuliKit source, official page resources, or the repository's existing samples. Ask only after documenting which official sources were checked and exactly what missing fact cannot be established from them.


---

## 17. Clarification of the official web editor workflow (user-confirmed, 2026-11-21)

The user clarified the official website's actual workflow: the official web page is a graphical macro/action-step editor. The user creates and edits ordered action steps visually in the GUI. The resulting macro configuration can be saved/exported as a JSON file, and the same editor can generate/export an APG binary file from the configured action steps.

This distinction is important:

- The GUI is the authoring environment for macro action steps.
- JSON is an editable configuration representation that can be saved/exported and later imported by the official editor.
- APG is the binary output generated by the official serializer for use with supported GuliKit controllers.
- JSON export and APG export are two output paths from the same GUI/action model; it is misleading to describe the official page merely as a JSON-to-APG converter that requires the user to prepare JSON externally.
- The local application must reproduce the visual action-step authoring/editing experience, support JSON import/export, and generate APG offline.
- Separately, the local application must add the missing capability under investigation: importing/reading an existing APG binary, reconstructing editable action steps, and exporting the recovered configuration to JSON or re-generating APG after edits.

Implementation implications:

1. Model the official GUI's action-step state and controls as the central intermediate representation.
2. Implement GUI action authoring/editing and JSON import/export around that representation.
3. Reproduce the official APG serializer from source evidence and validate generated output against official-exported APG samples.
4. Implement an independent, loss-aware APG binary parser to populate the same intermediate representation.
5. Keep APG parsing and APG serialization as distinct codec operations; do not confuse JSON configuration import with APG binary import.

This section clarifies the product workflow and supersedes any shorthand wording that implies the official web editor only converts a pre-existing JSON file into APG. It does not change the requirement that the local application must support both APG import and APG export.


## 18. Official editor UI operation, JSON model, and JSON-to-APG serializer trace (2026-11-21)

### 18.1 UI operation verified from official HTML/JavaScript

The official editor is a two-panel GUI:

- Left panel: dynamically rendered controller/button selection UI, with button controls and left/right stick direction controls. The visible heading is Button Selection / 手柄按键选择.
- Right panel: Macro Editor / 宏编辑器, which displays the ordered action-step list.
- The selection panel has an Add To Steps action and a Clear Selection action. Selected buttons and stick directions are staged in the current selection; Add To Steps snapshots them into one macro step.
- A Delay (ms) input controls the delay associated with a normal step. The default app state observed in source is 200 ms.
- Add Blank Delay creates a separate step with empty buttons and sticks, a delay value from the blank-delay input (default 200 ms), and isBlankDelay=true.
- Normal Add To Steps creates a step with copies of selectedButtons and selectedSticks, the current stepDelay, and isBlankDelay=false; after adding, the selection is cleared.
- The macro list supports visual reordering (drag-and-drop is initialized in the editor) and per-step/list editing controls; Clear List clears the macro list.
- File Name sets the configuration name. File Management offers Import File, Save File, and Export APG File.
- The UI source includes PC/Switch ABXY-layout handling. The APG serializer explicitly branches on the active PC vs non-PC mode for A/B/X/Y bit assignments, so the mode is semantically important and must be represented in the local editor.

### 18.2 JSON configuration structure confirmed by source and the repository sample

The official JSON export constructs this top-level object:

- fileName: current file name.
- macroList: ordered array of action-step objects.
- version: currently exported as "1.0".

Each normal action-step object contains:

- id: string-like unique step identifier.
- buttons: array of selected button descriptors. Each descriptor contains id, label, type, and position {row, col}.
- sticks: array of selected stick-direction descriptors. Each contains stick {id, label, type, position}, direction, and value.
- delay: delay in milliseconds.
- isBlankDelay: false.

A blank-delay step contains id, buttons: [], sticks: [], delay, and isBlankDelay: true.

The checked sample macro.json is a concrete example: two ordered steps, first a normal combined input action with 21 button descriptors and 8 stick-direction entries at 100%, delay 200 ms; second an empty blank-delay step at 200 ms. This confirms that a step can represent simultaneous button/stick inputs, not just one key per step.

The official importConfig() uses FileReader.readAsText(), JSON.parse(), and accepts the object when fileName is truthy and macroList is an array. It then replaces appState.fileName and appState.macroList and refreshes the macro list UI. This is JSON import, not APG binary import. The import check is relatively shallow; a robust local application should validate each step and descriptor before accepting it.

### 18.3 JSON save/export and APG export are separate actions from the same in-memory model

- Save File calls exportConfig(). It serializes {fileName, macroList, version:"1.0"} as formatted JSON and downloads a .json file using the current fileName.
- Export APG File calls exportAPG(), which rejects an empty macroList, calls generateAPGContent(), wraps the returned bytes in an APG Blob, and downloads the APG output.
- Therefore the official path is GUI action model -> JSON file OR GUI action model -> APG binary. The APG serializer does not first read the downloaded JSON file; both exports consume the same appState.macroList in memory.
- To implement JSON -> APG locally, the correct pipeline is JSON import -> validate/normalize JSON into the same action-step model -> run the APG serializer -> write binary .apg. It is not a text conversion or renaming operation.

### 18.4 Further serializer facts recovered from generateAPGContent()

The deobfuscated arithmetic and direct source expressions establish:

- The output buffer is 1,048,576 bytes (1 MiB), allocated as Uint8Array.
- Each generated record is 18 bytes.
- For each macroList step, the serializer computes a record-repeat count as ceil(delay_ms * 79 / 1000). This explains the sample's 200 ms -> 16 records per step: ceil(200 * 79 / 1000) = 16. This is the source-derived repeat-count rule in the audited script revision; edge cases and compatibility across firmware/editor revisions still need tests.
- The serializer iterates through each step and emits that step's state repeatedly for the calculated count, subject to output-buffer capacity.
- The first four 16-bit axis values are written big-endian. The code builds separate X/Y values for left and right sticks from direction/value entries; values are scaled from the JSON percentage value. A missing direction leaves the corresponding neutral/default value.
- Trigger values are written in dedicated 16-bit fields; LT and RT selection causes the corresponding trigger field to be set to its active value.
- Button state is encoded into button bitmasks. A/B/X/Y mapping changes with PC vs Switch layout. LB/RB/LT/RT and stick-click/other buttons are handled in the button masks.
- D-pad direction is encoded as a separate value derived from selected D-pad button IDs.
- The record also contains a fixed marker field and a rolling counter. The existing sample confirms marker byte 0x02 and counter start 11/increment 14 for that sample; retain these as source/sample-specific facts pending exhaustive tests.
- The source fills all unused bytes after generated records with 0x67 (the Uint8Array truncation of its arithmetic expression). This conflicts with the existing Auto.apg sample, whose unused tail is 0xFF. Do not silently choose one fill byte: this remains an important source-versus-sample discrepancy requiring investigation, likely involving source revision, export path, or sample provenance.

### 18.5 Local implementation requirements derived from this audit

1. Reproduce the two-panel action editor and staged selection -> Add To Steps workflow.
2. Support simultaneous buttons and multiple stick directions within one step.
3. Support normal step delay and independent blank-delay steps.
4. Preserve order and allow step reordering/editing/deletion and list clearing.
5. Preserve PC/Switch ABXY layout as an explicit model setting and test both modes.
6. Implement strict JSON validation and normalization, including IDs, button descriptors, stick descriptors, delay bounds, blank-delay semantics, and version handling.
7. Implement JSON save/export and APG export as distinct commands over one shared action model.
8. Implement the source-derived APG record expansion and mapping, but keep the 0x67 vs 0xFF tail conflict unresolved until tested against fresh official exports.
9. Add golden tests for 200 ms, non-200 ms, blank delay, simultaneous buttons/sticks, PC/Switch ABXY mapping, zero/very short/large delays, buffer capacity, and malformed JSON.

This section records source-level findings from the audited official script_17.js and index.html plus the checked-in Auto.apg/macro.json pair. It does not claim that a complete APG parser or finished local GUI/serializer has already been implemented.


## 19. 2026-11-21 follow-up: direct APG field and button-mask audit

A second pass over the complete `generateAPGContent()` body in `js/script_17.js` independently checked the arithmetic expressions used for record construction. The source file blob SHA remains `60be095e889ef9a248882c2444513c9c74db8dfb`.

### 19.1 Record layout confirmed from write expressions

The serializer addresses the following byte positions relative to each 18-byte record:

| Byte offset | Meaning | Evidence |
|---|---|---|
| 0-1 | Left stick X | 16-bit high byte then low byte |
| 2-3 | Left stick Y | 16-bit high byte then low byte |
| 4-5 | Right stick X | 16-bit high byte then low byte |
| 6-7 | Right stick Y | 16-bit high byte then low byte |
| 8-9 | LT trigger value | 16-bit high byte then low byte |
| 10-11 | RT trigger value | 16-bit high byte then low byte |
| 12 | First button bitmask | A/B/X/Y, LB/RB/LT/RT |
| 13 | Second button bitmask | L3/R3 and additional controls |
| 14 | D-pad value | Separate direction code |
| 15 | Record marker | Source writes constant 0x02 |
| 16-17 | Counter | 16-bit high byte then low byte |

This confirms the 18-byte record layout at source level. The 1 MiB allocation is also directly expressed as a multiplication of two independently evaluated 1024 constants; it is not a 1024-byte buffer. The record width expression evaluates to 18.

### 19.2 Button mask values calculated from source expressions

The first mask is written at byte 12. The arithmetic expressions in the switch statement evaluate to:

| Button | PC layout | Alternate layout |
|---|---:|---:|
| A | 0x02 | 0x01 |
| B | 0x01 | 0x02 |
| X | 0x08 | 0x04 |
| Y | 0x04 | 0x08 |
| LB | 0x10 | 0x10 |
| RB | 0x20 | 0x20 |
| LT | 0x40 | 0x40 |
| RT | 0x80 | 0x80 |

The second mask is written at byte 13. The source expressions calculate L3 = 0x02 and R3 = 0x01. Other second-mask cases are present in the same switch, but their identifiers still need to be mapped unambiguously before documenting their names.

These are source-derived mask values, not guesses from the sample. The alternate layout is the non-PC branch in the official code; the UI's explicit layout setting must be preserved in the local application.

### 19.3 Trigger and D-pad construction

- The serializer initializes both trigger fields to zero for each record.
- For a non-blank step, presence of button ID `LT` sets the LT field to 4095; presence of `RT` sets the RT field to 4095.
- Blank-delay steps bypass button/stick processing, leaving both trigger fields at zero.
- D-pad is stored separately at byte 14 and is derived from the selected D-pad button IDs. It is not merged into the two ordinary button masks.
- The source emits the marker constant 0x02 at byte 15.
- Counter is serialized as two bytes at offsets 16 and 17. Existing sample evidence remains counter start 11 and +14 per record; the exact source-side counter update/reset condition should receive a dedicated boundary test before treating that sequence as universal.

### 19.4 Tail-fill expression

The source's tail-fill arithmetic is `0x16b + (-0x955 * 4) + (0x49d * 8)`, which evaluates to decimal 5991. Assignment to a Uint8Array truncates this to its low byte, `5991 mod 256 = 0x67`. Thus the official source revision currently under audit fills the unused output buffer with 0x67. This does not resolve why the checked-in `Auto.apg` sample has an all-`0xFF` unused tail; that source/sample discrepancy remains open and must not be hidden by the implementation.

### 19.5 Remaining work after this pass

1. Decode the remaining second-mask case identifiers and document their exact button names and values.
2. Decode and independently verify every D-pad code and the stick percentage-to-axis conversion, including sign, neutral center, clamping, and rounding.
3. Verify counter progression and reset conditions across more than one 18-record boundary.
4. Generate fresh official APG exports at several delay values and compare them byte-for-byte with a source-faithful local serializer.
5. Investigate the 0x67 source tail versus 0xFF sample tail before choosing a compatibility policy.
6. Expand the validator to test every byte field and delay/buffer edge case.

This section is an additional source audit only. It does not claim that the local parser, serializer, or Windows GUI has been implemented.
