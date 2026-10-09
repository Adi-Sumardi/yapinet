<?php

namespace App\Http\Controllers;

use App\Services\GoogleAccountResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;

/**
 * Login berbasis sesi Laravel (guard "web"), terpisah dari login PWA
 * (Sanctum token, lihat Api\AuthController). Cuma dipakai sebagai gerbang
 * /oauth/authorize milik Passport — browser yang di-redirect ke sana untuk
 * SSO aplikasi anak butuh sesi guard "web", bukan Bearer token di header.
 * Sama seperti PWA, masuknya lewat Google dan hanya untuk email terdaftar.
 */
class WebAuthController extends Controller
{
    private const ERRORS = [
        GoogleAccountResolver::NOT_REGISTERED => 'Email Google ini belum terdaftar. Hubungi Admin Yayasan.',
        GoogleAccountResolver::SUSPENDED => 'Akun Anda dinonaktifkan. Hubungi Admin Yayasan.',
    ];

    public function showLoginForm(): View
    {
        return view('auth.login');
    }

    public function redirectToGoogle(): SymfonyRedirectResponse
    {
        return Socialite::driver('google')
            ->redirectUrl(route('login.google.callback'))
            ->redirect();
    }

    public function handleGoogleCallback(Request $request, GoogleAccountResolver $resolver): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')
                ->redirectUrl(route('login.google.callback'))
                ->user();
        } catch (\Throwable) {
            return redirect()->route('login')->withErrors(['google' => 'Gagal masuk dengan Google. Coba lagi.']);
        }

        $user = $resolver->resolve($googleUser);

        if (is_string($user)) {
            return redirect()->route('login')->withErrors(['google' => self::ERRORS[$user]]);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended('/');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
