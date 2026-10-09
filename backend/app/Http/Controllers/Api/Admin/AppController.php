<?php

namespace App\Http\Controllers\Api\Admin;

use App\Actions\RefreshAppSummary;
use App\Actions\SaveApp;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderAppsRequest;
use App\Http\Requests\Admin\SaveAppRequest;
use App\Http\Resources\Admin\AppResource;
use App\Models\YapinetApp;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

/** CRUD menu dashboard (rules/system-features.md F5). */
class AppController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return AppResource::collection(YapinetApp::ordered()->with('credential')->withCount('accessGrants')->get());
    }

    public function store(SaveAppRequest $request, SaveApp $saveApp): JsonResponse
    {
        $app = $saveApp($request->validated(), $request->user());

        return (new AppResource($app))->response()->setStatusCode(201);
    }

    public function show(YapinetApp $app): AppResource
    {
        return new AppResource($app->load('credential')->loadCount('accessGrants'));
    }

    public function update(SaveAppRequest $request, YapinetApp $app, SaveApp $saveApp): AppResource
    {
        return new AppResource($saveApp($request->validated(), $request->user(), $app));
    }

    /** Soft delete — slug & kode tetap dipesan supaya link lama tidak bentrok. */
    public function destroy(Request $request, YapinetApp $app, AuditLogger $audit): Response
    {
        $app->delete();
        $audit->log($request->user(), 'admin.app_deleted', $app);

        return response()->noContent();
    }

    public function reorder(ReorderAppsRequest $request, AuditLogger $audit): Response
    {
        DB::transaction(function () use ($request) {
            foreach ($request->validated('ids') as $index => $id) {
                YapinetApp::whereKey($id)->update(['sort_order' => $index + 1]);
            }
        });

        $audit->log($request->user(), 'admin.apps_reordered');

        return response()->noContent();
    }

    public function refresh(YapinetApp $app, RefreshAppSummary $refresh): JsonResponse
    {
        abort_unless($app->summary_url, 422, 'URL API ringkasan belum diisi.');

        $outcome = $refresh($app);

        return response()->json(['data' => [
            'ok' => $outcome->ok,
            'message' => $outcome->result->errorMessage,
            'app' => new AppResource($app->load('credential')),
        ]]);
    }
}
