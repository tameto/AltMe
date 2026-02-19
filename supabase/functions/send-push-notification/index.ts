import { corsHeaders } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { sendOneSignalNotification } from '../_shared/onesignal.ts';

type NotificationCategory = 'chat' | 'journal_reminder' | 'community' | 'marketing';

interface SendPushRequest {
  user_ids: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  category?: NotificationCategory;
}

// Map category to the notification_settings column name
const CATEGORY_COLUMN: Record<NotificationCategory, string> = {
  chat: 'chat_enabled',
  journal_reminder: 'journal_reminder_enabled',
  community: 'community_enabled',
  marketing: 'marketing_enabled',
};

/**
 * send-push-notification Edge Function
 * Generic push notification sender. Internal use only (service_role).
 *
 * POST /send-push-notification
 * Authorization: Bearer <service_role_key>
 * Body: {
 *   "user_ids": ["uuid1", "uuid2"],
 *   "title": "通知タイトル",
 *   "body": "通知本文",
 *   "data": { "screen": "chat", "conversation_id": "xxx" },
 *   "category": "chat" | "journal_reminder" | "community" | "marketing"
 * }
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // This function is callable only from service_role (internal use).
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'server_misconfiguration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${serviceRoleKey}`) {
      return new Response(
        JSON.stringify({ error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body: SendPushRequest = await req.json();
    const { user_ids, title, body: notificationBody, data, category } = body;

    const MAX_USER_IDS = 2000;
    if (!user_ids || user_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'user_ids is required and must not be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (user_ids.length > MAX_USER_IDS) {
      return new Response(
        JSON.stringify({ error: `user_ids must not exceed ${MAX_USER_IDS}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!title || !notificationBody) {
      return new Response(
        JSON.stringify({ error: 'title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let targetUserIds = user_ids;

    // If category is specified, filter to users who have that category enabled
    if (category) {
      const column = CATEGORY_COLUMN[category];
      if (!column) {
        return new Response(
          JSON.stringify({ error: `invalid category: ${category}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const supabase = createServiceClient();
      const { data: enabledSettings, error: settingsError } = await supabase
        .from('notification_settings')
        .select('user_id')
        .in('user_id', user_ids)
        .eq(column, true);

      if (settingsError) {
        console.error('Failed to fetch notification_settings:', settingsError);
        return new Response(
          JSON.stringify({ error: 'internal_error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      targetUserIds = (enabledSettings ?? []).map(
        (s: { user_id: string }) => s.user_id,
      );

      if (targetUserIds.length === 0) {
        return new Response(
          JSON.stringify({ sent: 0, skipped: user_ids.length }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    const result = await sendOneSignalNotification({
      userIds: targetUserIds,
      title,
      body: notificationBody,
      data,
    });

    if (!result.success) {
      console.error('OneSignal error:', result.errors);
      return new Response(
        JSON.stringify({ error: 'notification_send_failed', details: result.errors }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const skipped = user_ids.length - targetUserIds.length;
    return new Response(
      JSON.stringify({
        sent: targetUserIds.length,
        skipped,
        notification_id: result.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('send-push-notification error:', error);
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
