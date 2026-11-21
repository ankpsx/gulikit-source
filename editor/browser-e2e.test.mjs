import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { encodeAPG } from "../codec/apg-codec.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const mime = { ".html": "text/html; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" };

async function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
      const relative = pathname.endsWith("/") ? pathname + "index.html" : pathname;
      const file = resolve(root, "." + relative);
      if (file !== root && !file.startsWith(root + sep)) {
        res.writeHead(403).end("Forbidden");
        return;
      }
      const body = await readFile(file);
      res.writeHead(200, { "content-type": mime[extname(file)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404).end("Not found");
    }
  });
  await new Promise(resolveListen => server.listen(0, "127.0.0.1", resolveListen));
  return { server, url: `http://127.0.0.1:${server.address().port}/editor/` };
}

test("browser editor imports, edits, exports JSON and encodes APG", async t => {
  const { chromium } = await import("playwright");
  const { server, url } = await startServer();
  const browser = await chromium.launch({ headless: true });
  t.after(async () => { await browser.close(); await new Promise(r => server.close(r)); });
  const page = await browser.newPage({ acceptDownloads: true });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(url);
  await page.locator("#jsonFile").setInputFiles({
    name: "fixture.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({
      fileName: "fixture",
      version: "1.0",
      macroList: [
        { id: "press", buttons: [{ id: "A", label: "A", type: "button", position: { row: 0, col: 0 }, vendorField: "keep" }], sticks: [], delay: 200, isBlankDelay: false },
        { id: "pause", buttons: [], sticks: [], delay: 300, isBlankDelay: true }
      ]
    }))
  });
  await assert.doesNotReject(() => page.locator(".step").nth(1).waitFor());
  assert.equal(await page.locator(".step").count(), 2);
  assert.equal(await page.locator("#steps").evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length), 1, "step cards must remain in one column");
  assert.equal(await page.locator(".button-grid").count(), 1, "the editor must contain exactly one shared controller diagram");
  assert.equal(await page.locator(".step").first().locator(".button-grid").count(), 0, "controller diagram must not be repeated inside step cards");
  const first = page.locator(".step").nth(0);
  await page.locator(".step").nth(1).locator(".step-title").click();
  assert.equal(await page.locator(".step").nth(1).getAttribute("aria-selected"), "false", "blank delay steps must not enter action edit mode");
  await first.locator(".step-title").click();
  assert.equal(await first.getAttribute("aria-selected"), "true", "clicking a step card title must automatically select it and enter edit mode");
  assert.match(await page.locator("#activeStepTitle").textContent(), /1\. 动作步骤/);
  assert.ok(await page.locator("#buttonGrid .key-d-up").evaluate(el => el.getBoundingClientRect().top < document.querySelector("#buttonGrid .key-d-down").getBoundingClientRect().top), "D-pad directions should follow controller positions");
  const pos = await page.locator("#buttonGrid").evaluate(el => Object.fromEntries(["x","a","b","y","l3","r3"].map(k => { const r=el.querySelector(".key-"+k).getBoundingClientRect(); return [k,{x:r.x+r.width/2,y:r.y+r.height/2}]; })));
  assert.ok(pos.x.y < pos.b.y && pos.y.x < pos.a.x, "ABXY must follow Switch Pro positions: X top, A right, B bottom, Y left");
  assert.ok(pos.l3.x < pos.r3.x, "left stick press must be left of right stick press");
  assert.equal(await page.locator("#stickGrid").count(), 1, "the page must have one shared stick editor");
  const workspace = await page.locator(".editor-workspace").evaluate(el => {
    const editor = el.querySelector("#stepEditor").getBoundingClientRect();
    const steps = el.querySelector(".step-list-panel").getBoundingClientRect();
    return { editorLeft: editor.left, editorRight: editor.right, editorTop: editor.top, stepsLeft: steps.left, stepsRight: steps.right, stepsTop: steps.top, columns: getComputedStyle(el).gridTemplateColumns };
  });
  assert.ok(workspace.editorTop < workspace.stepsTop, "the shared controller editor must be above the step list");
  assert.ok(workspace.editorLeft <= workspace.stepsLeft && workspace.editorRight >= workspace.stepsRight, "the controller editor must span the step-list width");
  assert.equal(workspace.columns.split(" ").length, 1, "workspace must use one column with controller above steps");
  await first.locator(".delay").fill("250");
  await first.locator(".delay").dispatchEvent("change");
  await page.locator("#buttonGrid label").filter({ hasText: /^B$/ }).locator("input").check();
  assert.ok(await page.locator("#buttonGrid .key-b").evaluate(el => el.classList.contains("selected")), "selected button should be highlighted on the shared controller layout");
  await page.locator("#addAction").click();
  assert.equal(await page.locator("#buttonGrid .key-b input").isChecked(), false, "switching steps must refresh the shared diagram selection");
  await page.locator(".step").nth(0).locator(".edit-step").click();
  const jsonDownloadPromise = page.waitForEvent("download");
  await page.locator("#exportJson").click();
  const jsonDownload = await jsonDownloadPromise;
  const jsonPath = await jsonDownload.path();
  const exported = JSON.parse(await readFile(jsonPath, "utf8"));
  assert.equal(exported.macroList[0].delay, 250);
  assert.deepEqual(exported.macroList[0].buttons.map(x => x.id).sort(), ["A", "B"]);
  assert.equal(exported.macroList[0].buttons.find(x => x.id === "A").vendorField, "keep");
  assert.equal(exported.macroList[1].delay, 300);
  assert.equal(exported.macroList[1].isBlankDelay, true);
  const apgDownloadPromise = page.waitForEvent("download");
  await page.locator("#exportApg").click();
  const apgDownload = await apgDownloadPromise;
  const apg = await readFile(await apgDownload.path());
  assert.equal(apg.length, 1024 * 1024);
  assert.equal((apg[16] << 8) | apg[17], 11);
  assert.equal(apg[12], 0x03, "PC layout should encode A+B");
  assert.equal(apg[15], 2);
  assert.deepEqual(errors, []);
});

