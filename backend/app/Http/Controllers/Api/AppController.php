<?php

namespace App\Http\Controllers\Api;

use App\Actions\OpenApp;
use App\Actions\RefreshAppSummary;
use App\Http\Controllers\Controller;
use App\Http\Resources\AppDetailResource;
use App\Models\YapinetApp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Halaman detail menu untuk user. {app} boleh slug atau kode — kode dipakai
 * frontend lama (/apps/SNGR/...) sampai frontend Fase 2 live.
 */
class AppController extends Controller
{
    public function show(Request $request, string $app): AppDetailResource
    {
        return new AppDetailResource($this->resolve($request, $app)->load('summaries.unit'));
    }

    public function refresh(Request $request, string $app, RefreshAppSummary $refresh): AppDetailResource
    {
        $model = $this->resolve($request, $app);
        abort_unless($model->hasSummary(), 422, 'Menu ini tidak punya integrasi ringkasan.');

        $refresh($model);

        return new AppDetailResource($model->load('summaries.unit'));
    }

    public function open(Request $request, string $app, OpenApp $openApp): JsonResponse
    {
        return response()->json(['data' => $openApp($this->resolve($request, $app), $request->user(), $request->query('path'))]);
    }

    /** @deprecated frontend lama membaca redirect_url di level atas. */
    public function legacyHandoff(Request $request, string $app, OpenApp $openApp): JsonResponse
    {
        return response()->json($openApp($this->resolve($request, $app), $request->user(), $request->query('path')));
    }

    private function resolve(Request $request, string $slugOrCode): YapinetApp
    {
        return YapinetApp::visibleTo($request->user())->identifiedBy($slugOrCode)->firstOrFail();
    }
}
