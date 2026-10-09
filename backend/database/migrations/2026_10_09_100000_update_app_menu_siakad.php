<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Rapikan menu dashboard: Simonik, Simoy, e-SPP, Arsip Digital, Sekolah,
     * dan Front Office disembunyikan (is_active = false, data tidak dihapus),
     * dan SIAKAD ditambahkan menggantikan posisi e-SPP.
     *
     * Sengaja memakai DB::table (bukan model) karena kolom tabel apps diubah
     * di migrasi 2026_10_10_* — model sudah mengikuti skema baru.
     */
    private const HIDDEN = ['SMNK', 'SMOY', 'ESPP', 'ARSD', 'SKLH', 'FRNT'];

    public function up(): void
    {
        DB::table('apps')->whereIn('code', self::HIDDEN)->update(['is_active' => false]);

        $values = [
            'name' => 'SIAKAD',
            'icon_url' => null,
            'base_url' => 'https://siakad.yapinet.id',
            'public_url' => 'https://siakad.yapinet.id',
            'summary_endpoint' => '/api/integrations/yapinet/summary',
            'sso_endpoint' => null,
            'cache_ttl_seconds' => 600,
            'is_active' => true,
            'updated_at' => now(),
        ];

        $appId = DB::table('apps')->where('code', 'SIAK')->value('id');

        if ($appId) {
            DB::table('apps')->where('id', $appId)->update($values);
        } else {
            $appId = (string) Str::uuid();
            DB::table('apps')->insert(['id' => $appId, 'code' => 'SIAK', 'created_at' => now()] + $values);
        }

        if (! DB::table('app_credentials')->where('app_id', $appId)->exists()) {
            DB::table('app_credentials')->insert([
                'id' => (string) Str::uuid(),
                'app_id' => $appId,
                'api_key_encrypted' => Crypt::encryptString(Str::random(40)),
                'sso_signing_key_encrypted' => Crypt::encryptString(Str::random(40)),
                'rotated_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('apps')->whereIn('code', self::HIDDEN)->update(['is_active' => true]);
        DB::table('apps')->where('code', 'SIAK')->update(['is_active' => false]);
    }
};
