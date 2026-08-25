function botToken() {
  return String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
}

async function telegramApiGet(method, query) {
  const token = botToken();
  if (!token) return null;
  const qs = new URLSearchParams(query).toString();
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}?${qs}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) return null;
  return data.result;
}

/** Latest profile photo for a Telegram user (requires prior bot interaction). */
export async function fetchTelegramUserProfilePhoto(userId) {
  const uid = parseInt(String(userId), 10);
  if (!Number.isFinite(uid) || uid <= 0) return null;
  if (!botToken()) return null;

  const photos = await telegramApiGet('getUserProfilePhotos', {
    user_id: String(uid),
    limit: '1',
  });
  const sizes = photos?.photos?.[0];
  if (!Array.isArray(sizes) || !sizes.length) return null;

  const best = sizes[sizes.length - 1];
  const fileId = best?.file_id;
  if (!fileId) return null;

  const file = await telegramApiGet('getFile', { file_id: fileId });
  const filePath = file?.file_path;
  if (!filePath) return null;

  const fileUrl = `https://api.telegram.org/file/bot${botToken()}/${filePath}`;
  const imgRes = await fetch(fileUrl);
  if (!imgRes.ok) return null;

  const buffer = Buffer.from(await imgRes.arrayBuffer());
  if (!buffer.length) return null;

  const contentType = String(imgRes.headers.get('content-type') ?? 'image/jpeg').trim() || 'image/jpeg';
  return { buffer, contentType };
}
