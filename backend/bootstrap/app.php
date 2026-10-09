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
        // Cron Job hPanel memanggil `php artisan schedule:run` tiap menit; command
        // sendiri yang memutuskan menu mana yang sudah jatuh tempo (refresh_minutes).
        $schedule->command(RefreshAppSummaries::class)
            ->everyMinute()
            ->withoutOverlapping()
            ->onOneServer();

        $schedule->command('sanctum:prune-expired --hours=24')->daily();
    })
    ->create();
