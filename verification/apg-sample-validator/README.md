# APG sample validator

This directory contains the user-provided APG binary exported by the official GuliKit browser editor, its companion JSON export, and a Node.js cross-validator.

## Files

- `Auto.apg`: 1 MiB APG export.
- `macro.json`: JSON export describing the same macro configuration.
- `verify-apg.mjs`: checks APG record structure and compares tested fields with the JSON actions.

## Automated checks

This validator is scoped to this supplied two-step sample; it is not a universal APG specification or APG generator. It checks:

- APG file size is 1,048,576 bytes.
- JSON contains exactly two actions, both with 200 ms delay: a normal action with selected buttons, followed by a blank delay with no buttons or stick directions.
- The sample corresponds to 16 + 16 records of 18 bytes; each group repeats its controller state.
- The blank-delay state has centered axes and released triggers, buttons, and d-pad.
- The normal action has non-zero trigger fields for JSON LT/RT selections, plus non-zero button and d-pad fields.
- Each record has marker `0x02` at byte offset 15; the big-endian 16-bit counter advances by 14 per record.
- The unused area after the records is uniformly padded; the actual padding byte is reported rather than assumed to be universal.

The 16-record grouping is specific to this sample's 200 ms steps. It does not establish that each record lasts 12.5 ms or that the same grouping applies to other exports.

## Run locally

Requirements: Node.js 18 or newer; built-in modules only.

```bash
node verify-apg.mjs Auto.apg macro.json
```

The process exits with code 0 only when every check passes; otherwise it exits with code 1.

## GitHub Actions

`.github/workflows/validate-apg-sample.yml` runs this check whenever files in this directory change, and can also be started manually from the Actions tab.

## Source/sample distinction

The archived official editor source is `js/script_17.js`, in `generateAPGContent()`. Its record stride expression resolves to 18 bytes, and its buffer allocation resolves to 1 MiB when the outer multiplication is included. This validator tests only the supplied sample and explicitly listed fields; it does not claim to fully decode every APG field or define a universal APG format.
