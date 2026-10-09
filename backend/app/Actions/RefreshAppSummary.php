<?php

namespace App\Actions;

use App\DTO\FetchOutcome;
use App\Models\AppSummaryCache;
use App\Models\Unit;
use App\Models\YapinetApp;
use App\Services\AppSummaryFetcher;

/**
 * Ambil ringkasan satu menu untuk setiap unit aktif, simpan ke
 * app_summary_cache, dan catat hasil cek terakhir di apps.last_check_*.
 */
class RefreshAppSummary
{
    public function __construct(private AppSummaryFetcher $fetcher) {}

    /** @return FetchOutcome hasil untuk scope pertama (cukup untuk UI) */
    public function __invoke(YapinetApp $app): FetchOutcome
    {
        $units = Unit::where('is_active', true)->get();
        $scopes = $units->isEmpty() ? [null] : $units->all();
        $first = null;

        foreach ($scopes as $unit) {
            $outcome = $this->fetcher->fetch($app, $unit);
            $first ??= $outcome;
            $result = $outcome->result;

            AppSummaryCache::updateOrCreate(
                ['app_id' => $app->id, 'scope_key' => $unit?->id ?? 'all'],
                [
                    'unit_id' => $unit?->id,
                    'status' => $result->status,
                    'headline' => $result->headline,
                    'metrics' => $result->metrics,
                    'details' => $result->details,
                    'sections' => $result->sections,
                    'contract_version' => $result->contractVersion,
                    'error_message' => $result->errorMessage,
                    'fetched_at' => now(),
                    'expires_at' => null,
                ]
            );
        }

        $app->forceFill([
            'last_checked_at' => now(),
            'last_check_ok' => $first->ok,
            'last_check_message' => $first->ok ? null : $first->result->errorMessage,
        ])->saveQuietly();

        return $first;
    }
}
