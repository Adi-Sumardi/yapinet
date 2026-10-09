<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserAccessRequest;
use App\Models\User;
use App\Models\UserAppAccess;
use App\Models\YapinetApp;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/** Hak akses User per menu: dicentang = boleh melihat. Admin selalu melihat semua. */
class UserAccessController extends Controller
{
    public function show(User $user): JsonResponse
    {
        $granted = $user->appAccess()->pluck('app_id')->all();

        return response()->json(['data' => [
            'is_admin' => $user->isAdmin(),
            'apps' => YapinetApp::ordered()->get(['id', 'slug', 'name', 'is_active', 'icon_type', 'icon_text', 'icon_url', 'color'])
                ->map(fn (YapinetApp $app) => [
                    'id' => $app->id,
                    'slug' => $app->slug,
                    'name' => $app->name,
                    'is_active' => $app->is_active,
                    'icon' => ['type' => $app->icon_type->value, 'text' => $app->icon_text, 'url' => $app->icon_url],
                    'color' => $app->color,
                    'granted' => in_array($app->id, $granted, true),
                ]),
        ]]);
    }

    public function update(UpdateUserAccessRequest $request, User $user, AuditLogger $audit): JsonResponse
    {
        $appIds = $request->validated('app_ids');

        DB::transaction(function () use ($user, $appIds, $request) {
            $user->appAccess()->where('scope_key', 'all')->whereNotIn('app_id', $appIds)->delete();

            foreach ($appIds as $appId) {
                UserAppAccess::firstOrCreate(
                    ['user_id' => $user->id, 'app_id' => $appId, 'scope_key' => 'all'],
                    ['granted_by' => $request->user()->id, 'granted_at' => now()]
                );
            }
        });

        $audit->log($request->user(), 'admin.access_updated', metadata: ['user_id' => $user->id, 'app_ids' => $appIds]);

        return $this->show($user);
    }
}
