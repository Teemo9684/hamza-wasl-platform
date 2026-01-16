import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

interface ChannelSubscription {
  channelName: string;
  table: string;
  callback: (payload: any) => void;
  filter?: string;
  channel?: RealtimeChannel;
  lastReconnect?: number;
}

class RealtimeManager {
  private subscriptions: Map<string, ChannelSubscription> = new Map();
  private isReconnecting = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private visibilityHandler: (() => void) | null = null;
  private onlineHandler: (() => void) | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private appStateCleanup: (() => void) | null = null;
  private lastActiveTime: number = Date.now();

  constructor() {
    this.setupGlobalListeners();
    this.startHeartbeat();
  }

  private setupGlobalListeners() {
    // Handle app visibility changes (when app comes to foreground)
    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceActive = Date.now() - this.lastActiveTime;
        console.log('RealtimeManager: App became visible, time away:', timeSinceActive, 'ms');
        
        // If app was in background for more than 5 seconds, reconnect
        if (timeSinceActive > 5000) {
          this.reconnectAll();
          // Also force a data refresh
          setTimeout(() => this.forceRefresh(), 500);
        }
      } else {
        this.lastActiveTime = Date.now();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    // Handle online/offline status
    this.onlineHandler = () => {
      if (navigator.onLine) {
        console.log('RealtimeManager: Network restored, reconnecting...');
        this.reconnectAll();
        // Force refresh after reconnecting
        setTimeout(() => this.forceRefresh(), 1000);
      }
    };
    window.addEventListener('online', this.onlineHandler);

    // Handle Capacitor app state changes (critical for Android/iOS)
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/app').then(async ({ App }) => {
        const listener = await App.addListener('appStateChange', ({ isActive }) => {
          console.log('RealtimeManager: Capacitor app state changed, isActive:', isActive);
          
          if (isActive) {
            // App came to foreground - reconnect everything
            console.log('RealtimeManager: Capacitor app became active, reconnecting...');
            this.reconnectAll();
            // Force refresh data after a short delay
            setTimeout(() => this.forceRefresh(), 500);
          } else {
            this.lastActiveTime = Date.now();
          }
        });
        
        // Store cleanup function
        this.appStateCleanup = () => listener.remove();
      }).catch((err) => {
        console.log('RealtimeManager: Capacitor App plugin not available:', err);
      });

      // Also listen for resume event
      import('@capacitor/app').then(async ({ App }) => {
        await App.addListener('resume', () => {
          console.log('RealtimeManager: App resumed from background');
          this.reconnectAll();
          setTimeout(() => this.forceRefresh(), 500);
        });
      }).catch(() => {});
    }
  }

  // Heartbeat to keep connections alive and detect stale channels
  private startHeartbeat() {
    // Check connection health every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.checkConnectionHealth();
      }
    }, 30000);
  }

  private checkConnectionHealth() {
    this.subscriptions.forEach((subscription, channelName) => {
      const channel = subscription.channel;
      if (channel) {
        const state = (channel as any).state;
        console.log(`RealtimeManager: Channel ${channelName} state:`, state);
        
        // If channel is not in 'joined' state, reconnect it
        if (state !== 'joined' && state !== 'joining') {
          console.log(`RealtimeManager: Channel ${channelName} is stale, reconnecting...`);
          this.reconnectChannel(subscription);
        }
      }
    });
  }

  subscribe(
    channelName: string,
    table: string,
    callback: (payload: any) => void,
    filter?: string
  ): () => void {
    // Remove existing subscription with same name
    if (this.subscriptions.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const subscription: ChannelSubscription = {
      channelName,
      table,
      callback,
      filter,
    };

    this.subscriptions.set(channelName, subscription);
    this.createChannel(subscription);

    return () => this.unsubscribe(channelName);
  }

  private createChannel(subscription: ChannelSubscription) {
    const config: any = {
      event: '*',
      schema: 'public',
      table: subscription.table,
    };

    if (subscription.filter) {
      config.filter = subscription.filter;
    }

    try {
      const channel = supabase
        .channel(subscription.channelName)
        .on('postgres_changes', config, (payload) => {
          console.log(`RealtimeManager: Update received for ${subscription.table}`, payload);
          subscription.callback(payload);
        })
        .subscribe((status) => {
          console.log(`RealtimeManager: ${subscription.channelName} status:`, status);
          
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            // Don't block the app - just log and schedule reconnection
            console.warn(`RealtimeManager: ${subscription.channelName} had error, will retry...`);
            this.scheduleReconnect(subscription);
          }
        });

      subscription.channel = channel;
    } catch (error) {
      console.warn(`RealtimeManager: Failed to create channel ${subscription.channelName}:`, error);
      // Schedule retry even if creation fails
      this.scheduleReconnect(subscription);
    }
  }

  private scheduleReconnect(subscription: ChannelSubscription) {
    setTimeout(() => {
      console.log(`RealtimeManager: Reconnecting ${subscription.channelName}...`);
      this.reconnectChannel(subscription);
    }, 2000);
  }

  private reconnectChannel(subscription: ChannelSubscription) {
    if (subscription.channel) {
      supabase.removeChannel(subscription.channel);
    }
    this.createChannel(subscription);
  }

  private reconnectAll() {
    if (this.isReconnecting) return;
    
    this.isReconnecting = true;
    
    // Clear any pending reconnect
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Small delay to ensure network is stable
    this.reconnectTimeout = setTimeout(() => {
      console.log('RealtimeManager: Reconnecting all channels...');
      
      this.subscriptions.forEach((subscription) => {
        this.reconnectChannel(subscription);
      });

      this.isReconnecting = false;
    }, 1000);
  }

  unsubscribe(channelName: string) {
    const subscription = this.subscriptions.get(channelName);
    if (subscription?.channel) {
      supabase.removeChannel(subscription.channel);
    }
    this.subscriptions.delete(channelName);
  }

  unsubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      if (subscription.channel) {
        supabase.removeChannel(subscription.channel);
      }
    });
    this.subscriptions.clear();
  }

  // Force refresh all data - call callbacks to trigger data fetch
  forceRefresh() {
    console.log('RealtimeManager: Force refreshing all subscriptions...');
    this.subscriptions.forEach((subscription) => {
      subscription.callback({ eventType: 'REFRESH', new: null, old: null });
    });
  }

  destroy() {
    this.unsubscribeAll();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }

    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
    }

    if (this.appStateCleanup) {
      this.appStateCleanup();
    }
  }
}

// Singleton instance
export const realtimeManager = new RealtimeManager();

// Hook for using realtime in components
import { useEffect, useCallback, useRef } from 'react';

export const useRealtimeSubscription = (
  table: string,
  callback: () => void,
  filter?: string,
  enabled = true
) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const stableCallback = useCallback((payload: any) => {
    console.log(`useRealtimeSubscription: ${table} update`, payload);
    callbackRef.current();
  }, [table]);

  useEffect(() => {
    if (!enabled) return;

    const channelName = `${table}-${filter || 'all'}-${Date.now()}`;
    
    const cleanup = realtimeManager.subscribe(
      channelName,
      table,
      stableCallback,
      filter
    );

    // Also fetch data immediately
    callbackRef.current();

    return cleanup;
  }, [table, filter, enabled, stableCallback]);
};
