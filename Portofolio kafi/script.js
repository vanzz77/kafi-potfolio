// Tahun otomatis di footer
var tahun = document.getElementById("tahun");
if (tahun) {
    tahun.textContent = new Date().getFullYear();
}

// Formulir kontak: validasi, state tombol, honeypot, dan kirim ke /api/contact (Resend, di sisi server).
// API key Resend tidak ada di sini; hanya ada di environment variable Vercel.
(function () {
    var form = document.getElementById("form-kontak");
    if (!form) return;

    var EMAIL_TUJUAN = "kafiakmalfalah91@gmail.com";
    var endpoint = form.getAttribute("data-endpoint") || "";
    var terhubung = endpoint !== "" && endpoint.indexOf("YOUR_FORM_ID") === -1;

    var btn = form.querySelector(".btn-kirim");
    var label = btn.querySelector(".btn-label");
    var statusEl = document.getElementById("form-status");
    var resetTimer = null;

    var fields = {
        nama: form.elements["nama"],
        email: form.elements["email"],
        pesan: form.elements["pesan"]
    };

    var LABEL = {
        idle: "Kirim Pesan",
        loading: "Mengirim...",
        success: "Terkirim",
        error: "Gagal, coba lagi"
    };

    function setState(state) {
        btn.setAttribute("data-state", state);
        label.textContent = LABEL[state];
        btn.disabled = state === "loading";
        btn.setAttribute("aria-busy", state === "loading" ? "true" : "false");
    }

    function setStatus(text, type) {
        statusEl.textContent = text;
        statusEl.className = "form-status" + (type ? " is-" + type : "");
    }

    function errorEl(field) {
        return document.getElementById(field.id + "-error");
    }

    function showError(field, message) {
        errorEl(field).textContent = message;
        field.setAttribute("aria-invalid", "true");
    }

    function clearError(field) {
        errorEl(field).textContent = "";
        field.removeAttribute("aria-invalid");
    }

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function validate(field) {
        var v = field.value.trim();
        var msg = "";
        if (field === fields.nama) {
            if (!v) msg = "Nama wajib diisi.";
        } else if (field === fields.email) {
            if (!v) msg = "Email wajib diisi.";
            else if (!EMAIL_RE.test(v)) msg = "Format email belum benar. Contoh: nama@email.com";
        } else if (field === fields.pesan) {
            if (!v) msg = "Pesan wajib diisi.";
            else if (v.length < 10) msg = "Pesan minimal 10 karakter.";
        }
        if (msg) showError(field, msg); else clearError(field);
        return !msg;
    }

    // Validasi saat keluar dari kolom, lalu ikut diperbarui saat mengetik
    Object.keys(fields).forEach(function (key) {
        var f = fields[key];
        f.addEventListener("blur", function () { validate(f); });
        f.addEventListener("input", function () {
            if (f.hasAttribute("aria-invalid")) validate(f);
            if (btn.getAttribute("data-state") === "error") setState("idle");
        });
    });

    function bukaEmail(nama, email, pesan) {
        var subjek = "Pesan dari " + nama;
        var isi = pesan + "\n\n" + nama + " (" + email + ")";
        window.location.href = "mailto:" + EMAIL_TUJUAN +
            "?subject=" + encodeURIComponent(subjek) +
            "&body=" + encodeURIComponent(isi);
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        clearTimeout(resetTimer);
        setStatus("", "");

        var valid = true;
        var pertama = null;
        ["nama", "email", "pesan"].forEach(function (key) {
            if (!validate(fields[key])) {
                valid = false;
                if (!pertama) pertama = fields[key];
            }
        });
        if (!valid) {
            pertama.focus();
            setStatus("Periksa kembali kolom yang ditandai.", "error");
            return;
        }

        // Honeypot: bot mengisi kolom tersembunyi, tampilkan sukses palsu tanpa mengirim
        if (form.elements["_gotcha"].value) {
            setState("success");
            setStatus("Terima kasih, pesanmu sudah terkirim.", "success");
            form.reset();
            return;
        }

        var nama = fields.nama.value.trim();
        var email = fields.email.value.trim();
        var pesan = fields.pesan.value.trim();

        // Layanan belum dihubungkan: pakai aplikasi email sebagai cadangan
        if (!terhubung) {
            bukaEmail(nama, email, pesan);
            setStatus("Form belum terhubung ke layanan pengiriman, jadi aplikasi emailmu dibuka. Kirim pesannya dari sana.", "info");
            return;
        }

        setState("loading");
        setStatus("Mengirim pesan...", "info");

        var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
        var timeout = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;

        var data = {
            nama: nama,
            email: email,
            phone: form.elements["phone"] ? form.elements["phone"].value.trim() : "",
            pesan: pesan,
            _gotcha: form.elements["_gotcha"].value
        };

        fetch(endpoint, {
            method: "POST",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            signal: ctrl ? ctrl.signal : undefined
        }).then(function (res) {
            if (!res.ok) throw new Error("HTTP " + res.status);
            setState("success");
            setStatus("Terima kasih, pesanmu sudah terkirim.", "success");
            form.reset();
            Object.keys(fields).forEach(function (k) { clearError(fields[k]); });
            resetTimer = setTimeout(function () { setState("idle"); }, 5000);
        }).catch(function () {
            setState("error");
            setStatus("Pesan belum terkirim. Coba lagi sebentar, atau hubungi lewat WhatsApp atau email di bawah.", "error");
        }).then(function () {
            if (timeout) clearTimeout(timeout);
        });
    });
})();

