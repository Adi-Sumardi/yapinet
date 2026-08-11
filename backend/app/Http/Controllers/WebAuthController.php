<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;

/**
 * Login berbasis sesi Laravel (guard "web"), terpisah dari login PWA
 * (Sanctum token, lihat Api\AuthController). Cuma dipakai sebagai gerbang
 * /oauth/authorize milik Passport — browser yang di-redirect ke sana untuk
 * SSO aplikasi anak butuh sesi guard "web", bukan Bearer token di header.
 */
class WebAuthController extends Controller
{
    public function showLoginForm(): View
    {
        return view('auth.login');
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('primary_email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password) || $user->status === 'suspended') {
            return back()->withErrors(['email' => 'Email atau password salah.'])->onlyInput('email');
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
