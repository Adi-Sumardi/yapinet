<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MenuItemResource;
use App\Models\YapinetApp;
use App\Services\SettingsService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Menu dashboard. Sengaja tidak bergantung pada app_summary_cache: menu
 * yang belum pernah di-fetch tetap tampil (dulu tidak muncul sama sekali).
 */
class MenuController extends Controller
{
    public function index(Request $request, SettingsService $settings): AnonymousResourceCollection
    {
        $apps = YapinetApp::visibleTo($request->user())->ordered()->with('summaries')->get();

        return MenuItemResource::collection($apps)->additional(['meta' => [
            'welcome_title' => $settings->get('dashboard.welcome_title'),
            'welcome_subtitle' => $settings->get('dashboard.welcome_subtitle'),
            'show_status_badge' => $settings->get('dashboard.show_status_badge'),
            'announcement' => $settings->get('announcement.enabled') ? [
                'text' => $settings->get('announcement.text'),
                'level' => $settings->get('announcement.level'),
            ] : null,
        ]]);
    }
}
