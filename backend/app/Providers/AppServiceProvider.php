<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // SSO untuk aplikasi anak (Authorization Code Grant) — lihat
        // OAuthUserController untuk endpoint yang mereka panggil setelah
        // menukar code jadi access token.
        Passport::tokensExpireIn(now()->addHours(6));
        Passport::refreshTokensExpireIn(now()->addDays(30));

        // Halaman consent server-rendered (bukan bagian dari SPA React) —
        // lihat resources/views/oauth/authorize.blade.php & WebAuthController.
        Passport::authorizationView('oauth.authorize');

        // Batas sesuai rules/security.md §6.
        RateLimiter::for('google-auth', fn (Request $request) => Limit::perMinute(20)->by($request->ip()));
        RateLimiter::for('app-refresh', fn (Request $request) => Limit::perMinute(2)
            ->by($request->user()?->id.'|'.$request->route('app')));
        RateLimiter::for('connection-test', fn (Request $request) => Limit::perMinute(10)->by($request->user()?->id));
    }
}
