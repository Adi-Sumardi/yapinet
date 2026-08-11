<?php

return [
    // Password awal yang diberikan ke user yang belum pernah set password
    // sendiri (user lama hasil migrasi dari login Google, atau user baru
    // yang dibuat admin). User wajib menggantinya lewat /auth/change-password
    // sebelum bisa memakai aplikasi (lihat users.must_change_password).
    'default_password' => env('YAPINET_DEFAULT_PASSWORD', 'Yapinet@2026'),
];
