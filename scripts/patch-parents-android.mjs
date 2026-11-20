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
    // A white native window must be present before the Capacitor WebView
    // exists: otherwise Android may briefly paint its default black surface.
    getWindow().setBackgroundDrawable(
      new android.graphics.drawable.ColorDrawable(android.graphics.Color.WHITE)
    );
    super.onCreate(savedInstanceState);
    getBridge().getWebView().setBackgroundColor(android.graphics.Color.WHITE);
    // Use the same CSS text sizes as the original school app,
    // regardless of WebView/system font-boosting settings.
    getBridge().getWebView().getSettings().setTextZoom(100);
    // Match the upper Android system bar: white bottom navigation surface
    // with dark back/home/recents indicators.
    getWindow().setNavigationBarColor(android.graphics.Color.rgb(248, 250, 252));
    applyDarkNavigationButtons();
  }

  private void applyDarkNavigationButtons() {
    getWindow().setNavigationBarColor(android.graphics.Color.rgb(248, 250, 252));
    // The LIGHT_NAVIGATION_BAR flag means *dark* Android navigation buttons.
    android.view.View decor = getWindow().getDecorView();
    decor.setSystemUiVisibility(
      decor.getSystemUiVisibility() |
      android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
    );
    if (android.os.Build.VERSION.SDK_INT >= 30) {
      android.view.WindowInsetsController controller = getWindow().getInsetsController();
      if (controller != null) {
        controller.setSystemBarsAppearance(
          android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
          android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
        );
      }
    }
  }

  @Override
  public void onResume() {
    super.onResume();
    applyDarkNavigationButtons();
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) applyDarkNavigationButtons();
  }`
);
assert.ok(source.includes('setTextZoom(100)'), 'Native font zoom patch failed');
writeFileSync(javaFile, source);

// Capacitor's post-splash theme can still reveal a black Android window
// between the system splash and the first WebView paint. This is distinct
// from the React welcome screen and from the launcher icon.
const stylesFile = 'android/app/src/main/res/values/styles.xml';
assert.ok(existsSync(stylesFile), 'Expected generated Android styles.xml');
let styles = readFileSync(stylesFile, 'utf8');
for (const style of ['AppTheme', 'AppTheme.NoActionBar', 'AppTheme.NoActionBarLaunch']) {
  const opening = new RegExp('<style\\\\s+name="' + style.replaceAll('.', '\\\\.') + '"[^>]*>');
  const match = opening.exec(styles);
  assert.ok(match, 'Missing generated Android theme: ' + style);
  const start = match.index + match[0].length;
  const end = styles.indexOf('</style>', start);
  assert.ok(end >= 0, 'Unclosed Android theme: ' + style);
  let body = styles.slice(start, end);
  body = body.replace(/<item\\s+name="android:windowBackground"[^>]*>[\\s\\S]*?<\\/item>/g, '');
  body += '\\n        <item name="android:windowBackground">#FFFFFF</item>\\n    ';
  styles = styles.slice(0, start) + body + styles.slice(end);
}
writeFileSync(stylesFile, styles);
assert.ok(styles.includes('<item name="android:windowBackground">#FFFFFF</item>'));
console.log('Parents Android native window, launch themes, and WebView are white; original welcome is untouched.');
