<?php

use App\Http\Controllers\Api\Admin\AccessController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\HandoffController;
use App\Http\Controllers\Api\OAuthUserController;
use Illuminate\Support\Facades\Route;

Route::get('/auth/google/redirect', [AuthController::class, 'redirect']);
Route::get('/auth/google/callback', [AuthController::class, 'callback']);

// Dipanggil server-to-server oleh aplikasi anak yang sudah SSO lewat OAuth2
// Passport (bukan lewat middleware auth:api — lihat OAuthUserController).
Route::get('/oauth/user', [OAuthUserController::class, 'show']);

// Dipanggil server-to-server oleh aplikasi anak, diamankan via api_key (bukan Sanctum).
Route::post('/integrations/handoff/verify', [HandoffController::class, 'verify']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::post('/apps/{code}/refresh', [DashboardController::class, 'refresh']);
    Route::get('/apps/{code}/handoff', [HandoffController::class, 'issue']);

    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/users', [AccessController::class, 'users']);
        Route::post('/users', [AccessController::class, 'storeUser']);
        Route::get('/apps', [AccessController::class, 'apps']);
        Route::get('/access', [AccessController::class, 'grants']);
        Route::post('/access', [AccessController::class, 'grant']);
        Route::delete('/access/{userAppAccess}', [AccessController::class, 'revoke']);
    });
});
