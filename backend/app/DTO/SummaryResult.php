<?php

namespace App\DTO;

use Carbon\CarbonImmutable;

/**
 * Normalized shape every app adapter must return, matching the
 * "kontrak integrasi API" (GET /integrations/yapinet/summary) in the
 * Yapinet blueprint — one summary card's worth of data.
 */
final readonly class SummaryResult
{
    public function __construct(
        public string $status, // ok | warning | critical | degraded
        public ?string $headline,
        public array $metrics, // list of ['label' => ..., 'value' => ...]
        public ?CarbonImmutable $updatedAt,
        public ?string $detailPath,
    ) {
    }

    public static function degraded(string $reason): self
    {
        return new self(
            status: 'degraded',
            headline: $reason,
            metrics: [],
            updatedAt: null,
            detailPath: null,
        );
    }
}
