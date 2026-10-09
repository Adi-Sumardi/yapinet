<?php

namespace App\Console\Commands;

use App\Services\SummaryContract;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * Validasi file JSON respons ringkasan aplikasi anak terhadap kontrak
 * (rules/api.md & rules/detail-pages.md) tanpa perlu memanggil URL-nya —
 * untuk developer aplikasi anak saat membangun endpoint.
 */
#[Signature('app:check-summary {path : File JSON respons endpoint ringkasan}')]
#[Description('Periksa payload ringkasan aplikasi anak terhadap kontrak Yapinet')]
class CheckSummary extends Command
{
    public function handle(SummaryContract $contract): int
    {
        $data = json_decode((string) @file_get_contents($this->argument('path')), true);

        if (! is_array($data) || array_is_list($data)) {
            $this->error('File tidak ada atau bukan objek JSON.');

            return self::FAILURE;
        }

        $warnings = [];
        $result = $contract->normalize($data, $warnings);

        $this->line("Kontrak v{$result->contractVersion} · status {$result->status} · ".count($result->filters).' filter · '
            .count($result->attention).' perhatian · '.count($result->metrics).' angka · '.count($result->sections).' section');

        foreach ($warnings as $warning) {
            $this->warn("  ⚠ {$warning}");
        }

        if ($warnings === []) {
            $this->info('  ✓ Sesuai kontrak, tanpa peringatan.');
        }

        return $warnings === [] ? self::SUCCESS : self::FAILURE;
    }
}
