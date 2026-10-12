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

    /** v1.2: cara menggambar angka kunci. */
    public const METRIC_DISPLAYS = ['ring', 'gauge'];

    /** v1.2: ikon kalimat Sorotan (dipetakan ke ikon Yapinet). */
    public const INSIGHT_ICONS = ['trend-up', 'trend-down', 'filter', 'building', 'clock', 'people', 'money', 'check', 'alert', 'star'];

    // v1.1 mengirim varian per nilai filter (`when`), jadi batasnya lebih longgar.
    private const MAX_METRICS = 240;

    private const MAX_SECTIONS = 200;

    private const MAX_ATTENTION = 120;

    private const MAX_FILTERS = 4;

    private const MAX_FILTER_OPTIONS = 60;

    private const MAX_ITEMS = 200;

    private const MAX_HERO = 80;

    private const MAX_INSIGHTS = 120;

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
            hero: $this->hero($data['hero'] ?? [], $warnings),
            insights: $this->insights($data['insights'] ?? [], $warnings),
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
                'display' => in_array($metric['display'] ?? null, self::METRIC_DISPLAYS, true) && $progress !== null ? $metric['display'] : null,
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

    /**
     * Angka utama di panel atas — v1.2. Boleh satu objek atau daftar varian
     * per filter (`when`); disimpan selalu sebagai daftar.
     */
    private function hero(mixed $hero, array &$warnings): array
    {
        if ($hero === [] || $hero === null) {
            return [];
        }
        $items = is_array($hero) && ! array_is_list($hero) ? [$hero] : $hero;
        if (! is_array($items)) {
            $warnings[] = 'Field "hero" harus objek atau daftar objek.';

            return [];
        }

        $clean = [];
        foreach (array_slice($items, 0, self::MAX_HERO) as $i => $item) {
            if (! is_array($item) || ! is_scalar($item['value'] ?? null) || ! is_string($item['label'] ?? null)) {
                $warnings[] = "hero[{$i}] butuh \"value\" (angka/teks) dan \"label\" (teks).";

                continue;
            }
            $format = $item['format'] ?? null;
            $side = is_array($item['side'] ?? null) ? array_values(array_filter($item['side'], 'is_string')) : [];

            $clean[] = array_filter([
                'value' => $item['value'],
                'format' => in_array($format, self::FORMATS, true) ? $format : null,
                'label' => Str::limit($item['label'], 60),
                'story' => is_string($item['story'] ?? null) ? Str::limit($item['story'], 200) : null,
                'side' => $side !== [] ? array_map(fn ($s) => Str::limit($s, 40), array_slice($side, 0, 3)) : null,
                'when' => $this->when($item['when'] ?? null),
            ], fn ($v) => $v !== null);
        }

        return $clean;
    }

    /** Kalimat "Sorotan" — v1.2. `**tebal**` di teks ditampilkan tebal. */
    private function insights(mixed $items, array &$warnings): array
    {
        if (! is_array($items) || ! array_is_list($items)) {
            $warnings[] = 'Field "insights" harus berupa daftar (array).';

            return [];
        }

        $clean = [];
        foreach (array_slice($items, 0, self::MAX_INSIGHTS) as $i => $item) {
            if (! is_array($item) || ! is_string($item['text'] ?? null) || trim($item['text']) === '') {
                $warnings[] = "insights[{$i}] butuh \"text\" (teks).";

                continue;
            }

            $clean[] = array_filter([
                'text' => Str::limit($item['text'], 220),
                'tone' => $this->tone($item['tone'] ?? null),
                'icon' => in_array($item['icon'] ?? null, self::INSIGHT_ICONS, true) ? $item['icon'] : null,
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
