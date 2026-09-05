/**
 * Writes the default (npm · main · dist) copies of both workflows into
 * `public/workflows/`, so they have stable URLs people can curl or read
 * without JavaScript. Runs from the `prebuild` script.
 *
 * The templates live in src/content/workflow-templates.ts — this only renders
 * them, so the served files can never drift from what the download buttons
 * produce. Node strips the TypeScript types on import (22.18+).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../public/workflows");

const { DEFAULT_CONFIG, releaseYml, ciYml } = await import(
  resolve(here, "../src/content/workflow-templates.ts")
);

await mkdir(outDir, { recursive: true });
await writeFile(resolve(outDir, "release.yml"), releaseYml(DEFAULT_CONFIG));
await writeFile(resolve(outDir, "ci.yml"), ciYml(DEFAULT_CONFIG));

console.log("wrote public/workflows/release.yml and ci.yml");
