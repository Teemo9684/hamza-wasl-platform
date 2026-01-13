package com.hamzawasl.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configure Status Bar and Navigation Bar FIRST
        configureSystemBars();
        
        // Get the WebView and configure it for proper scaling
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings webSettings = webView.getSettings();
            
            // Critical: Match PWA viewport behavior
            webSettings.setUseWideViewPort(true);
            webSettings.setLoadWithOverviewMode(true);
            
            // Prevent text size changes based on system settings
            webSettings.setTextZoom(100);
            
            // Use standard viewport
            webSettings.setBuiltInZoomControls(false);
            webSettings.setDisplayZoomControls(false);
            webSettings.setSupportZoom(false);
            
            // Force density to match web
            webView.setInitialScale(0);
        }
    }
    
    private void configureSystemBars() {
        Window window = getWindow();
        
        // CRITICAL: Disable edge-to-edge mode - ensures system bars don't overlap content
        WindowCompat.setDecorFitsSystemWindows(window, true);
        
        // Clear any fullscreen flags
        window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
        
        // Add flag to draw system bar backgrounds
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        
        // Set status bar color to app primary color (blue #1e40af)
        window.setStatusBarColor(Color.parseColor("#1e40af"));
        
        // Set navigation bar color to black
        window.setNavigationBarColor(Color.BLACK);
        
        // Use modern WindowInsetsControllerCompat for Android 14+ compatibility
        View decorView = window.getDecorView();
        WindowInsetsControllerCompat insetsController = new WindowInsetsControllerCompat(window, decorView);
        
        // Status bar: Light (white) icons on dark background
        insetsController.setAppearanceLightStatusBars(false);
        
        // Navigation bar: Light (white) icons on black background
        insetsController.setAppearanceLightNavigationBars(false);
        
        // LEGACY FALLBACK: Also set old flags for older devices
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            int flags = decorView.getSystemUiVisibility();
            flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            decorView.setSystemUiVisibility(flags);
        }
    }
    
    @Override
    public void onResume() {
        super.onResume();
        // Re-apply system bar configuration on resume to ensure it persists
        configureSystemBars();
    }
}
