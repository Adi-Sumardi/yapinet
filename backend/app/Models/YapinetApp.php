<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class YapinetApp extends Model
{
    use HasUuids;

    protected $table = 'apps';

    protected $fillable = [
        'code', 'name', 'icon_url', 'base_url', 'public_url',
        'summary_endpoint', 'sso_endpoint', 'cache_ttl_seconds', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'cache_ttl_seconds' => 'integer',
        ];
    }

    public function credential(): HasOne
    {
        return $this->hasOne(AppCredential::class, 'app_id');
    }

    public function userAppAccess(): HasMany
    {
        return $this->hasMany(UserAppAccess::class, 'app_id');
    }

    public function summaryCache(): HasMany
    {
        return $this->hasMany(AppSummaryCache::class, 'app_id');
    }
}
