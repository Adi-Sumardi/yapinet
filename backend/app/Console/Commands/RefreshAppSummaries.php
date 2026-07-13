<?php

namespace App\Console\Commands;

use App\Models\AppSummaryCache;
use App\Models\Unit;
use App\Models\YapinetApp;
use App\Services\AppAdapterResolver;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * Prefetches ringkasan per aplikasi ke tabel app_summary_cache. Dijalankan
 * lewat Laravel Scheduler (dipicu Cron Job hPanel tiap menit) karena shared
 * hosting tidak mengizinkan proses fan-out langsung saat dashboard dibuka —
 * lihat Bab 04 "Alur Dashboard & Redirect Detail" di blueprint Yapinet.
 */
#[Signature('app:refresh-app-summaries {code? : Kode aplikasi tunggal, mis. SNGR — dipakai untuk tombol "tarik untuk refresh"}')]
#[Description('Ambil ringkasan dari API aplikasi anak dan simpan ke cache table')]
class RefreshAppSummaries extends Command
{
    public function handle(AppAdapterResolver $resolver): int
    {
        $apps = YapinetApp::query()
            ->where('is_active', true)
            ->when($this->argument('code'), fn ($query, $code) => $query->where('code', $code))
            ->get();

        if ($apps->isEmpty()) {
            $this->warn('Tidak ada aplikasi aktif yang cocok untuk di-refresh.');

            return self::SUCCESS;
        }

        $units = Unit::where('is_active', true)->get();
        $scopes = $units->isEmpty() ? [null] : $units->all();

        foreach ($apps as $app) {
            $fetcher = $resolver->resolve($app);

            foreach ($scopes as $unit) {
                $result = $fetcher->fetch($app, $unit);

                AppSummaryCache::updateOrCreate(
                    ['app_id' => $app->id, 'unit_id' => $unit?->id],
                    [
                        'status' => $result->status,
                        'headline' => $result->headline,
                        'metrics' => $result->metrics,
                        'fetched_at' => now(),
                        'expires_at' => now()->addSeconds($app->cache_ttl_seconds),
                    ]
                );

                $label = $unit ? "{$app->code} / {$unit->name}" : $app->code;
                $this->line("  {$label}: {$result->status}");
            }
        }

        $this->info("Selesai me-refresh {$apps->count()} aplikasi.");

        return self::SUCCESS;
    }
}
