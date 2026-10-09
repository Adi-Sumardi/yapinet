<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    /** Pengaturan bertanda public — dipakai halaman login & branding sebelum login. */
    public function public(SettingsService $settings): JsonResponse
    {
        return response()->json(['data' => $settings->public()]);
    }
}
