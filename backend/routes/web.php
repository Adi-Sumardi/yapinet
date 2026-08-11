<?php

use App\Http\Controllers\WebAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Login sesi (guard "web") — dipakai Passport saat browser di-redirect ke
// /oauth/authorize untuk SSO aplikasi anak (lihat WebAuthController).
Route::get('/login', [WebAuthController::class, 'showLoginForm'])->name('login');
Route::post('/login', [WebAuthController::class, 'login'])->name('login.attempt');
Route::post('/logout', [WebAuthController::class, 'logout'])->middleware('auth')->name('logout');
