<?php

/*
 * Definisi pengaturan dinamis (rules/system-features.md F8). Nilai yang
 * diubah admin disimpan di tabel `settings`; tanpa baris di DB → `default`.
 * Menambah pengaturan baru cukup menambah entri di sini (tanpa migrasi).
 *
 * type   : string | text | bool | int | color | image | enum
 * public : dikirim ke frontend tanpa login (GET /api/settings/public)
 */

return [
    'groups' => [
        'branding' => 'Branding',
        'login' => 'Halaman Login',
        'dashboard' => 'Dashboard',
        'access' => 'Akses',
        'integration' => 'Integrasi',
        'announcement' => 'Pengumuman',
        'contact' => 'Kontak',
    ],

    'definitions' => [
        'branding.app_name' => ['label' => 'Nama aplikasi', 'type' => 'string', 'default' => 'Yapinet', 'public' => true, 'rules' => ['required', 'string', 'max:50']],
        'branding.logo_url' => ['label' => 'Logo', 'type' => 'image', 'default' => null, 'public' => true, 'rules' => ['nullable', 'string', 'max:500']],
        'branding.primary_color' => ['label' => 'Warna utama', 'type' => 'color', 'default' => '#2E6DA4', 'public' => true, 'rules' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/']],
        'branding.footer_text' => ['label' => 'Teks footer', 'type' => 'string', 'default' => '© 2026 Yayasan — Yapinet', 'public' => true, 'rules' => ['nullable', 'string', 'max:120']],

        'login.headline' => ['label' => 'Judul', 'type' => 'string', 'default' => 'Satu Aplikasi, Semua Layanan Yayasan', 'public' => true, 'rules' => ['required', 'string', 'max:80']],
        'login.subtitle' => ['label' => 'Deskripsi', 'type' => 'text', 'default' => 'Yapinet menghubungkan akademik, keuangan, SDM, dan operasional dalam satu ekosistem super app.', 'public' => true, 'rules' => ['nullable', 'string', 'max:300']],
        'login.help_text' => ['label' => 'Teks bantuan', 'type' => 'string', 'default' => 'Butuh bantuan akses? Hubungi Admin Yayasan.', 'public' => true, 'rules' => ['nullable', 'string', 'max:150']],

        'dashboard.welcome_title' => ['label' => 'Judul sapaan', 'type' => 'string', 'default' => 'Selamat Datang di Dashboard Yapinet', 'public' => false, 'rules' => ['required', 'string', 'max:80']],
        'dashboard.welcome_subtitle' => ['label' => 'Subjudul sapaan', 'type' => 'string', 'default' => "Let's connect", 'public' => false, 'rules' => ['nullable', 'string', 'max:120']],
        'dashboard.show_status_badge' => ['label' => 'Tampilkan titik status di menu', 'type' => 'bool', 'default' => true, 'public' => false, 'rules' => ['boolean']],

        'access.auto_grant_new_users' => ['label' => 'Pengguna baru otomatis dapat menu yang "berikan ke semua"', 'type' => 'bool', 'default' => true, 'public' => false, 'rules' => ['boolean']],

        'integration.default_refresh_minutes' => ['label' => 'Interval refresh default (menit)', 'type' => 'int', 'default' => 10, 'public' => false, 'rules' => ['required', 'integer', 'min:1', 'max:1440']],
        'integration.request_timeout_seconds' => ['label' => 'Batas waktu panggilan API (detik)', 'type' => 'int', 'default' => 5, 'public' => false, 'rules' => ['required', 'integer', 'min:1', 'max:20']],
        'integration.stale_after_minutes' => ['label' => 'Data dianggap basi setelah (menit)', 'type' => 'int', 'default' => 60, 'public' => false, 'rules' => ['required', 'integer', 'min:5', 'max:10080']],

        'announcement.enabled' => ['label' => 'Tampilkan pengumuman', 'type' => 'bool', 'default' => false, 'public' => false, 'rules' => ['boolean']],
        'announcement.text' => ['label' => 'Isi pengumuman', 'type' => 'text', 'default' => '', 'public' => false, 'rules' => ['nullable', 'string', 'max:500']],
        'announcement.level' => ['label' => 'Jenis', 'type' => 'enum', 'options' => ['info' => 'Info', 'warning' => 'Peringatan', 'critical' => 'Penting'], 'default' => 'info', 'public' => false, 'rules' => ['required', 'in:info,warning,critical']],

        'contact.admin_whatsapp' => ['label' => 'WhatsApp admin', 'type' => 'string', 'default' => '', 'public' => true, 'rules' => ['nullable', 'string', 'max:30']],
        'contact.admin_email' => ['label' => 'Email admin', 'type' => 'string', 'default' => '', 'public' => true, 'rules' => ['nullable', 'email', 'max:100']],
    ],
];
