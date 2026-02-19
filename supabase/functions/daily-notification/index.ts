import { createServiceClient } from '../_shared/supabase.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { sendOneSignalNotification } from '../_shared/onesignal.ts';

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
}

/**
 * Daily notification Edge Function
 * Triggered by Supabase cron job to send morning greetings
 * Sends only to users with journal_reminder_enabled = true
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth: accept service_role Bearer token OR x-cron-secret header
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const cronSecret = Deno.env.get('CRON_SECRET');
    const incomingCronSecret = req.headers.get('x-cron-secret');

    const isServiceRole = serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`;
    const isCron = cronSecret && incomingCronSecret === cronSecret;

    if (!isServiceRole && !isCron) {
      return new Response(
        JSON.stringify({ error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createServiceClient();

    // Step 1: Get active subscribers with profiles
    const { data: activeSubscriptions } = await supabase
      .from('subscriptions')
      .select('user_id, profiles(display_name, twin_name, timezone)')
      .in('status', ['active', 'trial']);

    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Step 2: Filter by notification_settings (journal_reminder_enabled)
    const userIds = activeSubscriptions.map((s: Record<string, unknown>) => s.user_id as string);
    const { data: enabledSettings } = await supabase
      .from('notification_settings')
      .select('user_id')
      .in('user_id', userIds)
      .eq('journal_reminder_enabled', true);

    const enabledUserIds = new Set(
      (enabledSettings ?? []).map((s: { user_id: string }) => s.user_id),
    );

    const activeUsers = activeSubscriptions.filter(
      (s: Record<string, unknown>) => enabledUserIds.has(s.user_id as string),
    );

    if (activeUsers.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Filter users where it's currently morning (7-9 AM) in their timezone
    const now = new Date();
    const morningUsers = activeUsers.filter((u: Record<string, unknown>) => {
      const profile = u.profiles as Record<string, string> | null;
      const tz = profile?.timezone || 'Asia/Tokyo';
      const localHour = parseInt(
        now.toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false }),
      );
      return localHour >= 7 && localHour <= 9;
    });

    if (morningUsers.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Build per-user notification messages
    const notifications: NotificationPayload[] = morningUsers.map((u: Record<string, unknown>) => {
      const profile = u.profiles as Record<string, string> | null;
      const twinName = profile?.twin_name || 'AltMe';
      const displayName = profile?.display_name || 'ユーザー';

      const greetings = [
        `おはよう、${displayName}さん！今日はどんな1日にする？`,
        `${displayName}さん、おはようございます。${twinName}だよ。今日の調子はどう？`,
        `おはよう！昨日もお疲れさま。今日も一緒に頑張ろう。`,
        `${displayName}さん、新しい1日の始まりだね。何か楽しみなことはある？`,
      ];

      return {
        userId: u.user_id as string,
        title: twinName,
        body: greetings[Math.floor(Math.random() * greetings.length)],
      };
    });

    // Send per-user because each greeting is personalized
    let sentCount = 0;
    const errors: string[] = [];

    for (const notification of notifications) {
      const result = await sendOneSignalNotification({
        userIds: [notification.userId],
        title: notification.title,
        body: notification.body,
        data: { screen: 'journal' },
      });

      if (result.success) {
        sentCount++;
      } else {
        console.error(`Failed to send to user ${notification.userId}:`, result.errors);
        errors.push(...(result.errors ?? []));
      }
    }

    console.log(`Sent ${sentCount}/${notifications.length} morning notifications`);

    return new Response(
      JSON.stringify({ sent: sentCount, errors: errors.length > 0 ? errors : undefined }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Daily notification error:', error);
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
