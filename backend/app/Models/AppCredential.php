<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppCredential extends Model
{
    use HasUuids;

    protected $fillable = [
        'app_id', 'api_key_encrypted', 'sso_signing_key_encrypted', 'rotated_at',
    ];

    protected function casts(): array
    {
        return [
            'rotated_at' => 'datetime',
            'api_key_encrypted' => 'encrypted',
            'sso_signing_key_encrypted' => 'encrypted',
        ];
    }

    public function app(): BelongsTo
    {
        return $this->belongsTo(YapinetApp::class, 'app_id');
    }
}
