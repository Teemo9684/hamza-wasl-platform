import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

type TableName = 
  | 'students' 
  | 'profiles' 
  | 'messages' 
  | 'attendance' 
  | 'grades' 
  | 'homework' 
  | 'news_ticker' 
  | 'document_requests'
  | 'parent_students'
  | 'teacher_students'
  | 'teacher_grade_levels'
  | 'class_schedules'
  | 'user_roles';

type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeOptions {
  table: TableName;
  event?: EventType;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onChange?: (payload: any) => void;
  enabled?: boolean;
}

export const useRealtime = ({
  table,
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
  enabled = true,
}: UseRealtimeOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleChange = useCallback((payload: any) => {
    const eventType = payload.eventType;
    
    if (onChange) {
      onChange(payload);
    }

    switch (eventType) {
      case 'INSERT':
        onInsert?.(payload);
        break;
      case 'UPDATE':
        onUpdate?.(payload);
        break;
      case 'DELETE':
        onDelete?.(payload);
        break;
    }
  }, [onChange, onInsert, onUpdate, onDelete]);

  useEffect(() => {
    if (!enabled) return;

    const channelName = `realtime-${table}-${Date.now()}`;
    
    const subscriptionConfig: any = {
      event,
      schema: 'public',
      table,
    };

    if (filter) {
      subscriptionConfig.filter = filter;
    }

    channelRef.current = supabase
      .channel(channelName)
      .on('postgres_changes', subscriptionConfig, handleChange)
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, event, filter, handleChange, enabled]);

  return channelRef.current;
};

// Hook for subscribing to multiple tables at once
interface MultiTableSubscription {
  table: TableName;
  filter?: string;
}

export const useMultiRealtime = (
  tables: MultiTableSubscription[],
  onChange: (table: TableName, payload: any) => void,
  enabled = true
) => {
  const channelsRef = useRef<RealtimeChannel[]>([]);

  useEffect(() => {
    if (!enabled) return;

    // Clean up existing channels
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    // Create new channels for each table
    tables.forEach(({ table, filter }) => {
      const channelName = `multi-realtime-${table}-${Date.now()}`;
      
      const subscriptionConfig: any = {
        event: '*',
        schema: 'public',
        table,
      };

      if (filter) {
        subscriptionConfig.filter = filter;
      }

      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', subscriptionConfig, (payload) => {
          onChange(table, payload);
        })
        .subscribe();

      channelsRef.current.push(channel);
    });

    return () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [tables.map(t => t.table).join(','), enabled]);

  return channelsRef.current;
};
