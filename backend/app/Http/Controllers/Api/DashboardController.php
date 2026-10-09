<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSummaryCache;
use App\Models\YapinetApp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @deprecated Dipakai frontend lama saja; frontend Fase 2 memakai
 * GET /api/menu + GET /api/apps/{slug}. Hapus setelah frontend baru live.
 */
class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $apps = YapinetApp::visibleTo($request->user())->ordered()->with('summaries.unit')->get();

        $cards = $apps->flatMap(fn (YapinetApp $app) => $app->summaries->map(fn (AppSummaryCache $cache) => [
            'app_code' => $app->code,
            'app_name' => $app->name,
            'app_icon_url' => $app->icon_url,
            'unit' => $cache->unit?->only(['id', 'name']),
            'status' => $cache->isStale() ? 'degraded' : $cache->status,
            'headline' => $cache->headline,
            'metrics' => $cache->metrics ?? [],
            'details' => $cache->details ?? [],
            'fetched_at' => $cache->fetched_at,
            'can_act' => false,
        ]));

        return response()->json(['cards' => $cards->values()]);
    }
}
