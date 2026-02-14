import { createServiceClient } from '../_shared/supabase.ts';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Daily notification Edge Function
 * Triggered by Supabase cron job to send morning greetings
 *
 * TODO: Task #27 - Connect to Expo Push Notifications service
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();

    // Get all users with active subscriptions or in trial
    const { data: activeUsers } = await supabase
      .from('subscriptions')
      .select('user_id, profiles(display_name, twin_name, timezone)')
      .in('status', ['active', 'trial']);

    if (!activeUsers || activeUsers.length === 0) {
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

    // TODO: Send push notifications via Expo Notifications
    // For each user, send a personalized morning greeting
    const notifications = morningUsers.map((u: Record<string, unknown>) => {
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
        userId: u.user_id,
        title: twinName,
        body: greetings[Math.floor(Math.random() * greetings.length)],
      };
    });

    console.log(`Prepared ${notifications.length} morning notifications`);

    // TODO: Actually send via Expo Push API
    // await sendExpoPushNotifications(notifications);

    return new Response(
      JSON.stringify({ sent: notifications.length }),
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
