<?php

namespace App\Providers;

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
    }
}
