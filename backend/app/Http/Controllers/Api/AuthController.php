<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserAppAccess;
use App\Services\AuditLogger;
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

    public function callback(GoogleAccountResolver $resolver, AuditLogger $audit): RedirectResponse
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Throwable) {
            return redirect()->away("{$frontendUrl}/login?error=google_failed");
        }

        $user = $resolver->resolve($googleUser);

        if (is_string($user)) {
            $audit->log(null, 'auth.login_rejected', metadata: ['email' => $googleUser->getEmail(), 'reason' => $user]);

            return redirect()->away("{$frontendUrl}/login?error={$user}");
        }

        $audit->log($user, 'auth.login', metadata: ['via' => 'google']);

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

    public function logout(Request $request, AuditLogger $audit): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        $audit->log($request->user(), 'auth.logout');

        return response()->json(['message' => 'Logged out.']);
    }
}
