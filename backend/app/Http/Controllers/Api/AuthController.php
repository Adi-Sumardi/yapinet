<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\GoogleIdentity;
use App\Models\User;
use App\Models\UserAppAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Laravel\Socialite\Facades\Socialite;

/**
 * Login tanpa akun/password Yapinet sendiri — identitas diverifikasi lewat
 * Google, lalu dipetakan ke user internal via google_identities (FR-01/FR-02).
 */
class AuthController extends Controller
{
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')
            ->stateless()
            ->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        $googleUser = Socialite::driver('google')->stateless()->user();

        $identity = GoogleIdentity::with('user')->where('google_sub', $googleUser->getId())->first();

        $user = DB::transaction(function () use ($identity, $googleUser) {
            if ($identity) {
                $identity->update([
                    'email' => $googleUser->getEmail(),
                    'avatar_url' => $googleUser->getAvatar(),
                ]);

                return $identity->user;
            }

            // Belum pernah login — buat user berstatus pending, admin yang
            // akan memberi hak akses aplikasi lewat user_app_access (FR-08).
            $user = User::create([
                'full_name' => $googleUser->getName() ?? $googleUser->getEmail(),
                'primary_email' => $googleUser->getEmail(),
                'status' => 'pending',
            ]);

            GoogleIdentity::create([
                'user_id' => $user->id,
                'google_sub' => $googleUser->getId(),
                'email' => $googleUser->getEmail(),
                'avatar_url' => $googleUser->getAvatar(),
                'linked_at' => now(),
            ]);

            return $user;
        });

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'login',
            'metadata' => ['via' => 'google'],
        ]);

        $token = $user->createToken('yapinet-pwa')->plainTextToken;

        $frontendUrl = rtrim(config('app.frontend_url'), '/');

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
