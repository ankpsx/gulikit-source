# GuliKit APG Editor (experimental)

A local-first browser UI for the APG codec modules in this repository.

## Run locally

From the repository root:

```bash
python -m http.server 8000
```

Open http://localhost:8000/editor/. The page loads only local ES modules and CSS; no CDN, remote API, or account is required. Keep the repository's `codec/` directory beside `editor/`.

## Included workflows

- Import JSON and preserve its supported official fields; internal APG provenance metadata is omitted from exported JSON.
- Import APG with PC/SWITCH interpretation, conservative record-range detection, or an explicit record count.
- Edit each step's delay, button/D-pad/trigger selections, and cardinal stick direction/strength.
- Add action steps and blank-delay steps; delete and reorder steps.
- Export JSON or APG. Unchanged imported runs are copied byte-for-byte when provenance and baseline match; changed/new steps are regenerated.
- For APG imports, marker/counter settings are inferred from the original record stream only when the marker is constant and the counter delta is constant. Enter all three values to override.
- For JSON/new configurations, APG export requires explicit marker, counter start, and counter increment. No single-sample defaults are silently assumed.

## Important limitations

- APG-to-step reconstruction is inferred. Adjacent identical states may merge, and exact original boundaries or delay values may be unrecoverable.
- Stick values are approximate inversions of quantized axes. Only cardinal directions are exposed.
- Reordering copied runs may create counter discontinuities; the result reports them instead of silently rewriting copied records.
- APG tail fill and unknown device-specific metadata remain incompletely established. Review export warnings and test with independent device-generated files.
- This is an experimental browser editor shell, not yet a packaged Windows EXE or validated device-write workflow.