test("browser APG import and unchanged export preserve every byte", async t => {
  const { chromium } = await import("playwright");
  const { server, url } = await startServer();
  const browser = await chromium.launch({ headless: true });
  t.after(async () => { await browser.close(); await new Promise(r => server.close(r)); });
  const original = encodeAPG({
    fileName: "roundtrip",
    version: "1.0",
    macroList: [
      { id: "a", buttons: [{ id: "A" }], sticks: [], delay: 200, isBlankDelay: false },
      { id: "blank", buttons: [], sticks: [], delay: 200, isBlankDelay: true }
    ]
  }, { abxyLayout: "PC", metadata: { marker: 2, counterStart: 11, counterStep: 14 }, fillByte: 0xff }).data;
  const page = await browser.newPage({ acceptDownloads: true });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(url);
  await page.locator("#apgFile").setInputFiles({
    name: "roundtrip.apg",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(original)
  });
  await page.locator(".step").nth(1).waitFor();
  assert.equal(await page.locator(".step").count(), 2);
  assert.match(await page.locator("#sourceInfo").textContent(), /APG 记录：32/);
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportApg").click();
  const download = await downloadPromise;
  const rebuilt = await readFile(await download.path());
  assert.deepEqual(rebuilt, Buffer.from(original));
  assert.deepEqual(errors, []);
});


test("browser step controls support defaults, independent delay, reorder and blank conversion", async t => {
  const { chromium } = await import("playwright");
  const { server, url } = await startServer();
  const browser = await chromium.launch({ headless: true });
  t.after(async () => { await browser.close(); await new Promise(r => server.close(r)); });
  const page = await browser.newPage({ acceptDownloads: true });
  await page.goto(url);
  await page.locator("#newConfig").click();
  await page.locator("#addAction").click();
  await page.locator("#addBlank").click();
  await page.locator("#addAction").click();
  assert.equal(await page.locator(".step").count(), 3);
  assert.deepEqual(await page.locator(".delay").evaluateAll(nodes => nodes.map(n => Number(n.value))), [200, 200, 200]);
  await page.locator(".step").nth(1).locator(".delay").fill("420");
  await page.locator(".step").nth(1).locator(".delay").dispatchEvent("change");
  await page.locator(".step").nth(0).locator(".down").click();
  assert.match(await page.locator(".step").nth(0).locator(".step-title").textContent(), /空白延时/);
  assert.equal(await page.locator(".step").nth(0).locator(".delay").inputValue(), "420");
  await page.locator(".step").nth(0).locator(".convert-action").click();
  assert.equal(await page.locator("#stepEditor").isVisible(), true);
  await page.locator(".step").nth(1).locator(".remove").click();
  assert.equal(await page.locator(".step").count(), 2);
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportJson").click();
  const download = await downloadPromise;
  const exported = JSON.parse(await readFile(await download.path(), "utf8"));
  assert.equal(exported.macroList.length, 2);
  assert.equal(exported.macroList[0].delay, 420);
  assert.equal(exported.macroList[0].isBlankDelay, false);
  await page.locator("#clearSteps").click();
  assert.equal(await page.locator(".step").count(), 0);
  assert.match(await page.locator("#status").textContent(), /宏列表已清空/);
});

