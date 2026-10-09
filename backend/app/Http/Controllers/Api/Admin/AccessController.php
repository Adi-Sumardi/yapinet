<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserAppAccess;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @deprecated Endpoint akses per baris untuk AccessManager lama. Frontend
 * Fase 2 memakai GET/PUT /api/admin/users/{user}/access. Peran per menu &
 * can_act sudah dihapus — field itu diabaikan bila masih dikirim.
 */
class AccessController extends Controller
{
    public function grants(Request $request): JsonResponse
    {
        $request->validate(['user_id' => 'required|uuid']);

        $grants = UserAppAccess::with('app:id,code,name')
            ->where('user_id', $request->string('user_id'))
            ->get(['id', 'user_id', 'app_id']);

        return response()->json($grants);
    }

    public function grant(Request $request, AuditLogger $audit): JsonResponse
    {
        $data = $request->validate([
            'user_id' => 'required|uuid|exists:users,id',
            'app_id' => 'required|uuid|exists:apps,id',
        ]);

        $grant = UserAppAccess::firstOrCreate(
            ['user_id' => $data['user_id'], 'app_id' => $data['app_id'], 'scope_key' => 'all'],
            ['granted_by' => $request->user()->id, 'granted_at' => now()]
        );

        $audit->log($request->user(), 'admin.access_updated', metadata: ['user_id' => $data['user_id'], 'granted' => $data['app_id']]);

        return response()->json($grant->load('app:id,code,name'));
    }

    public function revoke(Request $request, UserAppAccess $userAppAccess, AuditLogger $audit): JsonResponse
    {
        $userAppAccess->delete();
        $audit->log($request->user(), 'admin.access_updated', metadata: ['user_id' => $userAppAccess->user_id, 'revoked' => $userAppAccess->app_id]);

        return response()->json(['message' => 'Akses dicabut.']);
    }
}
