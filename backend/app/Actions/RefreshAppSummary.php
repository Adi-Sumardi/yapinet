<?php

namespace App\Actions;

use App\DTO\FetchOutcome;
use App\Models\AppSummaryCache;
use App\Models\YapinetApp;
use App\Services\AppSummaryFetcher;

/**
 * Ambil ringkasan satu menu, simpan ke app_summary_cache, dan catat hasil cek
 * terakhir di apps.last_check_*.
 *
 * Diambil SEKALI per aplikasi (scope "all"): dulu diulang per unit Yapinet
 * dengan mengirim UUID unit yang tidak dikenal aplikasi anak, sehingga
 * hasilnya identik. Sejak kontrak v1.1 pemilihan unit dilakukan lewat
 * `filters` yang disediakan aplikasi itu sendiri (rules/detail-pages.md).
 */
class RefreshAppSummary
{
    public function __construct(private AppSummaryFetcher $fetcher) {}

    public function __invoke(YapinetApp $app): FetchOutcome
    {
        $outcome = $this->fetcher->fetch($app);
        $result = $outcome->result;

        AppSummaryCache::updateOrCreate(
            ['app_id' => $app->id, 'scope_key' => 'all'],
            [
                'unit_id' => null,
                'status' => $result->status,
                'headline' => $result->headline,
                'metrics' => $result->metrics,
                'details' => $result->details,
                'sections' => $result->sections,
                'filters' => $result->filters,
                'attention' => $result->attention,
                'contract_version' => $result->contractVersion,
                'error_message' => $result->errorMessage,
                'fetched_at' => now(),
                'expires_at' => null,
            ]
        );

        // Sisa cache per unit dari skema lama.
        AppSummaryCache::where('app_id', $app->id)->where('scope_key', '!=', 'all')->delete();

        $app->forceFill([
            'last_checked_at' => now(),
            'last_check_ok' => $outcome->ok,
            'last_check_message' => $outcome->ok ? null : $result->errorMessage,
        ])->saveQuietly();

        return $outcome;
    }
}
