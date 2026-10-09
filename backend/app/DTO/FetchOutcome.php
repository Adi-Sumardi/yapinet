<?php

namespace App\DTO;

/** Hasil satu panggilan ke URL API ringkasan — dipakai refresh & Tes Koneksi. */
final readonly class FetchOutcome
{
    /** @param list<string> $warnings peringatan bentuk respons terhadap kontrak */
    public function __construct(
        public bool $ok,
        public ?int $httpStatus,
        public int $durationMs,
        public SummaryResult $result,
        public array $warnings = [],
    ) {}
}
