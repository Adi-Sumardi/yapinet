<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Secret menu dipisah dari tabel apps supaya tidak ikut terserialisasi.
 * Jangan pernah mengirim nilainya ke frontend — pakai hint() saja.
 */
class AppCredential extends Model
{
    use HasUuids;

    protected $fillable = ['app_id', 'api_key', 'sso_signing_key', 'rotated_at'];

    protected $hidden = ['api_key', 'sso_signing_key'];

    protected function casts(): array
    {
        return [
            'rotated_at' => 'datetime',
            'api_key' => 'encrypted',
            'sso_signing_key' => 'encrypted',
        ];
    }

    /** 4 karakter terakhir API key untuk ditampilkan di panel admin. */
    public function hint(): ?string
    {
        return $this->api_key ? substr($this->api_key, -4) : null;
    }

    public function app(): BelongsTo
    {
        return $this->belongsTo(YapinetApp::class, 'app_id');
    }
}
