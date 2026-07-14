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
        // base_url = dipakai untuk panggilan API server-to-server (summary
        // fetch) — untuk 4 aplikasi anak aktif nilainya bisa dioverride lewat
        // env (mis. `SNGR_BASE_URL`) supaya development lokal bisa memanggil
        // dev server-nya sendiri tanpa mengubah file ini (lihat .env.example).
        // public_url = link asli yang dibuka pengguna lewat tombol "Buka
        // Aplikasi" — SELALU domain produksi asli, tidak pernah ikut
        // dioverride ke localhost, supaya klik "Buka Aplikasi" tetap benar
        // walau base_url sedang diarahkan ke dev server lokal untuk testing.
        $apps = [
            ['code' => 'SNGR', 'name' => 'Sianggar', 'desc' => 'Manajemen anggaran unit: pengajuan, LPJ, geser anggaran, surat internal', 'public_url' => 'https://sianggar.yapinet.id', 'base_url' => env('SNGR_BASE_URL', 'https://sianggar.yapinet.id')],
            ['code' => 'SMYA', 'name' => 'Simaya', 'desc' => 'Manajemen aset Yayasan', 'public_url' => 'https://simaya.yapi.web.id', 'base_url' => env('SMYA_BASE_URL', 'https://simaya.yapi.web.id')],
            ['code' => 'SMNK', 'name' => 'Simonik', 'desc' => 'Pencatatan meeting & follow up meeting', 'public_url' => 'https://simonik.yapinet.id', 'base_url' => env('SMNK_BASE_URL', 'https://simonik.yapinet.id')],
            ['code' => 'SMOY', 'name' => 'Simoy', 'desc' => 'Peminjaman/pemakaian mobil Yayasan oleh unit'],
            ['code' => 'SHRS', 'name' => 'SiHaris', 'desc' => 'HR: absensi, penggajian, cuti, dan lainnya'],
            ['code' => 'SMNS', 'name' => 'Simonas', 'desc' => 'Monitoring kegiatan mahasiswa yang tinggal di asrama', 'public_url' => 'https://simonas.id', 'base_url' => env('SMNS_BASE_URL', 'https://simonas.id')],
            ['code' => 'ESPP', 'name' => 'e-SPP', 'desc' => 'Sistem pembayaran SPP digital'],
            ['code' => 'PMB', 'name' => 'PMB', 'desc' => 'Penerimaan murid/mahasiswa baru'],
            ['code' => 'ARSD', 'name' => 'Arsip Digital', 'desc' => 'Manajemen dokumen dan arsip Yayasan'],
            ['code' => 'SKLH', 'name' => 'Sekolah', 'desc' => 'Data dan profil sekolah'],
            ['code' => 'FRNT', 'name' => 'Front Office', 'desc' => 'Layanan front office / resepsionis unit'],
        ];

        foreach ($apps as $definition) {
            $slug = Str::lower($definition['code']);

            $app = YapinetApp::updateOrCreate(
                ['code' => $definition['code']],
                [
                    'name' => $definition['name'],
                    'icon_url' => null,
                    'base_url' => $definition['base_url'] ?? "https://{$slug}.yapinet.id",
                    'public_url' => $definition['public_url'] ?? null,
                    'summary_endpoint' => '/api/integrations/yapinet/summary',
                    // Belum ada aplikasi anak yang benar-benar mengimplementasikan
                    // endpoint SSO consume ini — semuanya baru punya endpoint
                    // summary. Biarkan null supaya HandoffController::issue()
                    // jatuh ke fallback tautan biasa (redirect ke base_url apa
                    // adanya, user login sendiri di aplikasi anak) alih-alih
                    // membentuk URL SSO yang pasti 404. Isi lagi begitu ada
                    // aplikasi anak yang benar-benar mengimplementasikan
                    // /integrations/yapinet/sso/consume miliknya sendiri.
                    'sso_endpoint' => null,
                    'cache_ttl_seconds' => 600,
                    'is_active' => true,
                ]
            );

            // firstOrCreate, bukan updateOrCreate — jangan timpa api_key_encrypted yang
            // sudah diselaraskan manual dengan YAPINET_API_KEY aplikasi anak (lihat
            // memory yapinet_techstack: kredensial diatur lewat tinker, bukan re-seed).
            AppCredential::firstOrCreate(
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
