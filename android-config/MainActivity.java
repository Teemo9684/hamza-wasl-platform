package com.hamzawasl.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.activity.EdgeToEdge;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // CRITICAL: Disable EdgeToEdge BEFORE super.onCreate()
        // This must be called before any view is created
        disableEdgeToEdge();
        
        super.onCreate(savedInstanceState);
        
        // Configure System Bars after layout is created
        configureSystemBars();
        
        // Configure WebView
        configureWebView();
    }
    
    private void disableEdgeToEdge() {
        Window window = getWindow();
        
        // Force traditional (non-edge-to-edge) layout
        WindowCompat.setDecorFitsSystemWindows(window, true);
    }
    
    private void configureSystemBars() {
        Window window = getWindow();
        
        // Clear all problematic flags
        window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
        window.clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
        
        // Enable drawing system bar backgrounds (required for custom colors)
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        
        // Set the actual colors
        window.setStatusBarColor(Color.parseColor("#1e40af"));
        window.setNavigationBarColor(Color.BLACK);
        
        // Get the window insets controller for modern API
        View decorView = window.getDecorView();
        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, decorView);
        
        if (insetsController != null) {
            // false = white/light icons on dark background
            insetsController.setAppearanceLightStatusBars(false);
            insetsController.setAppearanceLightNavigationBars(false);
        }
        
        // Additional fix for Android 15+ (API 35)
        if (Build.VERSION.SDK_INT >= 35) {
            // Ensure content doesn't extend behind system bars
            ViewCompat.setOnApplyWindowInsetsListener(decorView, (v, windowInsets) -> {
                Insets insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
                // Return consumed insets - system handles the padding
                return WindowInsetsCompat.CONSUMED;
            });
        }
        
        // Legacy support for older Android versions
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            int flags = decorView.getSystemUiVisibility();
            flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            flags &= ~View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
            flags &= ~View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
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
            
            // Standard viewport settings
            webSettings.setUseWideViewPort(true);
            webSettings.setLoadWithOverviewMode(true);
            webSettings.setTextZoom(100);
            webSettings.setBuiltInZoomControls(false);
            webSettings.setDisplayZoomControls(false);
            webSettings.setSupportZoom(false);
            webView.setInitialScale(0);
        }
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
