// Tahun otomatis di footer
var tahun = document.getElementById("tahun");
if (tahun) {
    tahun.textContent = new Date().getFullYear();
}

// Formulir kontak: membuka aplikasi email dengan pesan yang sudah terisi.
// Tidak memakai API key, jadi aman dipasang di website publik.
var form = document.getElementById("form-kontak");
var EMAIL_TUJUAN = "kafiakmalfalah91@gmail.com";

if (form) {
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        var status = document.getElementById("status");
        var nama = form.elements["nama"].value.trim();
        var email = form.elements["email"].value.trim();
        var pesan = form.elements["pesan"].value.trim();

        if (!nama || !email || !pesan) {
            status.textContent = "Lengkapi nama, email, dan pesan terlebih dahulu.";
            return;
        }
        if (!form.elements["email"].checkValidity()) {
            status.textContent = "Format email belum benar. Contoh: nama@email.com";
            return;
        }

        var subjek = "Pesan dari " + nama;
        var isi = pesan + "\n\n" + nama + " (" + email + ")";
        window.location.href =
            "mailto:" + EMAIL_TUJUAN +
            "?subject=" + encodeURIComponent(subjek) +
            "&body=" + encodeURIComponent(isi);
        status.textContent = "Aplikasi email kamu akan terbuka. Kirim pesannya dari sana.";
    });
}

// site header js

const siteHeader = document.querySelector('.site-header');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        siteHeader.classList.add('scrolled');
    } else {
        siteHeader.classList.remove('scrolled');
    }
});

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
