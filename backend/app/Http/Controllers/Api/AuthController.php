<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\UserAppAccess;
use App\Models\YapinetApp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Login pakai email + password Yapinet sendiri (menggantikan login Google —
 * lihat migration add_password_to_users_table).
 */
class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('primary_email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'Email atau password salah.',
            ]);
        }

        abort_if($user->status === 'suspended', 403, 'Akun Anda dinonaktifkan. Hubungi Admin Yayasan.');

        // Pastikan user punya akses ke setiap aplikasi aktif — dijalankan
        // tiap login supaya aplikasi baru yang ditambahkan ke App Registry
        // otomatis ikut muncul buat user lama juga di login berikutnya.
        foreach (YapinetApp::where('is_active', true)->get() as $app) {
            UserAppAccess::firstOrCreate(
                ['user_id' => $user->id, 'app_id' => $app->id, 'unit_id' => null],
                ['yayasan_role' => 'bph', 'can_act' => true]
            );
        }

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'login',
            'metadata' => ['via' => 'password'],
        ]);

        $token = $user->createToken('yapinet-pwa')->plainTextToken;

        return response()->json([
            'token' => $token,
            'must_change_password' => $user->must_change_password,
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => 'Password lama salah.',
            ]);
        }

        $user->update([
            'password' => $data['new_password'],
            'must_change_password' => false,
        ]);

        return response()->json(['message' => 'Password berhasil diganti.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        $access = UserAppAccess::with('app', 'unit')
            ->where('user_id', $user->id)
            ->get();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'primary_email' => $user->primary_email,
                'status' => $user->status,
                'is_admin' => $user->is_admin,
                'must_change_password' => $user->must_change_password,
            ],
            'app_access' => $access,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }
}
