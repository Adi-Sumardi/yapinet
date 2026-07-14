<?php

use App\Console\Commands\RefreshAppSummaries;
use App\Http\Middleware\EnsureIsAdmin;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['admin' => EnsureIsAdmin::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })
    ->withSchedule(function (Schedule $schedule): void {
        // Cron Job hPanel hanya perlu memanggil `php artisan schedule:run` tiap menit;
        // interval sebenarnya (tiap aplikasi punya cache_ttl_seconds sendiri) ditentukan
        // di sini, bukan di cron — lihat Bab 04/05 blueprint Yapinet.
        $schedule->command(RefreshAppSummaries::class)
            ->everyFiveMinutes()
            ->withoutOverlapping()
            ->onOneServer();
    })
    ->create();
