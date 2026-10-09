<?php

return [
    // Hanya dipakai migration add_password_to_users_table. Login password
    // sudah tidak dipakai lagi (kembali ke Google, khusus email terdaftar).
    'default_password' => env('YAPINET_DEFAULT_PASSWORD', 'Yapinet@2026'),
];
