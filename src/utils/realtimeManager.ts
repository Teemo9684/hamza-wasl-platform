import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ChannelSubscription {
  channelName: string;
  table: string;
  callback: (payload: any) => void;
  filter?: string;
  channel?: RealtimeChannel;
}

class RealtimeManager {
  private subscriptions: Map<string, ChannelSubscription> = new Map();
  private isReconnecting = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private visibilityHandler: (() => void) | null = null;
  private onlineHandler: (() => void) | null = null;

  constructor() {
    this.setupGlobalListeners();
  }

  private setupGlobalListeners() {
    // Handle app visibility changes (when app comes to foreground)
    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        console.log('RealtimeManager: App became visible, reconnecting...');
        this.reconnectAll();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    // Handle online/offline status
    this.onlineHandler = () => {
      if (navigator.onLine) {
        console.log('RealtimeManager: Network restored, reconnecting...');
        this.reconnectAll();
      }
    };
    window.addEventListener('online', this.onlineHandler);

    // Handle Capacitor app state changes
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            console.log('RealtimeManager: Capacitor app became active, reconnecting...');
            this.reconnectAll();
          }
        });
      }).catch(() => {
        // Capacitor not available
      });
    }
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

    const channel = supabase
      .channel(subscription.channelName)
      .on('postgres_changes', config, (payload) => {
        console.log(`RealtimeManager: Update received for ${subscription.table}`, payload);
        subscription.callback(payload);
      })
      .subscribe((status) => {
        console.log(`RealtimeManager: ${subscription.channelName} status:`, status);
        
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Schedule reconnection
          this.scheduleReconnect(subscription);
        }
      });

    subscription.channel = channel;
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

    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }

    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
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
