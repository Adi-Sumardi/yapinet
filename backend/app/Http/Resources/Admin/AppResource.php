<?php

namespace App\Http\Resources\Admin;

use App\Models\YapinetApp;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Semua field menu untuk panel admin. API key TIDAK pernah dikirim —
 * hanya has_api_key + 4 karakter terakhir (rules/security.md §3).
 *
 * @mixin YapinetApp
 */
class AppResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'slug' => $this->slug,
            'name' => $this->name,
            'description' => $this->description,
            'icon_type' => $this->icon_type->value,
            'icon_text' => $this->icon_text,
            'icon_url' => $this->icon_url,
            'color' => $this->color,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'open_url' => $this->open_url,
            'open_mode' => $this->open_mode->value,
            'sso_path' => $this->sso_path,
            'summary_url' => $this->summary_url,
            'auth_type' => $this->auth_type->value,
            'auth_header' => $this->auth_header,
            'has_api_key' => (bool) $this->credential?->api_key,
            'api_key_hint' => $this->credential?->hint(),
            'refresh_minutes' => $this->refresh_minutes,
            'detail_layout' => $this->detail_layout,
            'grant_to_all' => $this->grant_to_all,
            'users_count' => $this->whenCounted('accessGrants'),
            'last_checked_at' => $this->last_checked_at?->toIso8601String(),
            'last_check_ok' => $this->last_check_ok,
            'last_check_message' => $this->last_check_message,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
