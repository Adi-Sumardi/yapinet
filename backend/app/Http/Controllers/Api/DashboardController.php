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
            ->whereHas('app', fn ($query) => $query->where('is_active', true))
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
                'details' => $cache->details ?? [],
                'fetched_at' => $cache->fetched_at,
                'can_act' => $grant->can_act,
            ]);
        });

        return response()->json(['cards' => self::sortByMenuOrder($cards)->values()]);
    }

    /**
     * Urutan menu tetap: Sianggar, Simaya, Simonas, SiHaris, SIAKAD, PMB,
     * lalu sisanya — tidak mengandalkan urutan pembuatan UserAppAccess.
     */
    private static function sortByMenuOrder($cards)
    {
        $order = ['SNGR', 'SMYA', 'SMNS', 'SHRS', 'SIAK', 'PMB'];

        return $cards->sortBy(function (array $card) use ($order) {
            $index = array_search($card['app_code'], $order, true);

            return $index === false ? count($order) : $index;
        });
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
                'details' => $result->details,
                'fetched_at' => now(),
                'expires_at' => now()->addSeconds($app->cache_ttl_seconds),
            ]
        );

        return response()->json(['card' => $cache]);
    }
}
