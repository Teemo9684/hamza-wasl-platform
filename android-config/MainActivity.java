package com.hamzawasl.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configure Status Bar and Navigation Bar
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
        
        // Make status bar and navigation bar stable (not hidden)
        window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        
        // Set status bar color to app primary color (blue #1e40af)
        window.setStatusBarColor(Color.parseColor("#1e40af"));
        
        // Set navigation bar color to black
        window.setNavigationBarColor(Color.BLACK);
        
        // Configure icon colors
        View decorView = window.getDecorView();
        int flags = decorView.getSystemUiVisibility();
        
        // Status bar: Light icons (white) on dark background - clear the LIGHT_STATUS_BAR flag
        flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        
        // Navigation bar: Light icons (white) on black background - clear the LIGHT_NAVIGATION_BAR flag
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        }
        
        decorView.setSystemUiVisibility(flags);
    }
}