// site header js

const siteHeader = document.querySelector('.site-header');

// Navbar auto-hide: sembunyi saat scroll turun, muncul saat scroll naik
(function () {
    const HIDE_AFTER = 80;   // px dari atas sebelum boleh bersembunyi
    const THRESHOLD = 8;     // abaikan gerakan kecil
    const TOP_ZONE = 10;     // di sini navbar selalu tampil
    let lastY = window.scrollY;
    let ticking = false;

    function menuTerbuka() {
        const nav = document.querySelector('.navlinks');
        return !!nav && nav.classList.contains('open');
    }

    function update() {
        ticking = false;
        const y = window.scrollY;

        siteHeader.classList.toggle('scrolled', y > 50);

        if (y < TOP_ZONE || menuTerbuka() || siteHeader.matches(':focus-within')) {
            siteHeader.classList.remove('navbar--hidden');
            lastY = y;
            return;
        }

        const delta = y - lastY;
        if (Math.abs(delta) < THRESHOLD) return;

        if (delta > 0 && y > HIDE_AFTER) {
            siteHeader.classList.add('navbar--hidden');
        } else if (delta < 0) {
            siteHeader.classList.remove('navbar--hidden');
        }
        lastY = y;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }, { passive: true });

    // Fokus keyboard ke dalam navbar: tampilkan lagi
    siteHeader.addEventListener('focusin', function () {
        siteHeader.classList.remove('navbar--hidden');
    });

    update();
})();

// Menu mobile
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.navlinks');

