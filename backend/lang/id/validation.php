<?php

/*
 * Pesan validasi Bahasa Indonesia (rules/formatting.md → copywriting).
 * Hanya aturan yang dipakai Yapinet; aturan lain jatuh ke fallback en.
 */

return [
    'array' => ':Attribute harus berupa daftar.',
    'boolean' => ':Attribute harus bernilai ya atau tidak.',
    'distinct' => ':Attribute memiliki nilai duplikat.',
    'email' => ':Attribute harus berupa alamat email yang valid.',
    'enum' => ':Attribute yang dipilih tidak valid.',
    'exists' => ':Attribute yang dipilih tidak ditemukan.',
    'file' => ':Attribute harus berupa berkas.',
    'image' => ':Attribute harus berupa gambar.',
    'in' => ':Attribute yang dipilih tidak valid.',
    'integer' => ':Attribute harus berupa bilangan bulat.',
    'max' => [
        'array' => ':Attribute maksimal berisi :max item.',
        'file' => ':Attribute maksimal :max KB.',
        'numeric' => ':Attribute maksimal :max.',
        'string' => ':Attribute maksimal :max karakter.',
    ],
    'mimes' => ':Attribute harus berupa berkas: :values.',
    'min' => [
        'array' => ':Attribute minimal berisi :min item.',
        'file' => ':Attribute minimal :min KB.',
        'numeric' => ':Attribute minimal :min.',
        'string' => ':Attribute minimal :min karakter.',
    ],
    'not_in' => ':Attribute yang dipilih tidak valid.',
    'numeric' => ':Attribute harus berupa angka.',
    'present' => ':Attribute wajib ada.',
    'regex' => 'Format :attribute tidak valid.',
    'required' => ':Attribute wajib diisi.',
    'required_if' => ':Attribute wajib diisi.',
    'starts_with' => ':Attribute harus diawali: :values.',
    'string' => ':Attribute harus berupa teks.',
    'unique' => ':Attribute sudah dipakai.',
    'url' => ':Attribute harus berupa URL yang valid (diawali https://).',
    'uuid' => ':Attribute tidak valid.',

    'attributes' => [
        'full_name' => 'nama lengkap',
        'primary_email' => 'email',
        'icon_type' => 'jenis ikon',
        'auth_type' => 'autentikasi',
        'api_key' => 'API key',
        'app_ids' => 'daftar menu',
        'ids' => 'urutan menu',
        'file' => 'gambar',
        'values' => 'pengaturan',
        'status' => 'status',
        'is_admin' => 'role Admin',
    ],
];
