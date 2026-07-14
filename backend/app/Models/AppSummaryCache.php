<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppSummaryCache extends Model
{
    use HasUuids;

    protected $table = 'app_summary_cache';

    protected $fillable = [
        'app_id', 'unit_id', 'status', 'headline', 'metrics', 'details', 'fetched_at', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'metrics' => 'array',
            'details' => 'array',
            'fetched_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function isStale(): bool
    {
        return $this->expires_at === null || $this->expires_at->isPast();
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