if (menuToggle && navLinks) {
    menuToggle.setAttribute('aria-expanded', 'false');
    const setMenu = (open) => {
        menuToggle.classList.toggle('open', open);
        navLinks.classList.toggle('open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
    };
    menuToggle.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
    navLinks.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
}

// Halaman sertifikat: filter tahun + lightbox.
// Daftar sertifikat dibaca saat dibutuhkan (bukan sekali di awal) supaya tetap jalan
// walau kartunya diganti oleh data dari CMS.
(function () {
    var grid = document.querySelector('.certs');
    var box = document.getElementById('lightbox');
    if (!grid || !box) return;

    var img = document.getElementById('lb-img');
    var title = document.getElementById('lb-title');
    var openLink = document.getElementById('lb-open');
    var current = 0;
    var active = 'all';

    function all() { return Array.prototype.slice.call(grid.querySelectorAll('.cert')); }
    function visible() { return all().filter(function (c) { return !c.hidden; }); }

    function applyFilter() {
        all().forEach(function (c) {
            c.hidden = !(active === 'all' || c.getAttribute('data-cat') === active);
        });
    }
    window.applyCertFilter = applyFilter;

    // Filter (delegasi, jadi tombol kategori baru dari CMS ikut berfungsi)
    var bar = document.querySelector('.filters');
    if (bar) {
        bar.addEventListener('click', function (e) {
            var btn = e.target.closest('.filter');
            if (!btn) return;
            active = btn.getAttribute('data-filter');
            bar.querySelectorAll('.filter').forEach(function (b) {
                var on = b === btn;
                b.classList.toggle('is-active', on);
                b.setAttribute('aria-pressed', String(on));
            });
            applyFilter();
        });
    }

    // Lightbox
    function show(cert) {
        var t = cert.querySelector('.cert-thumb');
        img.src = t.getAttribute('data-full');
        img.alt = cert.querySelector('img').alt;
        title.textContent = t.getAttribute('data-title');
        openLink.href = t.getAttribute('data-full');
        current = visible().indexOf(cert);
    }

    function step(dir) {
        var list = visible();
        if (!list.length) return;
        show(list[(current + dir + list.length) % list.length]);
    }

    grid.addEventListener('click', function (e) {
        var t = e.target.closest('.cert-thumb');
        if (!t) return;
        show(t.closest('.cert'));
        if (typeof box.showModal === 'function') box.showModal();
        else box.setAttribute('open', '');
    });

    document.getElementById('lb-close').addEventListener('click', function () { box.close(); });
    document.getElementById('lb-prev').addEventListener('click', function () { step(-1); });
    document.getElementById('lb-next').addEventListener('click', function () { step(1); });

    // Klik area gelap di luar konten menutup
    box.addEventListener('click', function (e) {
        if (e.target === box) box.close();
    });

    box.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') step(-1);
        if (e.key === 'ArrowRight') step(1);
    });
})();

// Muncul halus saat di-scroll. Dibuka sebagai window.observeReveal supaya
// kartu yang dibuat belakangan (dari CMS) ikut teramati.
(function () {
    var io = null;

    function observe(list) {
        var items = Array.prototype.slice.call(list);
        if (!items.length) return;
        if (!('IntersectionObserver' in window)) {
            items.forEach(function (el) { el.classList.add('in'); });
            return;
        }
        if (!io) {
            io = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) {
                        e.target.classList.add('in');
                        io.unobserve(e.target);
                    }
                });
            }, { threshold: 0.12 });
        }
        items.forEach(function (el, i) {
            el.style.transitionDelay = (i % 4) * 70 + 'ms';
            io.observe(el);
        });

        // Jaring pengaman: elemen yang sudah di dalam layar tapi belum terpicu observer
        setTimeout(function () {
            items.forEach(function (el) {
                if (!el.classList.contains('in') && el.getBoundingClientRect().top < window.innerHeight) {
                    el.classList.add('in');
                }
            });
        }, 1200);
    }

    window.observeReveal = observe;
    observe(document.querySelectorAll('.reveal'));
})();

// Kalimat besar: kata menyala satu per satu saat di-scroll
(function () {
    var el = document.querySelector('.statement-text');
    if (!el) return;
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = words.map(function (w) {
        return '<span class="w" aria-hidden="true">' + w + '</span>';
    }).join(' ');
    var spans = el.querySelectorAll('.w');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
        spans.forEach(function (s) { s.classList.add('on'); });
        return;
    }
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) {
                e.target.classList.add('on');
            } else if (e.boundingClientRect.top > 0) {
                e.target.classList.remove('on');
            }
        });
    }, { rootMargin: '0px 0px -28% 0px' });
    spans.forEach(function (s) { io.observe(s); });
})();

