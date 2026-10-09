<?php

namespace App\Services;

use App\DTO\FetchOutcome;
use App\DTO\SummaryResult;
use App\Enums\AuthType;
use App\Models\Unit;
use App\Models\YapinetApp;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Memanggil URL API ringkasan aplikasi anak (rules/api.md bagian B).
 * Dipakai scheduler (RefreshAppSummaries), tombol Segarkan, dan Tes Koneksi.
 * Pengganti AppAdapterResolver + adapter per aplikasi: semua menu sekarang
 * cukup diatur lewat kolom summary_url/auth_type di tabel apps.
 */
class AppSummaryFetcher
{
    private const MAX_BYTES = 512 * 1024;

    public function __construct(
        private SafeUrlValidator $urlValidator,
        private SummaryContract $contract,
        private SettingsService $settings,
    ) {}

    public function fetch(YapinetApp $app, ?Unit $unit = null): FetchOutcome
    {
        if (! $app->summary_url) {
            return new FetchOutcome(false, null, 0, SummaryResult::degraded('URL API ringkasan belum diisi.'));
        }

        return $this->request(
            url: $app->summary_url,
            authType: $app->auth_type,
            authHeader: $app->auth_header,
            apiKey: $app->credential?->api_key,
            unit: $unit,
            logContext: $app->code,
        );
    }

    public function request(
        string $url,
        AuthType $authType,
        ?string $authHeader,
        ?string $apiKey,
        ?Unit $unit = null,
        ?string $logContext = null,
    ): FetchOutcome {
        $check = $this->urlValidator->check($url);

        if (! $check['ok']) {
            return new FetchOutcome(false, null, 0, SummaryResult::degraded($check['error']));
        }

        if ($authType !== AuthType::None && ! $apiKey) {
            return new FetchOutcome(false, null, 0, SummaryResult::degraded('API key belum diisi.'));
        }

        $headers = match ($authType) {
            AuthType::Bearer => ['Authorization' => "Bearer {$apiKey}"],
            AuthType::Header => [$authHeader ?: 'X-Api-Key' => $apiKey],
            AuthType::None => [],
        };

        $options = ['allow_redirects' => false];
        if ($check['ip']) {
            // Kunci koneksi ke IP yang sudah lolos validasi (cegah DNS rebinding).
            $options['curl'] = [CURLOPT_RESOLVE => ["{$check['host']}:{$check['port']}:{$check['ip']}"]];
        }

        $started = microtime(true);

        try {
            $response = Http::withHeaders($headers)
                ->acceptJson()
                ->timeout((int) $this->settings->get('integration.request_timeout_seconds'))
                ->withOptions($options)
                ->get($url, $unit ? ['unit_id' => $unit->getKey()] : []);
        } catch (ConnectionException $e) {
            Log::warning("Ringkasan [{$logContext}] gagal terhubung: {$e->getMessage()}");

            return new FetchOutcome(false, null, $this->elapsed($started), SummaryResult::degraded('Tidak bisa terhubung ke aplikasi (timeout atau host tidak merespons).'));
        }

        $duration = $this->elapsed($started);
        $status = $response->status();

        if (! $response->successful()) {
            Log::warning("Ringkasan [{$logContext}] HTTP {$status}");

            return new FetchOutcome(false, $status, $duration, SummaryResult::degraded("Aplikasi membalas HTTP {$status}."));
        }

        if (strlen($response->body()) > self::MAX_BYTES) {
            return new FetchOutcome(false, $status, $duration, SummaryResult::degraded('Respons lebih dari 512 KB.'));
        }

        $data = $response->json();

        if (! is_array($data) || array_is_list($data)) {
            return new FetchOutcome(false, $status, $duration, SummaryResult::degraded('Respons bukan objek JSON.'));
        }

        $warnings = [];
        $result = $this->contract->normalize($data, $warnings);

        return new FetchOutcome(true, $status, $duration, $result, $warnings);
    }

    private function elapsed(float $started): int
    {
        return (int) round((microtime(true) - $started) * 1000);
    }
}
