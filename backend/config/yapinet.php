<?php

return [
    // Hanya dipakai migration add_password_to_users_table. Login password
    // sudah tidak dipakai lagi (kembali ke Google, khusus email terdaftar).
    'default_password' => env('YAPINET_DEFAULT_PASSWORD', 'Yapinet@2026'),

    // Khusus development lokal: arahkan URL API ringkasan ke dev server
    // aplikasi anak saat AppRegistrySeeder dijalankan. Di produksi menu
    // diatur admin lewat /admin/menu, bukan lewat env.
    'dev_summary_urls' => array_filter([
        'SNGR' => env('SNGR_SUMMARY_URL'),
        'SMYA' => env('SMYA_SUMMARY_URL'),
        'SMNK' => env('SMNK_SUMMARY_URL'),
        'SMNS' => env('SMNS_SUMMARY_URL'),
    ]),
];
