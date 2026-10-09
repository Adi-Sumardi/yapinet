<?php

use App\Models\AppCredential;
use App\Models\YapinetApp;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Rapikan menu dashboard: Simonik, Simoy, e-SPP, Arsip Digital, Sekolah,
     * dan Front Office disembunyikan (is_active = false, data tidak dihapus),
     * dan SIAKAD ditambahkan menggantikan posisi e-SPP.
     */
    private const HIDDEN = ['SMNK', 'SMOY', 'ESPP', 'ARSD', 'SKLH', 'FRNT'];

    public function up(): void
    {
        YapinetApp::whereIn('code', self::HIDDEN)->update(['is_active' => false]);

        $siakad = YapinetApp::updateOrCreate(
            ['code' => 'SIAK'],
            [
                'name' => 'SIAKAD',
                'icon_url' => null,
                'base_url' => 'https://siakad.yapinet.id',
                'public_url' => 'https://siakad.yapinet.id',
                'summary_endpoint' => '/api/integrations/yapinet/summary',
                'sso_endpoint' => null,
                'cache_ttl_seconds' => 600,
                'is_active' => true,
            ]
        );

        AppCredential::firstOrCreate(
            ['app_id' => $siakad->id],
            [
                'api_key_encrypted' => Str::random(40),
                'sso_signing_key_encrypted' => Str::random(40),
                'rotated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        YapinetApp::whereIn('code', self::HIDDEN)->update(['is_active' => true]);
        YapinetApp::where('code', 'SIAK')->update(['is_active' => false]);
    }
};
