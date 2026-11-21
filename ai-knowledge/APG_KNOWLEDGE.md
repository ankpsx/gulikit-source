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