test("editing one imported APG run preserves the untouched run and relocates the suffix", async t => {
  const { chromium } = await import("playwright");
  const { server, url } = await startServer();
  const browser = await chromium.launch({ headless: true });
  t.after(async () => { await browser.close(); await new Promise(r => server.close(r)); });
  const original = encodeAPG({
    fileName: "partial-edit",
    version: "1.0",
    macroList: [
      { id: "a", buttons: [{ id: "A" }], sticks: [], delay: 200, isBlankDelay: false },
      { id: "blank", buttons: [], sticks: [], delay: 200, isBlankDelay: true }
    ]
  }, { abxyLayout: "PC", metadata: { marker: 2, counterStart: 11, counterStep: 14 }, fillByte: 0xff }).data;
  const page = await browser.newPage({ acceptDownloads: true });
  await page.goto(url);
  await page.locator("#apgFile").setInputFiles({
    name: "partial-edit.apg",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(original)
  });
  await page.locator(".step").nth(1).waitFor();
  await page.locator(".step").nth(0).locator(".delay").fill("250");
  await page.locator(".step").nth(0).locator(".delay").dispatchEvent("change");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportApg").click();
  const download = await downloadPromise;
  const rebuilt = await readFile(await download.path());
  const recordSize = 18;
  assert.equal(Buffer.compare(rebuilt.subarray(20 * recordSize, 36 * recordSize), Buffer.from(original).subarray(16 * recordSize, 32 * recordSize)), 0, "untouched APG run bytes changed");
  const relocatedSuffix = rebuilt.subarray(36 * recordSize);
  const originalSuffixPrefix = Buffer.from(original).subarray(32 * recordSize, 32 * recordSize + relocatedSuffix.length);
  assert.equal(Buffer.compare(relocatedSuffix, originalSuffixPrefix), 0, "retained suffix prefix was not relocated byte-for-byte");
  assert.match(await page.locator("#status").textContent(), /原始保留 1 步；重新编码 1 步/);
});


test("browser exports an arbitrary 37-step JSON without a sample profile", async t => {
  const { chromium } = await import("playwright");
  const { server, url } = await startServer();
  const browser = await chromium.launch({ headless: true });
  t.after(async () => { await browser.close(); await new Promise(r => server.close(r)); });
  const config = {
    fileName: "arbitrary-37",
    version: "1.0",
    macroList: Array.from({ length: 37 }, (_, index) => ({
      id: "step-" + index,
      buttons: [{ id: index % 2 ? "B" : "A" }],
      sticks: [],
      delay: 200 + (index % 3) * 13,
      isBlankDelay: false,
    })),
  };
  const page = await browser.newPage({ acceptDownloads: true });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(url);
  await page.locator("#jsonFile").setInputFiles({
    name: "arbitrary-37.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(config)),
  });
  await page.locator(".step").nth(36).waitFor();
  assert.equal(await page.locator(".step").count(), 37);
  assert.equal(await page.locator("#layout").inputValue(), "SWITCH");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportApg").click();
  const download = await downloadPromise;
  const bytes = await readFile(await download.path());
  const expectedRecords = config.macroList.reduce((sum, step) =>
    sum + Math.ceil(step.delay * 79 / 1000), 0);
  assert.equal(bytes.length, 1024 * 1024);
  assert.equal(bytes[15], 0x02);
  assert.equal((bytes[16] << 8) | bytes[17], 11);
  assert.equal((bytes[(expectedRecords - 1) * 18 + 16] << 8) |
    bytes[(expectedRecords - 1) * 18 + 17],
  (11 + (expectedRecords - 1) * 14) & 0xffff);
  assert.ok(bytes.subarray(expectedRecords * 18).every(byte => byte === 0xff));
  assert.deepEqual(errors, []);
});

