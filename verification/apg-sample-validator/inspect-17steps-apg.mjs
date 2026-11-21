#!/usr/bin/env node
/** Exact, sample-scoped inspection of the user-supplied official 17-step APG pair. */
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const apgPath = process.argv[2] ?? "Official.17steps.apg";
const jsonPath = process.argv[3] ?? "Official.17steps.json";
const SIZE = 1024 * 1024;
const STRIDE = 18;
const json = JSON.parse(await readFile(jsonPath, "utf8"));
const bytes = await readFile(apgPath);
const steps = json.macroList;
const hash = createHash("sha256").update(bytes).digest("hex");
const gitBlob = createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
const fail = [];
const report = [];

function check(ok, label, detail = "") {
  report.push(`${ok ? "PASS" : "FAIL"} ${label}${detail ? " — " + detail : ""}`);
  if (!ok) fail.push(label);
}
const recordCount = steps.reduce((sum, step) => sum + Math.ceil(step.delay * 79 / 1000), 0);
check(bytes.length === SIZE, "APG is 1 MiB", `size=${bytes.length}`);
check(steps.length === 17, "JSON contains 17 steps", `steps=${steps.length}`);
check(recordCount === 777, "official delay formula yields 777 records", `records=${recordCount}`);

const layoutMask = {
  PC: { A: 0x02, B: 0x01, X: 0x08, Y: 0x04 },
  SWITCH: { A: 0x01, B: 0x02, X: 0x04, Y: 0x08 },
};
const otherMask = { LB:0x10, RB:0x20, LT:0x40, RT:0x80 };
const secondMask = { R3:0x01, L3:0x02, START:0x04, SELECT:0x08, HOME:0x10 };
const dpadCode = { D_UP:1, D_UP_RIGHT:2, D_RIGHT:3, D_DOWN_RIGHT:4, D_DOWN:5, D_DOWN_LEFT:6, D_LEFT:7, D_UP_LEFT:8 };
function expectedState(step, layout) {
  const axes = { lx:2048, ly:2048, rx:2048, ry:2048 };
  let triggerL=0, triggerR=0, mask1=0, mask2=0, dpad=0;
  if (!step.isBlankDelay) {
    for (const s of step.sticks ?? []) {
      const m = Math.round((s.value || 0) * 2047 / 100);
      const prefix = s.stick?.id === "L_STICK" ? "l" : s.stick?.id === "R_STICK" ? "r" : null;
      if (!prefix) continue;
      if (s.direction === "UP") axes[prefix+"y"] = 2048 + m;
      else if (s.direction === "DOWN") axes[prefix+"y"] = 2048 - m;
      else if (s.direction === "LEFT") axes[prefix+"x"] = 2048 - m;
      else if (s.direction === "RIGHT") axes[prefix+"x"] = 2048 + m;
    }
    for (const b of step.buttons ?? []) {
      if (b.id === "LT") triggerL=4095;
      if (b.id === "RT") triggerR=4095;
      mask1 |= layoutMask[layout][b.id] ?? otherMask[b.id] ?? 0;
      mask2 |= secondMask[b.id] ?? 0;
      if (dpadCode[b.id]) dpad=dpadCode[b.id];
    }
  }
  const out=Buffer.alloc(15);
  out.writeUInt16BE(axes.lx,0); out.writeUInt16BE(axes.ly,2);
  out.writeUInt16BE(axes.rx,4); out.writeUInt16BE(axes.ry,6);
  out.writeUInt16BE(triggerL,8); out.writeUInt16BE(triggerR,10);
  out[12]=mask1; out[13]=mask2; out[14]=dpad;
  return out;
}
const candidates = {};
for (const layout of ["PC","SWITCH"]) {
  let offset=0, mismatches=[];
  for (let si=0;si<steps.length;si++) {
    const step=steps[si], n=Math.ceil(step.delay*79/1000), expected=expectedState(step,layout);
    for(let j=0;j<n;j++) {
      const actual=bytes.subarray(offset*STRIDE,offset*STRIDE+15);
      if (!actual.equals(expected) && mismatches.length<12) mismatches.push({step:si+1,record:offset,expected:expected.toString("hex"),actual:actual.toString("hex")});
      offset++;
    }
  }
  candidates[layout]={mismatchCount:mismatches.length,firstMismatches:mismatches};
  check(mismatches.length===0, `JSON action states match APG using ${layout} layout`, mismatches.length?JSON.stringify(mismatches[0]):"all expected record states match");
}
const markers = new Map();
for(let i=0;i<recordCount;i++) markers.set(bytes[i*STRIDE+15],(markers.get(bytes[i*STRIDE+15])??0)+1);
const markerValues=[...markers].map(([v,n])=>({value:"0x"+v.toString(16).padStart(2,"0"),count:n}));
const counters=[];
for(let i=0;i<recordCount;i++) counters.push(bytes.readUInt16BE(i*STRIDE+16));
const deltas=new Map();
for(let i=1;i<counters.length;i++){const d=(counters[i]-counters[i-1]+65536)&65535;deltas.set(d,(deltas.get(d)??0)+1);}
const tail=bytes.subarray(recordCount*STRIDE);
const tailValues=new Map(); for(const b of tail) tailValues.set(b,(tailValues.get(b)??0)+1);
const counterStable=deltas.size===1;
const tailUniform=tailValues.size===1;
check(markers.size===1,"all expected records share one marker",JSON.stringify(markerValues));
check(counterStable,"counter delta is constant",JSON.stringify([...deltas]));
check(tailUniform,"bytes after expected record area are uniform",`length=${tail.length}, values=${[...tailValues].map(([v,n])=>"0x"+v.toString(16).padStart(2,"0")+":"+n).join(",")}`);
report.unshift(`APG SHA-256: ${hash}`,`Git blob SHA-1: ${gitBlob}`,`APG size: ${bytes.length}`,`JSON steps: ${steps.length}`,`Formula record count: ${recordCount}`);
report.push(`Counter start: ${counters[0]}`,`Counter delta candidates: ${JSON.stringify([...deltas])}`,`Marker candidates: ${JSON.stringify(markerValues)}`,`Tail candidates: ${JSON.stringify([...tailValues].map(([v,n])=>({byte:"0x"+v.toString(16).padStart(2,"0"),count:n}))) }`);
report.push("Per-step expected APG state (first record):");
let recordOffset=0;
for(let i=0;i<steps.length;i++){
 const s=steps[i], count=Math.ceil(s.delay*79/1000), actual=bytes.subarray(recordOffset*STRIDE,recordOffset*STRIDE+16);
 report.push(`step ${i+1}: records=${count}, delay=${s.delay}, blank=${s.isBlankDelay}, buttons=${(s.buttons??[]).map(x=>x.id).join("+")||"-"}, sticks=${(s.sticks??[]).map(x=>x.stick.id+":"+x.direction+":"+x.value).join("+")||"-"}, first16=${actual.toString("hex")}`);
 recordOffset+=count;
}
console.log(report.join("\n"));
console.log(`RESULT: ${fail.length ? "FAIL: "+fail.join("; ") : "PASS"}`);
if(fail.length) process.exitCode=1;
