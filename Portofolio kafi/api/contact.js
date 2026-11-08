// Vercel Serverless Function: kirim pesan form kontak lewat Resend.
// API key dibaca dari environment variable RESEND_API_KEY (di dashboard Vercel),
// tidak pernah dikirim ke browser.
//
// Env opsional:
//   CONTACT_TO   alamat tujuan (default: kafiakmalfalah91@gmail.com)
//   CONTACT_FROM pengirim, harus domain terverifikasi di Resend
//                (default: "Portofolio <onboarding@resend.dev>", hanya bisa kirim ke email pemilik akun Resend)

const TO = process.env.CONTACT_TO || 'kafiakmalfalah91@gmail.com';
const FROM = process.env.CONTACT_FROM || 'Portofolio <onboarding@resend.dev>';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

function sameSite(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // permintaan non-browser / same-origin tanpa header
  try {
    const host = new URL(origin).hostname;
    return host === 'localhost' || host === '127.0.0.1' ||
      host === 'kafiakmal.web.id' || host === 'www.kafiakmal.web.id' ||
      host.endsWith('.vercel.app');
  } catch (e) { return false; }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (!sameSite(req)) return res.status(403).json({ ok: false, error: 'Forbidden' });

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY belum diatur');
    return res.status(500).json({ ok: false, error: 'Server belum dikonfigurasi' });
  }

  const b = (typeof req.body === 'object' && req.body) || {};
  const nama = String(b.nama || '').trim();
  const email = String(b.email || '').trim();
  const phone = String(b.phone || '').trim();
  const pesan = String(b.pesan || '').trim();

  // Honeypot: bot mengisi kolom tersembunyi. Balas sukses tanpa mengirim.
  if (b._gotcha) return res.status(200).json({ ok: true });

  if (!nama || nama.length > 100) return res.status(400).json({ ok: false, error: 'Nama tidak valid' });
  if (!EMAIL_RE.test(email) || email.length > 200) return res.status(400).json({ ok: false, error: 'Email tidak valid' });
  if (phone.length > 40) return res.status(400).json({ ok: false, error: 'Nomor telepon terlalu panjang' });
  if (pesan.length < 10 || pesan.length > 5000) return res.status(400).json({ ok: false, error: 'Pesan tidak valid' });

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <h2 style="margin:0 0 12px">Pesan baru dari portofolio</h2>
      <p style="margin:0"><strong>Nama:</strong> ${esc(nama)}</p>
      <p style="margin:0"><strong>Email:</strong> ${esc(email)}</p>
      ${phone ? `<p style="margin:0"><strong>Telepon:</strong> ${esc(phone)}</p>` : ''}
      <hr style="border:0;border-top:1px solid #e2e8f0;margin:16px 0">
      <p style="white-space:pre-wrap;margin:0">${esc(pesan)}</p>
    </div>`;
  const text = `Pesan baru dari portofolio\n\nNama: ${nama}\nEmail: ${email}${phone ? `\nTelepon: ${phone}` : ''}\n\n${pesan}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email, // tombol "Balas" langsung ke pengirim
        subject: `Pesan dari ${nama.slice(0, 80)} (portofolio)`,
        html,
        text
      }),
      signal: ctrl.signal
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      console.error('Resend error', r.status, detail);
      return res.status(502).json({ ok: false, error: 'Gagal mengirim email' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend request failed', err && err.message);
    return res.status(502).json({ ok: false, error: 'Gagal mengirim email' });
  } finally {
    clearTimeout(timer);
  }
};
