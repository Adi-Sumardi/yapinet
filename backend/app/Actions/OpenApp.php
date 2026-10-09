<?php

namespace App\Actions;

use App\Enums\OpenMode;
use App\Models\HandoffTicket;
use App\Models\User;
use App\Models\YapinetApp;
use App\Services\AuditLogger;
use Illuminate\Support\Str;

/**
 * Menyusun URL tujuan saat user klik "Buka Aplikasi" sesuai open_mode menu.
 * Mengembalikan URL (bukan redirect HTTP) supaya SPA bisa memanggilnya
 * dengan header Authorization lalu pindah halaman sendiri.
 */
class OpenApp
{
    public function __construct(private AuditLogger $audit) {}

    /** @return array{redirect_url: string, open_mode: string} */
    public function __invoke(YapinetApp $app, User $user, ?string $path = null): array
    {
        // Hanya path relatif — cegah open redirect ke host lain.
        $path = $path && str_starts_with($path, '/') && ! str_starts_with($path, '//') ? $path : null;
        $base = rtrim($app->open_url, '/');

        if ($app->open_mode === OpenMode::Handoff && $app->sso_path) {
            $ticket = Str::random(48);

            HandoffTicket::create([
                'user_id' => $user->id,
                'app_id' => $app->id,
                // sha256 (bukan bcrypt) supaya verify() bisa lookup langsung by hash.
                'ticket_hash' => hash('sha256', $ticket),
                'target_path' => $path,
                'expires_at' => now()->addSeconds(60),
            ]);

            $url = $base.'/'.ltrim($app->sso_path, '/').'?ticket='.$ticket;
        } else {
            $url = $base.($path ?? '');
        }

        $this->audit->log($user, 'app.opened', $app, array_filter(['path' => $path]));

        return ['redirect_url' => $url, 'open_mode' => $app->open_mode->value];
    }
}
