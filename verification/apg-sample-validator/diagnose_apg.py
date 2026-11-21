#!/usr/bin/env python3
"""Read-only structural diagnostics for APG samples in this repository."""
from pathlib import Path
from collections import Counter
import hashlib, json, struct

ROOT = Path("verification/apg-sample-validator")
OUT = Path("apg-diagnostics")
OUT.mkdir(exist_ok=True)

def profile(path: Path):
    b = path.read_bytes()
    n = len(b)
    complete, rem = divmod(n, 18)
    marker = Counter(b[i*18+15] for i in range(complete))
    counters = [struct.unpack_from('>H', b, i*18+16)[0] for i in range(complete)]
    deltas = Counter(((counters[i] - counters[i-1]) & 0xffff) for i in range(1, len(counters)))
    suffix = {}
    for fill in (0xff, 0x67, 0x00, 0x20):
        p = n
        while p and b[p-1] == fill: p -= 1
        suffix[f'0x{fill:02x}'] = {'length': n-p, 'start_offset': p, 'aligned_to_18': p % 18 == 0, 'whole_records_before_suffix': p // 18 if p % 18 == 0 else None}
    invalid = Counter()
    for i in range(complete):
        r = b[i*18:(i+1)*18]
        vals = struct.unpack_from('>HHHH', r, 0)
        if any(v > 4095 for v in vals): invalid['axis_or_trigger_out_of_0_4095'] += 1
        if r[14] > 8: invalid['dpad_byte_gt_8'] += 1
    return {'file': str(path), 'size': n, 'sha256': hashlib.sha256(b).hexdigest(),
      'record_size': 18, 'complete_18_byte_records': complete, 'remainder_bytes': rem,
      'first_5_records_hex': [b[i*18:(i+1)*18].hex(' ') for i in range(min(5, complete))],
      'last_5_records_hex': [b[i*18:(i+1)*18].hex(' ') for i in range(max(0, complete-5), complete)],
      'marker_byte_15_counts': {f'0x{k:02x}': v for k,v in marker.most_common()},
      'counter_first_10': counters[:10], 'counter_last_5': counters[-5:],
      'counter_delta_counts': {str(k): v for k,v in deltas.most_common(12)},
      'counter_delta_distinct_count': len(deltas), 'common_fill_suffixes': suffix,
      'record_field_sanity': dict(invalid)}

files = sorted(ROOT.glob('*.apg'))
if not files: raise SystemExit(f'No APG files found under {ROOT}')
reports = [profile(p) for p in files]
(OUT / 'report.json').write_text(json.dumps(reports, indent=2), encoding='utf-8')
lines = ['# APG binary diagnostics', '', 'Read-only inspection; source APG files are not modified.', '']
for r in reports:
    lines += [f"## {Path(r['file']).name}", '',
      f"- Size: {r['size']:,} bytes; SHA-256: {r['sha256']}",
      f"- 18-byte records: {r['complete_18_byte_records']:,}; remainder: {r['remainder_bytes']}",
      f"- Marker byte 15: {r['marker_byte_15_counts']}",
      f"- Counter first 10: {r['counter_first_10']}",
      f"- Counter delta counts: {r['counter_delta_counts']} (distinct: {r['counter_delta_distinct_count']})",
      f"- Fill suffixes: {r['common_fill_suffixes']}",
      f"- Field sanity: {r['record_field_sanity']}", '', 'First records:', '```text',
      *r['first_5_records_hex'], '```', '']
(OUT / 'report.md').write_text('\n'.join(lines), encoding='utf-8')
print('\n'.join(lines))