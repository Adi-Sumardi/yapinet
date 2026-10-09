<?php

namespace App\Http\Resources;

use App\Models\AppSummaryCache;
use App\Models\YapinetApp;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin YapinetApp */
class MenuItemResource extends JsonResource
{
    private const SEVERITY = ['critical' => 3, 'warning' => 2, 'ok' => 1, 'degraded' => 0];

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'code' => $this->code,
            'name' => $this->name,
            'description' => $this->description,
            'icon' => ['type' => $this->icon_type->value, 'text' => $this->icon_text, 'url' => $this->icon_url],
            'color' => $this->color,
            'open_mode' => $this->open_mode->value,
            'detail_layout' => $this->detail_layout,
            'has_summary' => $this->hasSummary(),
            'summary_status' => $this->when($this->relationLoaded('summaries'), fn () => $this->worstStatus()),
        ];
    }

    /** Status paling parah di antara semua unit — untuk titik status di tile. */
    private function worstStatus(): ?string
    {
        if (! $this->hasSummary()) {
            return null;
        }

        return $this->summaries
            ->map(fn (AppSummaryCache $cache) => $cache->status)
            ->sortByDesc(fn (string $status) => self::SEVERITY[$status] ?? 0)
            ->first();
    }
}