// Smooth scroll (Lenis) - mati otomatis kalau pengguna memilih reduced motion
(function () {
    if (typeof Lenis === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var lenis = new Lenis({
        lerp: 0.16,
        wheelMultiplier: 1,
        smoothWheel: true
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Tautan #anchor ikut halus dan memperhitungkan tinggi navbar
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            var id = a.getAttribute('href');
            if (!id || id.length < 2) return;
            var target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            lenis.scrollTo(target, { offset: -90 });
        });
    });

    // Hentikan scroll halaman saat menu mobile atau lightbox terbuka
    function lockWhen(el, test) {
        if (!el) return;
        new MutationObserver(function () {
            if (test(el)) lenis.stop(); else lenis.start();
        }).observe(el, { attributes: true, attributeFilter: ['class', 'open'] });
    }
    lockWhen(document.querySelector('.navlinks'), function (el) { return el.classList.contains('open'); });
    lockWhen(document.getElementById('lightbox'), function (el) { return el.hasAttribute('open'); });
})();

// ===== Tambahan UX =====

// Tautan "Lewati ke konten" untuk pengguna keyboard dan screen reader
(function () {
    var main = document.querySelector('main');
    if (!main) return;
    if (!main.id) main.id = 'konten';
    main.setAttribute('tabindex', '-1');
    var a = document.createElement('a');
    a.className = 'skip-link';
    a.href = '#' + main.id;
    a.textContent = 'Lewati ke konten';
    a.addEventListener('click', function (e) {
        e.preventDefault();
        main.focus({ preventScroll: true });
        main.scrollIntoView();
    });
    document.body.insertBefore(a, document.body.firstChild);
})();

// Bilah progres scroll + tombol kembali ke atas
(function () {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    var top = document.createElement('button');
    top.type = 'button';
    top.className = 'to-top';
    top.setAttribute('aria-label', 'Kembali ke atas');
    top.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    document.body.appendChild(top);

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    top.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });

    var ticking = false;
    function update() {
        ticking = false;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var y = window.scrollY;
        bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
        top.classList.toggle('is-visible', y > 600);
    }
    window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
})();

// Daftar proyek (rail): geser dengan drag mouse
(function () {
    var rail = document.querySelector('.rail');
    if (!rail) return;
    var down = false, moved = false, startX = 0, startLeft = 0;

    rail.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        down = true; moved = false;
        startX = e.clientX; startLeft = rail.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
        if (!down) return;
        var dx = e.clientX - startX;
        if (Math.abs(dx) > 5) { moved = true; rail.classList.add('is-dragging'); }
        if (moved) rail.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
        down = false;
        rail.classList.remove('is-dragging');
    });
    // Setelah drag, jangan ikut membuka tautan kartu
    rail.addEventListener('click', function (e) {
        if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);
    rail.addEventListener('dragstart', function (e) { e.preventDefault(); });
})();

// Form kontak: penghitung karakter + Ctrl/Cmd+Enter untuk kirim
(function () {
    var form = document.getElementById('form-kontak');
    if (!form) return;
    var pesan = form.elements['pesan'];
    if (!pesan) return;

    var MIN = 10;
    var info = document.createElement('p');
    info.className = 'char-count';
    info.setAttribute('aria-hidden', 'true');
    pesan.insertAdjacentElement('afterend', info);

    function update() {
        var n = pesan.value.trim().length;
        info.textContent = n < MIN ? n + ' / minimal ' + MIN + ' karakter' : n + ' karakter';
        info.classList.toggle('is-ok', n >= MIN);
    }
    pesan.addEventListener('input', update);
    form.addEventListener('reset', function () { setTimeout(update, 0); });
    update();

    pesan.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (form.requestSubmit) form.requestSubmit();
        }
    });
})();

// Lightbox: geser jari kiri/kanan untuk pindah sertifikat
(function () {
    var box = document.getElementById('lightbox');
    var prev = document.getElementById('lb-prev');
    var next = document.getElementById('lb-next');
    if (!box || !prev || !next) return;
    var x0 = null;
    box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        x0 = null;
        if (Math.abs(dx) < 50) return;
        (dx > 0 ? prev : next).click();
    }, { passive: true });
})();

