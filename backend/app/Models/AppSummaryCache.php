<?php

namespace App\Models;

use App\Services\SettingsService;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppSummaryCache extends Model
{
    use HasUuids;

    protected $table = 'app_summary_cache';

    protected $fillable = [
        'app_id', 'unit_id', 'scope_key', 'status', 'headline', 'metrics', 'details', 'sections',
        'contract_version', 'error_message', 'fetched_at', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'metrics' => 'array',
            'details' => 'array',
            'sections' => 'array',
            'contract_version' => 'integer',
            'fetched_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saving(fn (self $cache) => $cache->scope_key = $cache->unit_id ?? 'all');
    }

    /** Data dianggap basi bila belum diperbarui selama integration.stale_after_minutes. */
    public function isStale(): bool
    {
        $minutes = (int) app(SettingsService::class)->get('integration.stale_after_minutes');

        return $this->fetched_at === null || $this->fetched_at->lt(now()->subMinutes($minutes));
    }

    public function app(): BelongsTo
    {
        return $this->belongsTo(YapinetApp::class, 'app_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }
}
