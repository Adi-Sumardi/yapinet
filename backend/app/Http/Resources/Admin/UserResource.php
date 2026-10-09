<?php

namespace App\Http\Resources\Admin;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'primary_email' => $this->primary_email,
            'status' => $this->status,
            'is_admin' => $this->isAdmin(),
            'apps_count' => $this->whenCounted('appAccess'),
            'has_logged_in' => $this->whenCounted('googleIdentities', fn ($count) => $count > 0),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
