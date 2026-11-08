# Portofolio Kafi Akmal Falah

Website portofolio frontend developer junior dan UI/UX designer. Dibuat dengan HTML, CSS, dan JavaScript murni
(tanpa framework), ditambah dua fungsi serverless untuk chatbot dan form kontak.

**Live:** https://www.kafiakmal.web.id

## Fitur

- **Desain gelap yang responsif** (360px sampai desktop), navbar yang menyembunyikan diri saat scroll turun, dan menu mobile layar penuh.
- **Hero dengan lingkaran bercahaya** yang melayang dan mengikuti kursor (parallax). Hanya `transform`, `translate`, `scale`, dan `opacity` yang dianimasikan.
- **Chatbot "Tanya soal Kafi"** memakai Groq. Jawabannya dibatasi pada data portofolio, dan API key hanya ada di server.
- **Form kontak** terhubung ke Resend lewat fungsi serverless, dengan validasi di browser dan server serta honeypot anti-bot.
- **Halaman sertifikat** dengan filter kategori dan lightbox.
- **Aksesibilitas:** tautan "Lewati ke konten", `:focus-visible`, `aria-*` pada menu, dan semua animasi dimatikan saat `prefers-reduced-motion`.
- **SEO:** judul dan deskripsi unik per halaman, Open Graph, dan favicon.

## Teknologi

HTML, CSS, JavaScript, Lenis (smooth scroll), Vercel Serverless Functions, Groq API, Resend API.

## Struktur

```
Portofolio kafi/
  index.html, about.html, projek.html, contact.html
  style.css, script.js, lenis.min.js
  assets/            gambar dan logo
  api/
    chat.js          chatbot (Groq)
    contact.js       form kontak (Resend)
dev-server.js        server lokal untuk tes situs + API
```

## Menjalankan secara lokal

Butuh Node.js 18 atau lebih baru.

1. Buat file `.env` di folder induk (jangan di-commit, sudah ada di `.gitignore`):

   ```
   GROQ_API_KEY=isi_key_groq
   RESEND_API_KEY=isi_key_resend
   ```

2. Jalankan server lokal:

   ```
   node dev-server.js
   ```

3. Buka http://localhost:3000

Live Server biasa hanya menyajikan file statis, jadi chatbot dan form tidak berfungsi di sana.

## Deploy ke Vercel

1. Import repo ini, lalu set **Root Directory** ke `Portofolio kafi`.
2. Tambahkan Environment Variables: `GROQ_API_KEY` dan `RESEND_API_KEY`.
   Opsional: `GROQ_MODEL`, `CONTACT_TO`, `CONTACT_FROM`.
3. Deploy. Folder `api/` otomatis menjadi `/api/chat` dan `/api/contact`.

## Kontak

Kafi Akmal Falah, [LinkedIn](https://www.linkedin.com/in/kafi-akmal-falah-2a3440412/),
[kafiakmalfalah91@gmail.com](mailto:kafiakmalfalah91@gmail.com)
