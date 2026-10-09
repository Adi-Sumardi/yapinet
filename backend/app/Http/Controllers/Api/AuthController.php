<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\UserAppAccess;
use App\Models\YapinetApp;
use App\Services\GoogleAccountResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;

/**
 * Login PWA lewat Google — hanya untuk email yang sudah didaftarkan admin
 * (lihat GoogleAccountResolver). Hasilnya Sanctum token untuk SPA.
 */
class AuthController extends Controller
{
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')
            ->stateless()
            ->redirect();
    }

    public function callback(GoogleAccountResolver $resolver): RedirectResponse
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Throwable) {
            return redirect()->away("{$frontendUrl}/login?error=google_failed");
        }

        $user = $resolver->resolve($googleUser);

        if (is_string($user)) {
            return redirect()->away("{$frontendUrl}/login?error={$user}");
        }

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
            'metadata' => ['via' => 'google'],
        ]);

        $token = $user->createToken('yapinet-pwa')->plainTextToken;

        return redirect()->away("{$frontendUrl}/auth/callback?token={$token}");
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
