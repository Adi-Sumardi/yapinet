<?php

namespace App\Http\Requests\Admin;

use App\Enums\AuthType;
use App\Enums\IconType;
use App\Enums\OpenMode;
use App\Models\YapinetApp;
use App\Rules\SafeExternalUrl;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Dipakai untuk tambah (POST) dan ubah (PUT) menu. */
class SaveAppRequest extends FormRequest
{
    /** Bentrok dengan path tetap di frontend (rules/views.md). */
    public const RESERVED_SLUGS = ['login', 'auth', 'akun', 'admin', 'settings', 'assets', 'icons', 'api', 'storage'];

    public function rules(): array
    {
        /** @var YapinetApp|null $app */
        $app = $this->route('app');
        $required = $app ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'max:100'],
            'slug' => [$required, 'string', 'max:50', 'regex:/^[a-z0-9]+(-[a-z0-9]+)*$/', Rule::notIn(self::RESERVED_SLUGS), Rule::unique('apps', 'slug')->ignore($app?->id)],
            'code' => ['sometimes', 'string', 'max:20', 'regex:/^[A-Z0-9]+$/', Rule::unique('apps', 'code')->ignore($app?->id)],
            'description' => ['nullable', 'string', 'max:255'],
            'icon_type' => [$required, Rule::enum(IconType::class)],
            'icon_text' => ['nullable', 'required_if:icon_type,initials', 'string', 'max:3'],
            'icon_url' => ['nullable', 'required_if:icon_type,image', 'string', 'max:500'],
            'color' => [$required, 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'is_active' => ['sometimes', 'boolean'],
            'open_url' => [$required, 'url:https,http', 'max:255'],
            'open_mode' => [$required, Rule::enum(OpenMode::class)],
            'sso_path' => ['nullable', 'required_if:open_mode,handoff', 'string', 'max:255', 'starts_with:/'],
            'summary_url' => ['nullable', 'url:https,http', 'max:255', new SafeExternalUrl],
            'auth_type' => [$required, Rule::enum(AuthType::class)],
            'auth_header' => ['nullable', 'required_if:auth_type,header', 'string', 'max:100', 'regex:/^[A-Za-z0-9-]+$/'],
            'api_key' => ['sometimes', 'nullable', 'string', 'max:500'],
            'remove_api_key' => ['sometimes', 'boolean'],
            'refresh_minutes' => ['nullable', 'integer', 'min:1', 'max:1440'],
            'detail_layout' => [$required, Rule::in(YapinetApp::DETAIL_LAYOUTS)],
            'grant_to_all' => ['sometimes', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'nama', 'slug' => 'slug', 'icon_text' => 'inisial', 'icon_url' => 'gambar ikon',
            'color' => 'warna', 'open_url' => 'URL aplikasi', 'open_mode' => 'mode buka',
            'sso_path' => 'path SSO', 'summary_url' => 'URL API ringkasan', 'auth_header' => 'nama header',
            'refresh_minutes' => 'interval refresh', 'detail_layout' => 'tampilan detail',
        ];
    }

    public function messages(): array
    {
        return [
            'slug.regex' => 'Slug hanya boleh huruf kecil, angka, dan tanda hubung (mis. "arsip-digital").',
            'slug.not_in' => 'Slug ini dipakai sistem, pilih yang lain.',
            'color.regex' => 'Warna harus format hex, mis. #2E6DA4.',
        ];
    }
}
