<?php

namespace App\Http\Resources;

use App\Models\AppSummaryCache;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AppSummaryCache */
class SummaryCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'unit' => $this->unit?->only(['id', 'name']),
            'status' => $this->status,
            'is_stale' => $this->isStale(),
            'headline' => $this->headline,
            'metrics' => $this->metrics ?? [],
            'sections' => $this->sections ?? [],
            'filters' => $this->filters ?? [],
            'attention' => $this->attention ?? [],
            'details' => $this->details ?? [],
            'contract_version' => $this->contract_version,
            'error_message' => $this->error_message,
            'fetched_at' => $this->fetched_at?->toIso8601String(),
        ];
    }
}
