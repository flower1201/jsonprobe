#!/usr/bin/env node
import path from "node:path";
import { Command } from "commander";
import { probeJson } from "../core/probe.js";
import { ENGINE_VERSION } from "../version.js";

const program = new Command();
program
  .name("jsonprobe")
  .description("Probe JSON files for parse errors, BOM, nulls, and blanks")
  .version(ENGINE_VERSION)
  .argument("[dir]", "project root", ".")
  .option("--out <dir>", "output directory", "./jsonprobe-out")
  .action((dir: string, opts: { out: string }) => {
    const result = probeJson(path.resolve(dir), path.resolve(opts.out));
    process.stdout.write(
      `${JSON.stringify(
        {
          scanned: result.scanned,
          issues: result.issues.length,
          errors: result.issues.filter((i) => i.severity === "error").length,
          out: opts.out,
        },
        null,
        2,
      )}\n`,
    );
    if (result.issues.some((i) => i.severity === "error")) process.exitCode = 2;
  });

program.parseAsync(process.argv).catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
