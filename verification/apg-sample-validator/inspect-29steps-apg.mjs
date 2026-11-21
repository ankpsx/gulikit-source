#!/usr/bin/env node
/**
 * Inspect the repository's 29-step official APG sample without modifying it.
 * This is a sample-specific forensic report, not a universal APG decoder.
 */
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const file = process.argv[2] ?? "Official.29steps.apg";
const EXPECTED_SHA = "196a5ca439aab90dc8997721fe4c1e4a26c2280f";
const SIZE = 1024 * 1024;
const STRIDE = 18;
const MARKER_OFFSET = 15;
const COUNTER_OFFSET = 16;

const data = await readFile(file);
const sha = createHash("sha1").update("blob " + data.length + "\0").update(data).digest("hex");
const sha256 = createHash("sha256").update(data).digest("hex");

console.log("# Official.29steps.apg binary inspection");
console.log("");
console.log(`- File: ${file}`);
console.log(`- Size: ${data.length}`);
console.log(`- Git blob SHA-1: ${sha}`);
console.log(`- SHA-256: ${sha256}`);
console.log(`- Expected Git blob SHA-1: ${EXPECTED_SHA}`);
console.log(`- Git blob SHA matches: ${sha === EXPECTED_SHA ? "YES" : "NO"}`);
console.log("");

if (data.length !== SIZE) throw new Error(`Expected ${SIZE} bytes, got ${data.length}`);
if (sha !== EXPECTED_SHA) throw new Error("Binary does not match the committed Git blob; refusing to infer metadata.");

const totalRecords = Math.floor(data.length / STRIDE);
const records = Array.from({ length: totalRecords }, (_, i) => data.subarray(i * STRIDE, (i + 1) * STRIDE));
const markerCounts = new Map();
for (const r of records) markerCounts.set(r[MARKER_OFFSET], (markerCounts.get(r[MARKER_OFFSET]) ?? 0) + 1);

console.log("## Record layout scan");
console.log(`- Record stride: ${STRIDE} bytes`);
console.log(`- Complete slots in 1 MiB: ${totalRecords}`);
console.log("- Byte 15 marker histogram (hex: count):");
for (const [marker, count] of [...markerCounts].sort((a,b) => b[1]-a[1])) {
  console.log(`  - 0x${marker.toString(16).padStart(2,"0")}: ${count}`);
}
console.log("");

const candidates = [];
for (const [marker, count] of markerCounts) {
  if (count < 2) continue;
  let end = 0;
  while (end < records.length && records[end][MARKER_OFFSET] === marker) end++;
  if (end < 2) continue;
  const deltas = new Map();
  for (let i = 1; i < end; i++) {
    const prev = records[i-1].readUInt16BE(COUNTER_OFFSET);
    const curr = records[i].readUInt16BE(COUNTER_OFFSET);
    const delta = (curr - prev + 65536) % 65536;
    deltas.set(delta, (deltas.get(delta) ?? 0) + 1);
  }
  const ranked = [...deltas].sort((a,b) => b[1]-a[1]);
  const [step, matches] = ranked[0] ?? [null, 0];
  let validPrefix = 1;
  if (step !== null) {
    while (validPrefix < end) {
      const prev = records[validPrefix-1].readUInt16BE(COUNTER_OFFSET);
      const curr = records[validPrefix].readUInt16BE(COUNTER_OFFSET);
      if ((curr - prev + 65536) % 65536 !== step) break;
      validPrefix++;
    }
  }
  candidates.push({ marker, markerCount: count, prefix: end, step, deltaMatches: matches, validPrefix });
}

console.log("## Contiguous prefix candidates");
if (!candidates.length) console.log("- No marker value forms a contiguous prefix of at least two records.");
for (const c of candidates.sort((a,b) => b.validPrefix-a.validPrefix)) {
  console.log(`- marker=0x${c.marker.toString(16).padStart(2,"0")}, contiguous marker prefix=${c.prefix}, modal counter delta=${c.step}, delta matches in prefix=${c.deltaMatches}/${Math.max(0,c.prefix-1)}, uninterrupted marker+counter prefix=${c.validPrefix}`);
}
console.log("");

const chosen = candidates.sort((a,b) => b.validPrefix-a.validPrefix)[0];
if (chosen) {
  const tail = data.subarray(chosen.validPrefix * STRIDE);
  const tailCounts = new Map();
  for (const byte of tail) tailCounts.set(byte, (tailCounts.get(byte) ?? 0) + 1);
  const tailUniform = tailCounts.size === 1;
  console.log("## Tail byte audit");
  console.log(`- Tail length after marker/counter prefix: ${tail.length}`);
  console.log(`- Uniform single-byte tail: ${tailUniform ? "YES" : "NO"}`);
  console.log(`- Tail byte histogram: ${[...tailCounts].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([b,n])=>"0x"+b.toString(16).padStart(2,"0")+":"+n).join(", ")}`);
  console.log("");
  const first = records[0].readUInt16BE(COUNTER_OFFSET);
  const lastIndex = Math.max(0, chosen.validPrefix - 1);
  const last = records[lastIndex].readUInt16BE(COUNTER_OFFSET);
  console.log("## Best observed contiguous candidate");
  console.log(`- marker: 0x${chosen.marker.toString(16).padStart(2,"0")}`);
  console.log(`- counterStart: ${first}`);
  console.log(`- counterStep: ${chosen.step}`);
  console.log(`- verified consecutive records: ${chosen.validPrefix}`);
  console.log(`- last verified counter: ${last}`);
  console.log(`- marker count over entire file: ${chosen.markerCount}`);
  console.log("- First 5 records (18-byte hex):");
  for (let i=0;i<Math.min(5,chosen.validPrefix);i++) console.log(`  - #${i}: ${records[i].toString("hex")}`);
  console.log("- Last 3 records in verified prefix (18-byte hex):");
  for (let i=Math.max(0,chosen.validPrefix-3);i<chosen.validPrefix;i++) console.log(`  - #${i}: ${records[i].toString("hex")}`);

  const json = JSON.parse(await readFile("Official.29steps.json", "utf8"));
  console.log("");
  console.log("## Per-step first-record state (16 records per 200 ms step, as observed in this sample)");
  console.log(`- JSON step count: ${json.macroList.length}`);
  console.log(`- JSON delay values: ${[...new Set(json.macroList.map(s => s.delay))].join(", ")} ms`);
  for (let i = 0; i < json.macroList.length; i++) {
    const step = json.macroList[i];
    const r = records[i * 16];
    const axes = [0,2,4,6].map(o => r.readUInt16BE(o));
    const buttons = [r[12], r[13], r[14]].map(v => "0x" + v.toString(16).padStart(2,"0")).join("/");
    const action = [
      ...(step.buttons ?? []).map(b => b.id),
      ...(step.sticks ?? []).map(s => `${s.stick.id}:${s.direction}:${s.value}`)
    ].join(",") || "blank";
    console.log(`- step ${String(i+1).padStart(2,"0")}: ${action}; axes=${axes.join("/")}; trigger=${r.readUInt16BE(8)}/${r.readUInt16BE(10)}; masks/dpad=${buttons}`);
  }
}
console.log("");
console.log("## Important interpretation limits");
console.log("- This report describes only this exact 29-step APG sample.");
console.log("- A candidate is not promoted to a universal APG marker/counter rule.");
console.log("- The 1 MiB buffer may contain padding or additional reserved data; marker histogram alone does not define the active record boundary.");
