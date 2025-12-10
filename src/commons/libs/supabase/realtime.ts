import {supabase} from "./client";


export const subscribeToTags = (onInsert: (payload: unknown) => void, onDelete: (payload: unknown) => void) => {
  const channel = supabase
    .channel('tags')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tags',
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
            onInsert(payload);
        } else if (payload.eventType === 'DELETE') {
            onDelete(payload);
        }
      }
    )
    .subscribe(async (status, err) => {
      console.log(`[Realtime] Subscription status for 'tags': ${status}`);
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Successfully subscribed to tags changes');
      }
      if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Failed to subscribe to tags changes. Error detail:', err);
        // Check if we can just read the table normally
        const { data, error } = await supabase.from('tags').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('[Realtime] RLS verification failed. Cannot read "tags" table via REST:', error);
        } else {
            console.log('[Realtime] RLS verification passed. REST read allowed. If replication is definitely on, check your network tab for WebSocket (101) failures.');
        }
      }
      if (status === 'TIMED_OUT') {
        console.error('[Realtime] Subscription timed out');
      }
    });

  return channel;
};
