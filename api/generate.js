// Máy chủ nhỏ: nhận ảnh + yêu cầu từ trang web, gọi Google Gemini, trả kết quả.
// API key nằm trong biến môi trường GEMINI_API_KEY nên người dùng không thấy được.
//
// Biến môi trường (cài trong Vercel → Settings → Environment Variables):
//   GEMINI_API_KEY   (bắt buộc)  key lấy ở https://aistudio.google.com/apikey
//   GEMINI_MODEL     (tuỳ chọn)  tên model muốn dùng trước, ví dụ gemini-2.5-flash
//   APP_PASSWORD     (tuỳ chọn)  nếu đặt, người dùng phải nhập mã này mới dùng được
//   LIMIT_PER_HOUR   (tuỳ chọn)  số lượt tối đa mỗi giờ cho một địa chỉ IP (mặc định 60)

const FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
const hits = new Map(); // giới hạn lượt theo IP (tương đối: mỗi máy chủ tạm đếm riêng)

function tooMany(ip) {
  const limit = Number(process.env.LIMIT_PER_HOUR || 60);
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < 3600_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > limit;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ code: 'method', message: 'Chỉ nhận POST' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ code: 'no_key', message: 'Chưa cài GEMINI_API_KEY' });

  const pass = process.env.APP_PASSWORD;
  if (pass && req.headers['x-app-password'] !== pass) return res.status(401).json({ code: 'unauthorized' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (tooMany(ip)) return res.status(429).json({ code: 'rate_limited', message: 'Quá nhiều lượt trong 1 giờ' });

  const { prompt, images } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim()) return res.status(400).json({ code: 'bad_request', message: 'Thiếu yêu cầu' });
  const imgs = Array.isArray(images) ? images.slice(0, 8) : [];

  const body = {
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        ...imgs.filter(i => i && typeof i.data === 'string').map(i => ({ inline_data: { mime_type: i.mime || 'image/jpeg', data: i.data } })),
      ],
    }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.3, maxOutputTokens: 32768 },
  };

  const models = [...new Set([process.env.GEMINI_MODEL, ...FALLBACK_MODELS].filter(Boolean))];
  let last = null;
  for (const model of models) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        const parts = j?.candidates?.[0]?.content?.parts || [];
        const text = parts.filter(p => !p.thought && typeof p.text === 'string').map(p => p.text).join('');
        if (text) return res.status(200).json({ text, model });
        last = { status: 502, code: 'empty', message: 'Gemini không trả lời (có thể bị chặn nội dung). ' + (j?.candidates?.[0]?.finishReason || '') };
        continue;
      }
      const msg = j?.error?.message || ('HTTP ' + r.status);
      if (r.status === 429) { last = { status: 429, code: 'rate_limited', message: msg }; continue; }
      if (r.status === 404 || r.status === 400 && /model/i.test(msg)) { last = { status: 502, code: 'model', message: msg }; continue; }
      if (r.status === 400 || r.status === 403) return res.status(r.status).json({ code: 'gemini', message: msg });
      last = { status: 502, code: 'upstream', message: msg };
    } catch (e) {
      last = { status: 502, code: 'upstream', message: String(e?.message || e) };
    }
  }
  return res.status(last?.status || 502).json({ code: last?.code || 'upstream', message: last?.message || 'Lỗi không rõ' });
};
