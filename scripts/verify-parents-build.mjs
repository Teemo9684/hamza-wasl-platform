import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const app = read('src/App.tsx');
const audience = read('src/config/appAudience.ts');
const capacitor = read('capacitor.config.ts');
const updater = read('src/utils/liveUpdate.ts');
const protectedRoute = read('src/components/ProtectedRoute.tsx');
const manifestPath = 'dist-parent/manifest.webmanifest';

assert.ok(existsSync(manifestPath), 'Parent web manifest must exist');
const manifest = JSON.parse(read(manifestPath));
assert.equal(manifest.name, 'همزة وصل – الأولياء');
assert.equal(manifest.dir, 'rtl');
assert.ok(audience.includes('buildMode === "parent"'), 'Explicit parent build mode is required');
assert.ok(app.includes('isAudienceEnabled("parent")'), 'Parent routes must be present');
assert.ok(app.includes('isAudienceEnabled("teacher")'), 'Staff routes must be audience gated');
assert.ok(app.includes('isAudienceEnabled("admin")'), 'Admin routes must be audience gated');
assert.ok(capacitor.includes('app.hamzawasl.parents'), 'Standalone Android package ID required');
assert.ok(capacitor.includes("audience === 'parent' && process.env.PARENT_OTA_ENABLED === 'true'"), 'Android OTA must be opt-in');
assert.ok(updater.includes('APP_AUDIENCE === "parent" && import.meta.env.VITE_PARENT_OTA_ENABLED === "true"'), 'Parent OTA feed must be opt-in');
assert.ok(updater.includes('bundleUrl !== `${parentsFeed}/bundles/${version}.zip`'), 'Parent OTA installer must reject other feeds');
assert.ok(protectedRoute.includes('profile?.is_approved === true'), 'Parent restored sessions must check approval');
assert.ok(protectedRoute.includes('APP_AUDIENCE === "parent" && requiredRole !== "parent"'), 'Parent app must reject cross-audience protected screens');

console.log('Parent isolation checks passed. These are source/build checks, not Android runtime or database RLS tests.');
