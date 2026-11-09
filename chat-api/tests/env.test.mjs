import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { test } from "node:test";

test("offline scripts use Next dotenv parsing without shell evaluation and report shadowed keys", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "homepage-env-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, ".env.local"), [
    'TEST_JSON=\'{"role":"reader"}\'',
    'TEST_LITERAL="literal\\$VALUE `not-a-command` # text"',
    'TEST_EMPTY=',
    'TEST_DUPLICATE=first', 'TEST_DUPLICATE=last',
    'TEST_SHADOWED=file', 'TEST_OCCUPIED_EMPTY=file',
  ].join("\n"));
  const code = `import { loadLocalEnv } from ${JSON.stringify(new URL("../scripts/load-env.mjs", import.meta.url).href)};
    const warnings=[]; console.warn=(line)=>warnings.push(line); loadLocalEnv(${JSON.stringify(root)});
    console.log(JSON.stringify({values:Object.fromEntries(Object.entries(process.env).filter(([k])=>k.startsWith("TEST_"))),warnings}));`;
  const output = execFileSync(process.execPath, ["--input-type=module", "-e", code], {
    encoding: "utf8", env: { PATH: process.env.PATH, TZ: "Asia/Shanghai", TEST_SHADOWED: "inherited", TEST_OCCUPIED_EMPTY: "" },
  });
  const { values, warnings } = JSON.parse(output);
  assert.equal(values.TEST_JSON, '{"role":"reader"}');
  assert.equal(values.TEST_LITERAL, 'literal$VALUE `not-a-command` # text');
  assert.equal(values.TEST_EMPTY, "");
  assert.equal(values.TEST_DUPLICATE, "last");
  assert.equal(values.TEST_SHADOWED, "inherited");
  assert.equal(values.TEST_OCCUPIED_EMPTY, "");
  assert.ok(warnings.some((line) => line.includes("TEST_SHADOWED") && line.includes("TEST_OCCUPIED_EMPTY")));
  assert.ok(warnings.every((line) => !line.includes("literal$VALUE")));
});
