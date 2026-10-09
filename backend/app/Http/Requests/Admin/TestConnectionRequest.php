<?php

namespace App\Http\Requests\Admin;

use App\Enums\AuthType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Tes Koneksi dari isi form (belum disimpan). Bila api_key tidak dikirim
 * tetapi app_id ada, key tersimpan milik menu itu yang dipakai.
 */
class TestConnectionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'summary_url' => ['required', 'url:https,http', 'max:255'],
            'auth_type' => ['required', Rule::enum(AuthType::class)],
            'auth_header' => ['nullable', 'string', 'max:100', 'regex:/^[A-Za-z0-9-]+$/'],
            'api_key' => ['nullable', 'string', 'max:500'],
            'app_id' => ['nullable', 'uuid', 'exists:apps,id'],
        ];
    }
}
