<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAppAccess extends Model
{
    use HasUuids;

    protected $table = 'user_app_access';

    protected $fillable = [
        'user_id', 'app_id', 'unit_id', 'yayasan_role', 'can_act', 'granted_by', 'granted_at',
    ];

    protected function casts(): array
    {
        return [
            'can_act' => 'boolean',
            'granted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function app(): BelongsTo
    {
        return $this->belongsTo(YapinetApp::class, 'app_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function grantedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'granted_by');
    }
}
