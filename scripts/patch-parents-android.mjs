import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const javaFile = 'android/app/src/main/java/app/hamzawasl/parents/MainActivity.java';
assert.ok(existsSync(javaFile), 'Expected standalone parent Android MainActivity');
let source = readFileSync(javaFile, 'utf8');
assert.ok(source.includes('package app.hamzawasl.parents;'), 'Refusing to patch a non-parent Android app');
assert.ok(source.includes('extends BridgeActivity'), 'Unexpected Capacitor MainActivity');
assert.ok(!source.includes('setTextZoom('), 'WebView font zoom has already been configured');

source = source.replace(
  'import com.getcapacitor.BridgeActivity;',
  'import com.getcapacitor.BridgeActivity;\nimport android.os.Bundle;'
);
source = source.replace(
  /public class MainActivity extends BridgeActivity\s*\{/,
  `public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Use the same CSS text sizes as the original school app,
    // regardless of WebView/system font-boosting settings.
    getBridge().getWebView().getSettings().setTextZoom(100);
  }`
);
assert.ok(source.includes('setTextZoom(100)'), 'Native font zoom patch failed');
writeFileSync(javaFile, source);
console.log('Parent-only Android WebView text zoom fixed at 100%.');
