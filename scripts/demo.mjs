import fs from "node:fs";
import path from "node:path";
import { probeJson } from "../dist/index.js";

const cwd = path.resolve("examples/demo-repo");
fs.mkdirSync(cwd, { recursive: true });
fs.writeFileSync(path.join(cwd, "good.json"), JSON.stringify({ a: 1 }));
fs.writeFileSync(path.join(cwd, "bad.json"), "{ broken");
const out = path.resolve("examples/out-demo");
const r = probeJson(cwd, out);
console.log(JSON.stringify({ scanned: r.scanned, issues: r.issues.length, out }, null, 2));
