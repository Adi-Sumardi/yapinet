<?php

namespace App\Services;

use App\DTO\SummaryResult;
use Carbon\CarbonImmutable;
use Illuminate\Support\Str;
use Throwable;

/**
 * Memvalidasi & menormalisasi respons aplikasi anak terhadap kontrak v1
 * (rules/api.md bagian B). Tidak pernah melempar exception: bagian yang
 * salah dibuang dan dicatat sebagai peringatan untuk Tes Koneksi.
 */
class SummaryContract
{
    public const STATUSES = ['ok', 'warning', 'critical', 'degraded'];

    public const FORMATS = ['number', 'currency', 'percent', 'date', 'datetime', 'text', 'badge'];

    public const SECTION_TYPES = ['stats', 'table', 'list', 'progress', 'alert', 'chart'];

    private const MAX_METRICS = 8;

    private const MAX_SECTIONS = 10;

    private const MAX_ITEMS = 200;

    /** @param list<string> $warnings diisi peringatan */
    public function normalize(array $data, array &$warnings = []): SummaryResult
    {
        $status = $data['status'] ?? null;
        if (! in_array($status, self::STATUSES, true)) {
            $warnings[] = 'Field "status" wajib salah satu dari: ok, warning, critical.';
            $status = 'degraded';
        }

        $headline = $data['headline'] ?? null;
        if ($headline !== null && ! is_string($headline)) {
            $warnings[] = 'Field "headline" harus berupa teks.';
            $headline = null;
        }

        return new SummaryResult(
            status: $status,
            headline: $headline !== null ? Str::limit($headline, 120) : null,
            metrics: $this->metrics($data['metrics'] ?? [], $warnings),
            sections: $this->sections($data['sections'] ?? [], $warnings),
            details: is_array($data['details'] ?? null) ? $data['details'] : [],
            contractVersion: (int) ($data['contract_version'] ?? 0),
            updatedAt: $this->date($data['updated_at'] ?? null, $warnings),
            detailPath: $this->path($data['detail_path'] ?? null, $warnings),
        );
    }

    private function metrics(mixed $metrics, array &$warnings): array
    {
        if (! is_array($metrics) || ! array_is_list($metrics)) {
            $warnings[] = 'Field "metrics" harus berupa daftar (array).';

            return [];
        }

        if (count($metrics) > self::MAX_METRICS) {
            $warnings[] = 'Field "metrics" maksimal '.self::MAX_METRICS.' item; sisanya dipotong.';
        }

        $clean = [];
        foreach (array_slice($metrics, 0, self::MAX_METRICS) as $i => $metric) {
            if (! is_array($metric) || ! is_string($metric['label'] ?? null) || ! is_scalar($metric['value'] ?? null)) {
                $warnings[] = "metrics[{$i}] harus punya \"label\" (teks) dan \"value\" (angka/teks).";

                continue;
            }

            $format = $metric['format'] ?? null;
            $clean[] = [
                'label' => Str::limit($metric['label'], 40),
                'value' => $metric['value'],
                'format' => in_array($format, self::FORMATS, true) ? $format : null,
            ];
        }

        return $clean;
    }

    private function sections(mixed $sections, array &$warnings): array
    {
        if (! is_array($sections) || ! array_is_list($sections)) {
            $warnings[] = 'Field "sections" harus berupa daftar (array).';

            return [];
        }

        if (count($sections) > self::MAX_SECTIONS) {
            $warnings[] = 'Field "sections" maksimal '.self::MAX_SECTIONS.' item; sisanya dipotong.';
        }

        $clean = [];
        foreach (array_slice($sections, 0, self::MAX_SECTIONS) as $i => $section) {
            $type = is_array($section) ? ($section['type'] ?? null) : null;

            if (! in_array($type, self::SECTION_TYPES, true)) {
                $warnings[] = "sections[{$i}] punya type tidak dikenal; diabaikan.";

                continue;
            }

            foreach (['items', 'rows'] as $listKey) {
                if (isset($section[$listKey]) && is_array($section[$listKey]) && count($section[$listKey]) > self::MAX_ITEMS) {
                    $warnings[] = "sections[{$i}].{$listKey} maksimal ".self::MAX_ITEMS.' baris; sisanya dipotong.';
                    $section[$listKey] = array_slice($section[$listKey], 0, self::MAX_ITEMS);
                }
            }

            $clean[] = $section;
        }

        return $clean;
    }

    private function date(mixed $value, array &$warnings): ?CarbonImmutable
    {
        if ($value === null) {
            return null;
        }

        try {
            return CarbonImmutable::parse($value);
        } catch (Throwable) {
            $warnings[] = 'Field "updated_at" bukan tanggal ISO 8601 yang valid.';

            return null;
        }
    }

    private function path(mixed $value, array &$warnings): ?string
    {
        if ($value === null) {
            return null;
        }

        if (! is_string($value) || ! str_starts_with($value, '/') || str_starts_with($value, '//')) {
            $warnings[] = 'Field "detail_path" harus path relatif yang diawali "/".';

            return null;
        }

        return $value;
    }
}
