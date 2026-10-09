<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Satu baris = user boleh melihat menu itu. Tidak ada peran per menu —
 * role Yapinet hanya Admin & User (users.is_admin).
 */
class UserAppAccess extends Model
{
    use HasUuids;

    protected $table = 'user_app_access';

    protected $fillable = ['user_id', 'app_id', 'unit_id', 'scope_key', 'granted_by', 'granted_at'];

    protected function casts(): array
    {
        return ['granted_at' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::saving(fn (self $access) => $access->scope_key = $access->unit_id ?? 'all');
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
