<?php

namespace App\Http\Controllers\Api\Admin;

use App\Actions\GrantDefaultAccess;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserAppAccess;
use App\Models\YapinetApp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Panel "Kelola Hak Akses" di halaman Pengaturan — implementasi FR-08
 * (admin mengatur aplikasi mana yang tampil untuk pengguna tertentu).
 * Dijaga middleware `admin` (lihat App\Http\Middleware\EnsureIsAdmin).
 */
class AccessController extends Controller
{
    public function users(): JsonResponse
    {
        return response()->json(
            User::orderBy('full_name')->get(['id', 'full_name', 'primary_email', 'status', 'is_admin'])
        );
    }

    public function storeUser(Request $request, GrantDefaultAccess $grantDefaultAccess): JsonResponse
    {
        $data = $request->validate([
            'full_name' => 'required|string|max:255',
            'primary_email' => ['required', 'email', Rule::unique('users', 'primary_email')],
        ]);

        $user = User::create([
            'full_name' => $data['full_name'],
            'primary_email' => $data['primary_email'],
            'status' => 'active',
        ]);

        $grantDefaultAccess($user, $request->user());

        return response()->json($user->only(['id', 'full_name', 'primary_email', 'status', 'is_admin']), 201);
    }

    public function destroyUser(Request $request, User $user): JsonResponse
    {
        abort_if($user->is($request->user()), 422, 'Tidak bisa menghapus akun Anda sendiri.');

        DB::transaction(function () use ($user) {
            // Token Sanctum (morph) & token OAuth Passport tidak punya FK
            // cascade ke users — hapus manual supaya sesi user ikut mati.
            $user->tokens()->delete();
            DB::table('oauth_access_tokens')->where('user_id', $user->id)->delete();
            DB::table('oauth_auth_codes')->where('user_id', $user->id)->delete();

            $user->delete();
        });

        return response()->json(['message' => 'Pengguna dihapus.']);
    }

    public function apps(): JsonResponse
    {
        return response()->json(
            YapinetApp::where('is_active', true)->orderBy('name')->get(['id', 'code', 'name'])
        );
    }

    public function grants(Request $request): JsonResponse
    {
        $request->validate(['user_id' => 'required|uuid']);

        $grants = UserAppAccess::with('app:id,code,name')
            ->where('user_id', $request->string('user_id'))
            ->get(['id', 'user_id', 'app_id', 'yayasan_role', 'can_act']);

        return response()->json($grants);
    }

    public function grant(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => 'required|uuid|exists:users,id',
            'app_id' => 'required|uuid|exists:apps,id',
            'yayasan_role' => 'required|in:bph,pembina,pengawas,app_admin',
            'can_act' => 'boolean',
        ]);

        $grant = UserAppAccess::updateOrCreate(
            ['user_id' => $data['user_id'], 'app_id' => $data['app_id'], 'unit_id' => null],
            [
                'yayasan_role' => $data['yayasan_role'],
                'can_act' => $data['can_act'] ?? false,
                'granted_by' => $request->user()->id,
                'granted_at' => now(),
            ]
        );

        return response()->json($grant->load('app:id,code,name'));
    }

    public function revoke(UserAppAccess $userAppAccess): JsonResponse
    {
        $userAppAccess->delete();

        return response()->json(['message' => 'Akses dicabut.']);
    }
}
