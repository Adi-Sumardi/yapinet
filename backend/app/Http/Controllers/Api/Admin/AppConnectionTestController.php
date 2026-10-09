<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\AuthType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TestConnectionRequest;
use App\Models\YapinetApp;
use App\Services\AppSummaryFetcher;
use Illuminate\Http\JsonResponse;

/**
 * Tombol "Tes Koneksi" di form menu: panggil URL API dari isi form (belum
 * disimpan), kembalikan status, waktu respons, pratinjau, dan peringatan
 * kontrak. API key tidak pernah ikut dikembalikan.
 */
class AppConnectionTestController extends Controller
{
    public function __invoke(TestConnectionRequest $request, AppSummaryFetcher $fetcher): JsonResponse
    {
        $apiKey = $request->validated('api_key');

        if ($apiKey === null && $request->validated('app_id')) {
            $apiKey = YapinetApp::with('credential')->find($request->validated('app_id'))?->credential?->api_key;
        }

        $outcome = $fetcher->request(
            url: $request->validated('summary_url'),
            authType: AuthType::from($request->validated('auth_type')),
            authHeader: $request->validated('auth_header'),
            apiKey: $apiKey,
            logContext: 'tes-koneksi',
        );

        $result = $outcome->result;

        return response()->json(['data' => [
            'ok' => $outcome->ok,
            'http_status' => $outcome->httpStatus,
            'duration_ms' => $outcome->durationMs,
            'message' => $result->errorMessage,
            'warnings' => $outcome->warnings,
            'preview' => $outcome->ok ? [
                'status' => $result->status,
                'headline' => $result->headline,
                'metrics' => $result->metrics,
                'sections' => $result->sections,
                'contract_version' => $result->contractVersion,
            ] : null,
        ]]);
    }
}
