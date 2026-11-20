import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const audience = process.argv[2];
const names = {
  parent: "همزة وصل – الأولياء",
  teacher: "همزة وصل – الأساتذة",
  admin: "همزة وصل – الإدارة",
};

if (!Object.hasOwn(names, audience)) throw new Error("Usage: node scripts/verify-app-build.mjs parent|teacher|admin");
const output = join(process.cwd(), `dist-${audience}`);
const htmlPath = join(output, "index.html");
const manifestPath = join(output, "manifest.webmanifest");
if (!existsSync(htmlPath) || !existsSync(manifestPath)) {
  throw new Error(`Missing build output or PWA manifest for ${audience}`);
}
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.name !== names[audience] || manifest.short_name !== names[audience]) {
  throw new Error(`Incorrect audience PWA manifest for ${audience}: ${manifest.name}`);
}
const html = readFileSync(htmlPath, "utf8");
if (!html.includes('manifest.webmanifest')) throw new Error("PWA manifest is not referenced");
console.log(`Verified ${audience}: independent build and manifest`);
