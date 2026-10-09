<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use App\Models\YapinetApp;

/**
 * Satu pintu menulis audit log. action memakai format domain.kata_kerja
 * (daftar di rules/database.md). Jangan masukkan secret ke $metadata.
 */
class AuditLogger
{
    public function log(?User $actor, string $action, ?YapinetApp $app = null, array $metadata = []): void
    {
        AuditLog::create([
            'user_id' => $actor?->id,
            'action' => $action,
            'app_id' => $app?->id,
            'metadata' => $metadata ?: null,
        ]);
    }
}
