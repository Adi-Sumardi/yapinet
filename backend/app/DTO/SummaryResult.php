<?php

namespace App\DTO;

use Carbon\CarbonImmutable;

/**
 * Bentuk ringkasan yang sudah dinormalisasi dari respons aplikasi anak
 * (kontrak v1 di rules/api.md). Inilah yang disimpan ke app_summary_cache.
 */
final readonly class SummaryResult
{
    public function __construct(
        public string $status, // ok | warning | critical | degraded
        public ?string $headline,
        public array $metrics, // list of ['label' => ..., 'value' => ..., 'format' => ?]
        public array $sections, // list of section (type stats|table|list|progress|alert|chart)
        public array $details, // payload bebas untuk layout khusus lama (deprecated)
        public int $contractVersion,
        public ?CarbonImmutable $updatedAt,
        public ?string $detailPath,
        public ?string $errorMessage = null,
    ) {}

    public static function degraded(string $reason): self
    {
        return new self(
            status: 'degraded',
            headline: null,
            metrics: [],
            sections: [],
            details: [],
            contractVersion: 0,
            updatedAt: null,
            detailPath: null,
            errorMessage: $reason,
        );
    }
}
