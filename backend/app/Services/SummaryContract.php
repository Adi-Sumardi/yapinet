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

    public const SECTION_TYPES = ['stats', 'table', 'list', 'progress', 'alert', 'chart', 'funnel'];

    public const TONES = ['info', 'ok', 'warning', 'critical', 'neutral'];

    // v1.1 mengirim varian per nilai filter (`when`), jadi batasnya lebih longgar.
    private const MAX_METRICS = 64;

    private const MAX_SECTIONS = 80;

    private const MAX_ATTENTION = 40;

    private const MAX_FILTERS = 4;

    private const MAX_FILTER_OPTIONS = 16;

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
            filters: $this->filters($data['filters'] ?? [], $warnings),
            attention: $this->attention($data['attention'] ?? [], $warnings),
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
            $trend = is_array($metric['trend'] ?? null) && is_string($metric['trend']['text'] ?? null) ? $metric['trend'] : null;
            $progress = is_numeric($metric['progress'] ?? null) ? max(0, min(1, (float) $metric['progress'])) : null;

            $clean[] = array_filter([
                'label' => Str::limit($metric['label'], 40),
                'value' => $metric['value'],
                'format' => in_array($format, self::FORMATS, true) ? $format : null,
                'hint' => is_string($metric['hint'] ?? null) ? Str::limit($metric['hint'], 80) : null,
                'progress' => $progress,
                'trend' => $trend ? ['text' => Str::limit($trend['text'], 60), 'tone' => $this->tone($trend['tone'] ?? null)] : null,
                'when' => $this->when($metric['when'] ?? null),
            ], fn ($v) => $v !== null);
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

            if (($when = $this->when($section['when'] ?? null)) !== null) {
                $section['when'] = $when;
            } else {
                unset($section['when']);
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

    /** Filter yang disediakan aplikasi (unit, tahun ajaran, …) — v1.1. */
    private function filters(mixed $filters, array &$warnings): array
    {
        if (! is_array($filters) || ! array_is_list($filters)) {
            $warnings[] = 'Field "filters" harus berupa daftar (array).';

            return [];
        }

        $clean = [];
        foreach (array_slice($filters, 0, self::MAX_FILTERS) as $i => $filter) {
            $options = is_array($filter['options'] ?? null) ? $filter['options'] : [];
            $options = array_values(array_filter(
                array_slice($options, 0, self::MAX_FILTER_OPTIONS),
                fn ($o) => is_array($o) && is_scalar($o['value'] ?? null) && is_string($o['label'] ?? null),
            ));

            if (! is_string($filter['key'] ?? null) || ! is_string($filter['label'] ?? null) || $options === []) {
                $warnings[] = "filters[{$i}] butuh \"key\", \"label\", dan minimal satu \"options\" {value, label}.";

                continue;
            }

            $values = array_map(fn ($o) => (string) $o['value'], $options);
            $default = (string) ($filter['default'] ?? $values[0]);

            $clean[] = [
                'key' => Str::limit($filter['key'], 30, ''),
                'label' => Str::limit($filter['label'], 30),
                'default' => in_array($default, $values, true) ? $default : $values[0],
                'options' => array_map(fn ($o) => ['value' => (string) $o['value'], 'label' => Str::limit($o['label'], 40)], $options),
            ];
        }

        return $clean;
    }

    /** Kartu "Perlu perhatian" — v1.1. */
    private function attention(mixed $items, array &$warnings): array
    {
        if (! is_array($items) || ! array_is_list($items)) {
            $warnings[] = 'Field "attention" harus berupa daftar (array).';

            return [];
        }

        $clean = [];
        foreach (array_slice($items, 0, self::MAX_ATTENTION) as $i => $item) {
            if (! is_array($item) || ! is_string($item['title'] ?? null)) {
                $warnings[] = "attention[{$i}] butuh \"title\" (teks).";

                continue;
            }

            $clean[] = array_filter([
                'tone' => $this->tone($item['tone'] ?? null),
                'title' => Str::limit($item['title'], 120),
                'description' => is_string($item['description'] ?? null) ? Str::limit($item['description'], 160) : null,
                'link' => $this->path($item['link'] ?? null, $warnings),
                'link_label' => is_string($item['link_label'] ?? null) ? Str::limit($item['link_label'], 40) : null,
                'when' => $this->when($item['when'] ?? null),
            ], fn ($v) => $v !== null);
        }

        return $clean;
    }

    /** @return array<string, string>|null */
    private function when(mixed $when): ?array
    {
        if (! is_array($when) || $when === [] || array_is_list($when)) {
            return null;
        }

        $clean = [];
        foreach ($when as $key => $value) {
            if (is_string($key) && is_scalar($value)) {
                $clean[$key] = (string) $value;
            }
        }

        return $clean ?: null;
    }

    private function tone(mixed $tone): string
    {
        return in_array($tone, self::TONES, true) ? $tone : 'neutral';
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
