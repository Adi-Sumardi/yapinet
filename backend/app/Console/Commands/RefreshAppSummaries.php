<?php

namespace App\Console\Commands;

use App\Actions\RefreshAppSummary;
use App\Models\YapinetApp;
use App\Services\SettingsService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * Prefetch ringkasan ke app_summary_cache. Dijalankan scheduler tiap menit
 * (Cron hPanel), tapi tiap menu hanya di-refresh bila sudah jatuh tempo
 * sesuai refresh_minutes-nya (atau pengaturan integration.default_refresh_minutes).
 * Shared hosting tidak mengizinkan fan-out live saat dashboard dibuka.
 */
#[Signature('app:refresh-app-summaries {app? : Slug atau kode satu menu} {--force : Abaikan jadwal, refresh sekarang}')]
#[Description('Ambil ringkasan dari API aplikasi anak dan simpan ke cache table')]
class RefreshAppSummaries extends Command
{
    public function handle(RefreshAppSummary $refresh, SettingsService $settings): int
    {
        $defaultMinutes = (int) $settings->get('integration.default_refresh_minutes');

        $apps = YapinetApp::active()
            ->whereNotNull('summary_url')
            ->where('detail_layout', '!=', 'link_only')
            ->when($this->argument('app'), fn ($query, $app) => $query->identifiedBy($app))
            ->ordered()
            ->get();

        $done = 0;

        foreach ($apps as $app) {
            $minutes = $app->refresh_minutes ?? $defaultMinutes;
            $due = $this->option('force')
                || $this->argument('app')
                || $app->last_checked_at === null
                || $app->last_checked_at->lte(now()->subMinutes($minutes));

            if (! $due) {
                continue;
            }

            $outcome = $refresh($app);
            $this->line("  {$app->slug}: ".($outcome->ok ? $outcome->result->status : 'gagal — '.$outcome->result->errorMessage));
            $done++;
        }

        $this->info("Selesai me-refresh {$done} menu.");

        return self::SUCCESS;
    }
}