// ===== Lingkaran dekoratif: latar halaman dalam + parallax kursor =====
(function () {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var holder = document.querySelector('.aurora-rings');

    // Halaman tanpa hero aurora: buat 3 lingkaran gradasi di latar
    if (!holder) {
        holder = document.createElement('div');
        holder.className = 'bg-orbs';
        holder.setAttribute('aria-hidden', 'true');
        for (var i = 0; i < 3; i++) {
            var o = document.createElement('span');
            o.className = 'bg-orb';
            holder.appendChild(o);
        }
        document.body.insertBefore(holder, document.body.firstChild);
    }

    // Parallax hanya di perangkat dengan kursor, dan bila gerakan tidak dikurangi
    if (reduce || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var items = Array.prototype.slice.call(holder.children);
    var depths = items.map(function (el) {
        return parseFloat(getComputedStyle(el).getPropertyValue('--depth')) || 10;
    });
    var tx = 0, ty = 0, raf = 0;

    function apply() {
        raf = 0;
        items.forEach(function (el, i) {
            el.style.setProperty('--px', (tx * depths[i]).toFixed(1) + 'px');
            el.style.setProperty('--py', (ty * depths[i]).toFixed(1) + 'px');
        });
    }

    window.addEventListener('pointermove', function (e) {
        tx = e.clientX / window.innerWidth - 0.5;
        ty = e.clientY / window.innerHeight - 0.5;
        if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
})();

// ===== Angka statistik: hitung naik saat terlihat (sekali), tanda "+" tetap =====
(function () {
    var nodes = document.querySelectorAll('.a-stats-row strong, .facts-row strong');
    if (!nodes.length) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;

    function run(el) {
        var text = el.textContent.trim();
        var m = text.match(/^(\d+)(.*)$/);
        if (!m) return;
        var target = parseInt(m[1], 10), suffix = m[2];
        var dur = 1200, t0 = null;
        el.setAttribute('aria-label', text);
        function tick(t) {
            if (t0 === null) t0 = t;
            var p = Math.min((t - t0) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
        }
        el.textContent = '0' + suffix;
        requestAnimationFrame(tick);
    }

    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) { io.unobserve(e.target); run(e.target); }
        });
    }, { threshold: 0.6 });
    nodes.forEach(function (n) { io.observe(n); });
})();

// ===== Menu mobile: hubungkan tombol dengan menu untuk pembaca layar =====
(function () {
    var t = document.querySelector('.menu-toggle');
    var n = document.querySelector('.navlinks');
    if (!t || !n) return;
    if (!n.id) n.id = 'menu-utama';
    t.setAttribute('aria-controls', n.id);
    t.setAttribute('aria-label', 'Buka atau tutup menu');
})();

// ===== Menu mobile: ikon di setiap tautan + panah (dipakai CSS hanya di layar kecil) =====
(function () {
    var ICONS = {
        'index.html': '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
        'about.html': '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c.8-4 4-6 7.5-6s6.7 2 7.5 6"/>',
        'projek.html': '<rect x="3.5" y="4" width="17" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
        'contact.html': '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>'
    };
    var svg = function (inner, cls) {
        return '<svg class="' + cls + '" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + inner + '</svg>';
    };
    document.querySelectorAll('.navlinks li').forEach(function (li, i) {
        var a = li.querySelector('a');
        if (!a || a.querySelector('.nav-ico')) return;
        var file = (a.getAttribute('href') || '').split('/').pop();
        li.style.setProperty('--i', i);
        var label = document.createElement('span');
        label.className = 'nav-label';
        label.textContent = a.textContent.trim();
        a.textContent = '';
        a.insertAdjacentHTML('beforeend', ICONS[file] ? svg(ICONS[file], 'nav-ico') : '');
        a.appendChild(label);
        a.insertAdjacentHTML('beforeend', svg('<path d="m9 6 6 6-6 6"/>', 'nav-chev'));
    });
})();

