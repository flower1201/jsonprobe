import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { probeJson } from "../src/core/probe.js";

describe("probeJson", () => {
  it("flags invalid JSON and blank strings", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "jsonprobe-"));
    fs.writeFileSync(path.join(cwd, "bad.json"), "{");
    fs.writeFileSync(path.join(cwd, "ok.json"), JSON.stringify({ name: "x", note: "" }));
    const result = probeJson(cwd, path.join(cwd, "out"));
    expect(result.issues.some((i) => i.severity === "error")).toBe(true);
    expect(result.issues.some((i) => i.message.includes("blank string"))).toBe(true);
  });
});
