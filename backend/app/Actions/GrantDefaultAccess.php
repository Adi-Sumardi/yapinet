<?php

namespace App\Actions;

use App\Models\User;
use App\Models\UserAppAccess;
use App\Models\YapinetApp;
use App\Services\SettingsService;

/**
 * Memberi user baru akses ke menu aktif yang ditandai "berikan ke semua"
 * (apps.grant_to_all) — SEKALI saat user dibuat admin, bukan di setiap
 * login, supaya akses yang dicabut admin tetap tercabut.
 */
class GrantDefaultAccess
{
    public function __construct(private SettingsService $settings) {}

    public function __invoke(User $user, ?User $grantedBy = null): void
    {
        if (! $this->settings->get('access.auto_grant_new_users')) {
            return;
        }

        foreach (YapinetApp::active()->where('grant_to_all', true)->get() as $app) {
            UserAppAccess::firstOrCreate(
                ['user_id' => $user->id, 'app_id' => $app->id, 'scope_key' => 'all'],
                ['granted_by' => $grantedBy?->id, 'granted_at' => now()]
            );
        }
    }
}
