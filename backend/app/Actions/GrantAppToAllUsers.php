<?php

namespace App\Actions;

use App\Models\User;
use App\Models\UserAppAccess;
use App\Models\YapinetApp;

/** Dipakai saat menu dibuat/diubah dengan "berikan ke semua pengguna". */
class GrantAppToAllUsers
{
    public function __invoke(YapinetApp $app, ?User $grantedBy = null): int
    {
        $granted = 0;

        User::query()->select('id')->chunkById(200, function ($users) use ($app, $grantedBy, &$granted) {
            foreach ($users as $user) {
                $access = UserAppAccess::firstOrCreate(
                    ['user_id' => $user->id, 'app_id' => $app->id, 'scope_key' => 'all'],
                    ['granted_by' => $grantedBy?->id, 'granted_at' => now()]
                );
                $granted += (int) $access->wasRecentlyCreated;
            }
        });

        return $granted;
    }
}
