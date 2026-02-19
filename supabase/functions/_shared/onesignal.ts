const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID') ?? '';
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY') ?? '';

export async function sendOneSignalNotification(params: {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<{ success: boolean; id?: string; errors?: string[] }> {
  const response = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${ONESIGNAL_REST_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: params.userIds,
      headings: { en: params.title, ja: params.title },
      contents: { en: params.body, ja: params.body },
      data: params.data ?? {},
    }),
  });

  const json = await response.json();
  if (!response.ok) {
    return { success: false, errors: json.errors ?? [json.error ?? 'unknown'] };
  }
  return { success: true, id: json.id };
}