test("browser recognizes the official 29-step JSON and exports a byte-identical paired APG", async t => {
  const { chromium } = await import("playwright");
  const { server, url } = await startServer();
  const browser = await chromium.launch({ headless: true });
  t.after(async () => { await browser.close(); await new Promise(r => server.close(r)); });
  const jsonBytes = await readFile(resolve(root, "verification/apg-sample-validator/Official.29steps.json"));
  const officialApg = await readFile(resolve(root, "verification/apg-sample-validator/Official.29steps.apg"));
  const page = await browser.newPage({ acceptDownloads: true });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(url);
  await page.locator("#jsonFile").setInputFiles({
    name: "Official.29steps.json",
    mimeType: "application/json",
    buffer: jsonBytes
  });

  await page.locator(".step").nth(28).waitFor();
  assert.equal(await page.locator(".step").count(), 29);
  assert.equal(await page.locator("#layout").inputValue(), "SWITCH");
  assert.match(await page.locator("#sourceInfo").textContent(), /不限制步骤数量/);

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportApg").click();
  const download = await downloadPromise;
  const exported = await readFile(await download.path());
  assert.equal(exported.length, 1024 * 1024);
  assert.deepEqual(exported, officialApg, "exported APG should match the paired official binary byte-for-byte");
  assert.match(await page.locator("#status").textContent(), /APG 导出完成/);
  assert.deepEqual(errors, []);
});


test("official 17-step JSON auto-selects its audited profile and exports the exact paired APG", async t => {
  const { chromium } = await import("playwright");
  const { server, url } = await startServer();
  const browser = await chromium.launch({ headless: true });
  t.after(async () => { await browser.close(); await new Promise(r => server.close(r)); });
  const officialJson = await readFile(resolve(root, "verification/apg-sample-validator/Official.17steps.json"));
  const officialApg = await readFile(resolve(root, "verification/apg-sample-validator/Official.17steps.apg"));
  const page = await browser.newPage({ acceptDownloads: true });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(url);
  await page.locator("#jsonFile").setInputFiles({
    name: "Official.17steps.json",
    mimeType: "application/json",
    buffer: officialJson,
  });
  await page.locator(".step").nth(16).waitFor();
  assert.equal(await page.locator(".step").count(), 17);
  const stepCards = page.locator(".step");
  for (let i = 0; i < 17; i++) {
    const summary = stepCards.nth(i).locator(".step-summary");
    assert.equal(await summary.isVisible(), true, `official JSON step ${i + 1} must show its unselected key summary`);
    assert.notEqual((await summary.textContent()).trim(), "", `official JSON step ${i + 1} summary must not be empty`);
  }
  assert.match(await stepCards.nth(1).locator(".step-summary").textContent(), /按键：/);
  assert.match(await stepCards.nth(2).locator(".step-summary").textContent(), /摇杆：/);
  assert.equal(await page.locator("#layout").inputValue(), "SWITCH");
  assert.match(await page.locator("#sourceInfo").textContent(), /不限制步骤数量/);
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportApg").click();
  const download = await downloadPromise;
  const exportedApg = await readFile(await download.path());
  assert.deepEqual(exportedApg, officialApg);
  assert.deepEqual(errors, []);
});

test("unselected action steps show readable button and stick summaries", async t => {
  const { chromium } = await import("playwright");
  const { server, url } = await startServer();
  const browser = await chromium.launch({ headless: true });
  t.after(async () => { await browser.close(); await new Promise(r => server.close(r)); });
  const page = await browser.newPage();
  await page.goto(url);
  const config = {
    fileName: "step-summary",
    version: "1.0",
    macroList: [
      { id: "first", buttons: [{ id: "A" }, { id: "B" }, { id: "D_UP" }], sticks: [{ stick: { id: "L_STICK" }, direction: "UP", value: 75 }], delay: 200, isBlankDelay: false },
      { id: "second", buttons: [{ id: "LB" }, { id: "RT" }], sticks: [], delay: 300, isBlankDelay: false },
      { id: "blank", buttons: [], sticks: [], delay: 100, isBlankDelay: true }
    ]
  };
  await page.locator("#jsonFile").setInputFiles({
    name: "step-summary.json", mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(config))
  });
  const cards=page.locator(".step");
  await cards.nth(0).waitFor();
  assert.match(await cards.nth(1).locator(".step-summary").textContent(), /按键：L、ZR/);
  assert.match(await cards.nth(2).locator(".step-summary").textContent(), /空白延时：无按键或摇杆/);
  assert.equal(await cards.nth(0).locator(".step-summary").isVisible(), true, "active step must keep its text summary visible");
  await cards.nth(1).locator(".step-title").click();
  assert.equal(await cards.nth(1).locator(".step-summary").isVisible(), true);
  assert.match(await cards.nth(0).locator(".step-summary").textContent(), /按键：A、B、方向键↑；摇杆：左摇杆上 75%/);
});
