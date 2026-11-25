import fs from "node:fs";
import path from "node:path";
import { ENGINE_VERSION } from "../version.js";

export type Issue = {
  file: string;
  message: string;
  severity: "error" | "warn";
};

export type ProbeResult = {
  schemaVersion: "1.0";
  engineVersion: string;
  cwd: string;
  scanned: number;
  issues: Issue[];
  artifacts: { json: string; markdown: string };
};

function walkJson(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git", "coverage"].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkJson(p, acc);
    else if (ent.name.endsWith(".json")) acc.push(p);
  }
  return acc;
}

function checkObject(obj: unknown, file: string, issues: Issue[], depth = 0): void {
  if (obj === null || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      issues.push({ file, message: "empty array", severity: "warn" });
    }
    for (const item of obj) checkObject(item, file, issues, depth + 1);
    return;
  }
  const rec = obj as Record<string, unknown>;
  const keys = Object.keys(rec);
  if (keys.length === 0 && depth > 0) {
    issues.push({ file, message: "empty object", severity: "warn" });
  }
  const seen = new Map<string, number>();
  for (const k of keys) {
    const lower = k.toLowerCase();
    seen.set(lower, (seen.get(lower) ?? 0) + 1);
    if (rec[k] === null) {
      issues.push({ file, message: `null value at key "${k}"`, severity: "warn" });
    }
    if (typeof rec[k] === "string" && (rec[k] as string).trim() === "") {
      issues.push({ file, message: `blank string at key "${k}"`, severity: "warn" });
    }
    checkObject(rec[k], file, issues, depth + 1);
  }
}

export function probeJson(cwd: string, outDir: string): ProbeResult {
  const files = walkJson(cwd);
  const issues: Issue[] = [];

  for (const abs of files) {
    const rel = path.relative(cwd, abs).split(path.sep).join("/");
    let text = "";
    try {
      text = fs.readFileSync(abs, "utf8");
    } catch {
      issues.push({ file: rel, message: "unreadable", severity: "error" });
      continue;
    }
    if (text.charCodeAt(0) === 0xfeff) {
      issues.push({ file: rel, message: "BOM present", severity: "warn" });
    }
    try {
      const parsed = JSON.parse(text) as unknown;
      checkObject(parsed, rel, issues);
    } catch (err) {
      issues.push({
        file: rel,
        message: err instanceof Error ? err.message : "parse error",
        severity: "error",
      });
    }
  }

  fs.mkdirSync(outDir, { recursive: true });
  const result: ProbeResult = {
    schemaVersion: "1.0",
    engineVersion: ENGINE_VERSION,
    cwd,
    scanned: files.length,
    issues,
    artifacts: { json: "report.json", markdown: "summary.md" },
  };
  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(result, null, 2));
  fs.writeFileSync(
    path.join(outDir, "summary.md"),
    [
      "# JSONProbe report",
      "",
      `Scanned: ${files.length}`,
      `Issues: ${issues.length}`,
      "",
      ...issues.map((i) => `- **${i.severity}** \`${i.file}\` — ${i.message}`),
      "",
    ].join("\n"),
  );
  return result;
}
