<?php

namespace App\Services\Adapters;

use App\Contracts\SummaryFetcher;
use App\DTO\SummaryResult;
use App\Models\Unit;
use App\Models\YapinetApp;
use Carbon\CarbonImmutable;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

/**
 * Default adapter used by every app that follows the standard contract
 * (GET {summary_endpoint} → {status, headline, metrics[], updated_at,
 * detail_path}). Kept deliberately generic; a child app with quirks gets
 * its own class extending this one (see AppAdapterResolver) instead of
 * branching logic here.
 */
class GenericHttpSummaryFetcher implements SummaryFetcher
{
    /** Short timeout so one slow child app cannot stall the refresh job (NFR-01/NFR-03). */
    protected float $timeoutSeconds = 5.0;

    public function fetch(YapinetApp $app, ?Unit $unit): SummaryResult
    {
        $credential = $app->credential;

        if (! $credential) {
            return SummaryResult::degraded('Kredensial API belum dikonfigurasi.');
        }

        try {
            $client = $this->client();

            $response = $client->get(rtrim($app->base_url, '/').'/'.ltrim($app->summary_endpoint, '/'), [
                'headers' => [
                    'Authorization' => 'Bearer '.$credential->api_key_encrypted,
                    'Accept' => 'application/json',
                ],
                'query' => $unit ? ['unit_id' => $unit->getKey()] : [],
                'timeout' => $this->timeoutSeconds,
            ]);

            $data = json_decode((string) $response->getBody(), true) ?? [];

            return new SummaryResult(
                status: $data['status'] ?? 'degraded',
                headline: $data['headline'] ?? null,
                metrics: $data['metrics'] ?? [],
                details: $data['details'] ?? [],
                updatedAt: isset($data['updated_at']) ? CarbonImmutable::parse($data['updated_at']) : null,
                detailPath: $data['detail_path'] ?? null,
            );
        } catch (GuzzleException $e) {
            Log::warning("Gagal mengambil ringkasan aplikasi [{$app->code}]: {$e->getMessage()}");

            return SummaryResult::degraded('Tidak dapat memuat data dari aplikasi ini saat ini.');
        }
    }

    protected function client(): Client
    {
        return new Client;
    }
}
