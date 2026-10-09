<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\UserAppAccess;
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