// ===== Chatbot: "Tanya soal Kafi" (memanggil /api/chat, key Groq ada di server) =====
(function () {
    var ENDPOINT = '/api/chat';
    var MAX_LEN = 600;
    var SUGGEST = ['Proyek apa saja yang sudah dikerjakan Kafi?', 'Apa keahlian utama Kafi?', 'Bagaimana cara menghubungi Kafi?'];
    var GREET = 'Halo, aku asisten di portofolio Kafi. Kamu bisa bertanya soal proyek, keahlian, sertifikat, atau cara menghubungi Kafi. 👋';

    var history = [];
    try { history = JSON.parse(sessionStorage.getItem('chat-history') || '[]'); } catch (e) { history = []; }
    if (!Array.isArray(history)) history = [];
    function save() { try { sessionStorage.setItem('chat-history', JSON.stringify(history.slice(-20))); } catch (e) {} }

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text) n.textContent = text;
        return n;
    }
    var ICON_CHAT = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.7-5.4A8.5 8.5 0 1 1 21 11.5z"/><path d="M8.5 11h7M8.5 14h4"/></svg>';
    var ICON_CLOSE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    var ICON_SEND = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';

    // Peluncur
    var launcher = el('button', 'chat-launcher');
    launcher.type = 'button';
    launcher.setAttribute('aria-label', 'Buka asisten: tanya soal Kafi');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-controls', 'chat-panel');
    launcher.innerHTML = ICON_CHAT;

    // Panel
    var panel = el('section', 'chat-panel');
    panel.id = 'chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Asisten portofolio Kafi');
    panel.hidden = true;

    var head = el('div', 'chat-head');
    var titles = el('div', 'chat-titles');
    titles.appendChild(el('strong', '', 'Tanya soal Kafi'));
    var sub = el('span', 'chat-sub');
    sub.appendChild(el('i', 'chat-dot'));
    sub.appendChild(document.createTextNode('Asisten AI, jawaban dari isi portofolio'));
    titles.appendChild(sub);
    var closeBtn = el('button', 'chat-close');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Tutup asisten');
    closeBtn.innerHTML = ICON_CLOSE;
    head.appendChild(titles);
    head.appendChild(closeBtn);

    var log = el('div', 'chat-log');
    log.setAttribute('data-lenis-prevent', '');
    log.setAttribute('role', 'log');
    log.setAttribute('aria-live', 'polite');

    var chips = el('div', 'chat-chips');

    var form = el('form', 'chat-form');
    form.setAttribute('autocomplete', 'off');
    var input = el('input', 'chat-input');
    input.type = 'text';
    input.maxLength = MAX_LEN;
    input.placeholder = 'Tulis pertanyaanmu tentang Kafi...';
    input.setAttribute('aria-label', 'Pertanyaan untuk asisten');
    var send = el('button', 'chat-send');
    send.type = 'submit';
    send.setAttribute('aria-label', 'Kirim');
    send.innerHTML = ICON_SEND;
    form.appendChild(input);
    form.appendChild(send);

    panel.appendChild(head);
    panel.appendChild(log);
    panel.appendChild(chips);
    panel.appendChild(form);
    document.body.appendChild(panel);
    document.body.appendChild(launcher);

    // Ubah URL, email, dan path halaman situs menjadi tautan (dibuat lewat DOM, bukan innerHTML)
    var LINK_RE = /(https?:\/\/[^\s<>"']+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|\/(?:index|about|projek|contact)\.html(?:#[\w-]+)?)/g;
    function fill(node, text) {
        var last = 0, m;
        LINK_RE.lastIndex = 0;
        while ((m = LINK_RE.exec(text))) {
            var raw = m[0].replace(/[.,;:!?)\]]+$/, ''); // buang tanda baca di ujung
            if (m.index > last) node.appendChild(document.createTextNode(text.slice(last, m.index)));
            var a = document.createElement('a');
            a.className = 'chat-link';
            a.textContent = raw;
            if (raw.indexOf('@') > 0 && raw.indexOf('/') === -1) {
                a.href = 'mailto:' + raw;
            } else if (raw.charAt(0) === '/') {
                a.href = raw;
            } else {
                a.href = raw;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
            }
            node.appendChild(a);
            last = m.index + raw.length;
            LINK_RE.lastIndex = last;
        }
        if (last < text.length) node.appendChild(document.createTextNode(text.slice(last)));
    }

    function addMsg(role, text) {
        var m = el('div', 'chat-msg chat-' + role);
        if (role === 'bot') fill(m, text); else m.textContent = text;
        log.appendChild(m);
        log.scrollTop = log.scrollHeight;
        return m;
    }

    function renderSuggest() {
        chips.textContent = '';
        if (history.length) return;
        SUGGEST.forEach(function (q) {
            var b = el('button', 'chat-chip', q);
            b.type = 'button';
            b.addEventListener('click', function () { ask(q); });
            chips.appendChild(b);
        });
    }

    var busy = false;
    function ask(text) {
        text = (text || '').trim();
        if (!text || busy) return;
        busy = true;
        send.disabled = true;
        input.value = '';
        history.push({ role: 'user', content: text.slice(0, MAX_LEN) });
        addMsg('user', text);
        renderSuggest();

        var typing = el('div', 'chat-msg chat-bot chat-typing');
        typing.setAttribute('aria-label', 'Asisten sedang mengetik');
        typing.innerHTML = '<i></i><i></i><i></i>';
        log.appendChild(typing);
        log.scrollTop = log.scrollHeight;

        var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var to = ctrl ? setTimeout(function () { ctrl.abort(); }, 20000) : null;

        fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: history.slice(-10) }),
            signal: ctrl ? ctrl.signal : undefined
        }).then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (d) {
                if (!res.ok || !d.ok) {
                    var e = new Error(d.error || 'HTTP ' + res.status);
                    e.status = res.status;
                    throw e;
                }
                return d.reply;
            });
        }).then(function (reply) {
            typing.remove();
            history.push({ role: 'assistant', content: reply });
            addMsg('bot', reply);
            save();
        }).catch(function (err) {
            typing.remove();
            history.pop(); // pertanyaan gagal tidak disimpan
            var msg = err && err.status === 429
                ? 'Pesannya cukup banyak dalam waktu singkat. Coba lagi sebentar lagi, ya.'
                : 'Maaf, aku sedang tidak bisa menjawab. Coba lagi sebentar, atau hubungi Kafi lewat /contact.html atau WhatsApp https://wa.me/6281381367040';
            var m = addMsg('bot', msg);
            m.classList.add('chat-error');
        }).then(function () {
            if (to) clearTimeout(to);
            busy = false;
            send.disabled = false;
            if (!panel.hidden) input.focus();
        });
    }

    form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });

    var restored = false;
    function open() {
        if (!restored) {
            restored = true;
            addMsg('bot', GREET);
            history.forEach(function (m) { addMsg(m.role === 'user' ? 'user' : 'bot', m.content); });
            renderSuggest();
        }
        panel.hidden = false;
        // reflow agar transisi berjalan
        void panel.offsetWidth;
        panel.classList.add('is-open');
        launcher.classList.add('is-hidden');
        launcher.setAttribute('aria-expanded', 'true');
        setTimeout(function () { input.focus(); }, 80);
    }
    function close() {
        panel.classList.remove('is-open');
        launcher.classList.remove('is-hidden');
        launcher.setAttribute('aria-expanded', 'false');
        setTimeout(function () { if (!panel.classList.contains('is-open')) panel.hidden = true; }, 220);
        launcher.focus();
    }

    launcher.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !panel.hidden) close();
    });
})();
