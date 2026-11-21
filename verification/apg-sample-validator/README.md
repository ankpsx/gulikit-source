# APG sample validator

This directory contains a standalone Node.js validator for the user-provided
`Auto.apg` sample exported from the GuliKit browser editor.

## Scope

The checks are deliberately **sample-specific**. They validate the exact observed
binary characteristics of this one file; they do not define a universal APG
specification and do not generate APG files.

The validator checks:

- file size: 1,048,576 bytes (1 MiB);
- SHA-256: `15b6c5f4d55e50e08e734c9e337f7b739b3d42c612917941373a4b6c66707617`;
- 32 populated records, each 18 bytes (576 bytes total);
- records 1–16 and 17–32 have the two expected 16-byte state prefixes;
- each record has marker byte `0x02` at relative offset 15;
- the big-endian 16-bit counter at offsets 16–17 starts at 11 and increases by 14;
- every byte from absolute offset 576 to EOF is `0xFF`.

The two groups correspond to the user's described setup: one simultaneous-button
action with 200 ms delay, followed by one blank-delay action with 200 ms delay.
The validator checks the observed 16+16 record grouping; it does **not** infer
that each record lasts 12.5 ms or that this timing applies to other files.

## Requirements

- Node.js 18 or newer (uses built-in modules only).

## Run

Extract `Auto.apg` from the supplied ZIP, then run:

```bash
node verify-apg.mjs /path/to/Auto.apg
```

On Windows PowerShell, for example:

```powershell
node .\verify-apg.mjs .\Auto.apg
```

The process exits with code 0 only when all checks pass; otherwise it prints
each failed check and exits with code 1.

## Important source/sample distinction

The archived editor source is `js/script_17.js`, in
`generateAPGContent()`. Its record stride expression resolves to 18 bytes,
and its buffer-allocation expression resolves to 1 MiB when the outer
multiplication is included.

The sample's `0xFF` trailing fill is a directly observed property of this
`Auto.apg` file. Do not assume it is a universal APG padding rule. The
archived source's trailing-fill expression and the sample's `0xFF` tail still
need a separate exact reconciliation. This validator therefore tests the
sample, not a reconstructed serializer.

## Provenance

Expected sample facts are recorded in `ai-knowledge/APG_KNOWLEDGE.md`,
Section 13. The sample itself is not copied into this repository.
