package app.hamzawasl.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Enable Edge-to-Edge BEFORE super.onCreate()
        enableEdgeToEdge();
        
        super.onCreate(savedInstanceState);
        
        // Configure System Bars after layout is created
        configureSystemBars();
        
        // Configure WebView
        configureWebView();
    }
    
    private void enableEdgeToEdge() {
        Window window = getWindow();
        
        // Disable edge-to-edge (content does NOT extend behind system bars)
        WindowCompat.setDecorFitsSystemWindows(window, true);
    }
    
    private void configureSystemBars() {
        Window window = getWindow();
        
        // Disable edge-to-edge - content should NOT go behind system bars
        WindowCompat.setDecorFitsSystemWindows(window, true);
        
        // Clear conflicting flags
        window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        
        // Enable drawing system bar backgrounds
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        
        // Set SOLID colors for status bar (app blue) and navigation bar (black)
        window.setStatusBarColor(Color.parseColor("#1e40af")); // App blue color
        window.setNavigationBarColor(Color.BLACK); // Black navigation bar
        
        // Get the window insets controller for modern API
        View decorView = window.getDecorView();
        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, decorView);
        
        if (insetsController != null) {
            // false = white/light icons on dark background
            insetsController.setAppearanceLightStatusBars(false);
            insetsController.setAppearanceLightNavigationBars(false);
        }
        
        // Legacy support for older Android versions
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            int flags = decorView.getSystemUiVisibility();
            // Remove edge-to-edge layout flags
            flags &= ~View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
            flags &= ~View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
            flags |= View.SYSTEM_UI_FLAG_LAYOUT_STABLE;
            // Light icons on dark background
            flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            decorView.setSystemUiVisibility(flags);
        }
    }
    
    private void configureWebView() {
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings webSettings = webView.getSettings();
            
            // Set WebView background to match splash screen (light color)
            webView.setBackgroundColor(Color.parseColor("#f5f8ff"));
            
            // Disable overscroll completely - no bounce/glow effect
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
            
            // Standard viewport settings
            webSettings.setUseWideViewPort(true);
            webSettings.setLoadWithOverviewMode(true);
            webSettings.setTextZoom(100);
            webSettings.setBuiltInZoomControls(false);
            webSettings.setDisplayZoomControls(false);
            webSettings.setSupportZoom(false);
            webView.setInitialScale(0);
        }
        
        // Set window background to match splash screen
        getWindow().getDecorView().setBackgroundColor(Color.parseColor("#f5f8ff"));
    }
    
    @Override
    public void onResume() {
        super.onResume();
        // Re-apply configuration on resume
        configureSystemBars();
    }
    
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // Re-apply when window gains focus
            configureSystemBars();
        }
    }
}
