<?php

namespace App\Services;

use App\Models\GoogleIdentity;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Laravel\Socialite\Contracts\User as SocialiteUser;

/**
 * Memetakan akun Google ke user Yapinet. Tidak ada pendaftaran otomatis —
 * email Google harus sudah didaftarkan dulu oleh admin (Pengaturan → Kelola
 * Hak Akses → Tambah Pengguna), seperti di logbook.yapinet.id. Dipakai oleh
 * login PWA (Api\AuthController) maupun login sesi SSO (WebAuthController).
 */
class GoogleAccountResolver
{
    public const NOT_REGISTERED = 'not_registered';

    public const SUSPENDED = 'suspended';

    /**
     * @return User|string User yang cocok, atau kode error (NOT_REGISTERED / SUSPENDED).
     */
    public function resolve(SocialiteUser $googleUser): User|string
    {
        $email = strtolower((string) $googleUser->getEmail());

        if ($email === '' || ($googleUser->user['email_verified'] ?? true) === false) {
            return self::NOT_REGISTERED;
        }

        $identity = GoogleIdentity::with('user')->where('google_sub', $googleUser->getId())->first();

        $user = $identity?->user
            ?? User::whereRaw('LOWER(primary_email) = ?', [$email])->first();

        if (! $user) {
            return self::NOT_REGISTERED;
        }

        if ($user->status === 'suspended') {
            return self::SUSPENDED;
        }

        DB::transaction(function () use ($identity, $user, $googleUser) {
            if ($identity) {
                $identity->update([
                    'email' => $googleUser->getEmail(),
                    'avatar_url' => $googleUser->getAvatar(),
                ]);

                return;
            }

            GoogleIdentity::create([
                'user_id' => $user->id,
                'google_sub' => $googleUser->getId(),
                'email' => $googleUser->getEmail(),
                'avatar_url' => $googleUser->getAvatar(),
                'linked_at' => now(),
            ]);
        });

        return $user;
    }
}
