<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSummaryCache;
use App\Models\UserAppAccess;
use App\Models\YapinetApp;
use App\Services\AppAdapterResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Dashboard hanya membaca app_summary_cache (diisi berkala oleh
 * RefreshAppSummaries) — tidak pernah fan-out live ke API aplikasi anak
 * saat halaman dibuka, karena shared hosting tidak cocok untuk itu (Bab 04).
 */
class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $access = UserAppAccess::with('app', 'unit')
            ->where('user_id', $request->user()->id)
            ->get();

        $cards = $access->flatMap(function (UserAppAccess $grant) {
            $cacheQuery = AppSummaryCache::with('unit')->where('app_id', $grant->app_id);

            // unit_id null pada hak akses berarti boleh melihat semua unit (Pembina/Pengawas).
            if ($grant->unit_id !== null) {
                $cacheQuery->where('unit_id', $grant->unit_id);
            }

            return $cacheQuery->get()->map(fn (AppSummaryCache $cache) => [
                'app_code' => $grant->app->code,
                'app_name' => $grant->app->name,
                'app_icon_url' => $grant->app->icon_url,
                'unit' => $cache->unit?->only(['id', 'name']),
                'status' => $cache->isStale() ? 'degraded' : $cache->status,
                'headline' => $cache->headline,
                'metrics' => $cache->metrics,
                'fetched_at' => $cache->fetched_at,
                'can_act' => $grant->can_act,
            ]);
        });

        return response()->json(['cards' => $cards->values()]);
    }

    public function refresh(Request $request, string $code, AppAdapterResolver $resolver): JsonResponse
    {
        $app = YapinetApp::where('code', $code)->where('is_active', true)->firstOrFail();

        $hasAccess = UserAppAccess::where('user_id', $request->user()->id)
            ->where('app_id', $app->id)
            ->exists();

        if (! $hasAccess) {
            return response()->json(['message' => 'Tidak punya akses ke aplikasi ini.'], 403);
        }

        $fetcher = $resolver->resolve($app);
        $result = $fetcher->fetch($app, null);

        $cache = AppSummaryCache::updateOrCreate(
            ['app_id' => $app->id, 'unit_id' => null],
            [
                'status' => $result->status,
                'headline' => $result->headline,
                'metrics' => $result->metrics,
                'fetched_at' => now(),
                'expires_at' => now()->addSeconds($app->cache_ttl_seconds),
            ]
        );

        return response()->json(['card' => $cache]);
    }
}
