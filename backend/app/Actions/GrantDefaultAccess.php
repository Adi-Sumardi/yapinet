<?php

namespace App\Actions;

use App\Models\User;
use App\Models\UserAppAccess;
use App\Models\YapinetApp;

/**
 * Memberi user baru akses ke semua menu aktif — dijalankan SEKALI saat user
 * dibuat admin, bukan di setiap login. Dulu grant ini diulang tiap login
 * sehingga akses yang dicabut admin muncul lagi (lihat rules/overview.md).
 */
class GrantDefaultAccess
{
    public function __invoke(User $user, ?User $grantedBy = null): void
    {
        foreach (YapinetApp::where('is_active', true)->get() as $app) {
            // yayasan_role/can_act masih wajib di skema lama; kolom ini
            // dihapus di Fase 1 (role cuma Admin & User).
            UserAppAccess::firstOrCreate(
                ['user_id' => $user->id, 'app_id' => $app->id, 'unit_id' => null],
                [
                    'yayasan_role' => 'bph',
                    'can_act' => true,
                    'granted_by' => $grantedBy?->id,
                    'granted_at' => now(),
                ]
            );
        }
    }
}
