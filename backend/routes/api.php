<?php

use App\Http\Controllers\Api\Admin\AppConnectionTestController;
use App\Http\Controllers\Api\Admin\AppController as AdminAppController;
use App\Http\Controllers\Api\Admin\AuditLogController;
use App\Http\Controllers\Api\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Api\Admin\UploadController;
use App\Http\Controllers\Api\Admin\UserAccessController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\AppController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HandoffController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\OAuthUserController;
use App\Http\Controllers\Api\SettingController;
use Illuminate\Support\Facades\Route;

// ── Publik ───────────────────────────────────────────────────────────────────
Route::get('/settings/public', [SettingController::class, 'public']);

Route::middleware('throttle:google-auth')->group(function () {
    Route::get('/auth/google/redirect', [AuthController::class, 'redirect']);
    Route::get('/auth/google/callback', [AuthController::class, 'callback']);
});

// Dipanggil server-to-server oleh aplikasi anak yang sudah SSO lewat OAuth2
// Passport (bukan lewat middleware auth:api — lihat OAuthUserController).
Route::get('/oauth/user', [OAuthUserController::class, 'show']);

// Dipanggil server-to-server oleh aplikasi anak, diamankan via api_key (bukan Sanctum).
Route::post('/integrations/handoff/verify', [HandoffController::class, 'verify']);

// ── User login ───────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/menu', [MenuController::class, 'index']);
    Route::get('/apps/{app}', [AppController::class, 'show']);
    Route::post('/apps/{app}/refresh', [AppController::class, 'refresh'])->middleware('throttle:app-refresh');
    Route::get('/apps/{app}/open', [AppController::class, 'open']);

    // ── Admin ────────────────────────────────────────────────────────────────
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::post('/apps/reorder', [AdminAppController::class, 'reorder']);
        Route::post('/apps/test-connection', AppConnectionTestController::class)->middleware('throttle:connection-test');
        Route::post('/apps/{app}/refresh', [AdminAppController::class, 'refresh']);
        Route::apiResource('apps', AdminAppController::class);

        Route::get('/users/{user}/access', [UserAccessController::class, 'show']);
        Route::put('/users/{user}/access', [UserAccessController::class, 'update']);
        Route::apiResource('users', UserController::class);

        Route::get('/settings', [AdminSettingController::class, 'index']);
        Route::put('/settings', [AdminSettingController::class, 'update']);
        Route::delete('/settings/{key}', [AdminSettingController::class, 'destroy']);

        Route::get('/audit-logs', [AuditLogController::class, 'index']);
        Route::post('/uploads/image', [UploadController::class, 'image']);
    });
});
