<?php

namespace Database\Seeders;

use App\Models\AppCredential;
use App\Models\Unit;
use App\Models\YapinetApp;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seed enam aplikasi unit dari blueprint Yapinet. base_url/summary_endpoint
 * di sini adalah placeholder — ganti lewat panel admin (App Registry, FR-07)
 * begitu kontrak integrasi tiap aplikasi anak dikonfirmasi.
 */
class AppRegistrySeeder extends Seeder
{
    public function run(): void
    {
        $apps = [
            ['code' => 'SNGR', 'name' => 'Sianggar', 'desc' => 'Manajemen anggaran unit: pengajuan, LPJ, geser anggaran, surat internal'],
            ['code' => 'SMYA', 'name' => 'Simaya', 'desc' => 'Manajemen aset Yayasan'],
            ['code' => 'SMNK', 'name' => 'Simonik', 'desc' => 'Pencatatan meeting & follow up meeting'],
            ['code' => 'SMOY', 'name' => 'Simoy', 'desc' => 'Peminjaman/pemakaian mobil Yayasan oleh unit'],
            ['code' => 'SHRS', 'name' => 'SiHaris', 'desc' => 'HR: absensi, penggajian, cuti, dan lainnya'],
            ['code' => 'SMNS', 'name' => 'Simonas', 'desc' => 'Monitoring kegiatan mahasiswa yang tinggal di asrama'],
        ];

        foreach ($apps as $definition) {
            $slug = Str::lower($definition['code']);

            $app = YapinetApp::updateOrCreate(
                ['code' => $definition['code']],
                [
                    'name' => $definition['name'],
                    'icon_url' => null,
                    'base_url' => "https://{$slug}.yapinet.id",
                    'summary_endpoint' => '/integrations/yapinet/summary',
                    'sso_endpoint' => '/integrations/yapinet/sso/consume',
                    'cache_ttl_seconds' => 600,
                    'is_active' => true,
                ]
            );

            AppCredential::updateOrCreate(
                ['app_id' => $app->id],
                [
                    'api_key_encrypted' => Str::random(40),
                    'sso_signing_key_encrypted' => Str::random(40),
                    'rotated_at' => now(),
                ]
            );
        }

        Unit::updateOrCreate(
            ['name' => 'Kantor Yayasan'],
            ['type' => 'kantor_yayasan', 'is_active' => true]
        );
    }
}
