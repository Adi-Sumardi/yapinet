<?php

use App\Http\Controllers\WebAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Login sesi (guard "web") — dipakai Passport saat browser di-redirect ke
// /oauth/authorize untuk SSO aplikasi anak (lihat WebAuthController).
Route::get('/login', [WebAuthController::class, 'showLoginForm'])->name('login');
Route::get('/login/google', [WebAuthController::class, 'redirectToGoogle'])->name('login.google');
Route::get('/login/google/callback', [WebAuthController::class, 'handleGoogleCallback'])->name('login.google.callback');
Route::post('/logout', [WebAuthController::class, 'logout'])->middleware('auth')->name('logout');
