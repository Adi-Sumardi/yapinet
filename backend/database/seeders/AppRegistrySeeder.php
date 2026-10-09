<?php

namespace Database\Seeders;

use App\Models\AppCredential;
use App\Models\Unit;
use App\Models\YapinetApp;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Menu awal untuk instalasi baru / lokal SAJA. Jangan dijalankan di
 * produksi — menu di sana dikelola admin lewat /admin/menu (rules/database.md).
 * Untuk development lokal, summary_url bisa diarahkan ke dev server aplikasi
 * anak lewat env (mis. SNGR_SUMMARY_URL=http://127.0.0.1:8001/api/...).
 */
class AppRegistrySeeder extends Seeder
{
    private const SUMMARY_PATH = '/api/integrations/yapinet/summary';

    public function run(): void
    {
        $apps = [
            ['SNGR', 'sianggar', 'Sianggar', 'SG', '#3E7CB1', 'Aplikasi Pengajuan Anggaran', 'https://sianggar.yapinet.id', true, 'sianggar'],
            ['SMYA', 'simaya', 'Simaya', 'SM', '#4CAF7D', 'Aplikasi Sistem Manajemen Aset YAPI', 'https://simaya.yapinet.id', true, 'simaya'],
            ['SMNS', 'simonas', 'Simonas', 'SN', '#9C5FC0', 'Aplikasi Sistem Monitoring Warga Asrama', 'https://simonas.id', true, 'simonas'],
            ['SHRS', 'siharis', 'SiHaris', 'HR', '#1C1C1E', 'Aplikasi Sistem Manajemen Kepegawaian YAPI', 'https://shrs.yapinet.id', true, 'auto'],
            ['SIAK', 'siakad', 'SIAKAD', 'SA', '#E0A527', 'Aplikasi Sistem Informasi Akademik', 'https://siakad.yapinet.id', true, 'auto'],
            ['PMB', 'pmb', 'PMB', 'PM', '#1F6FA6', 'Aplikasi Sistem Manajemen Penerimaan Murid Baru', 'https://pmb.yapinet.id', true, 'auto'],
            ['SMNK', 'simonik', 'Simonik', 'MK', '#2FA8B0', 'Aplikasi Sistem Manajemen Meeting, Notulensi, dan Follow up', 'https://simonik.yapinet.id', false, 'simonik'],
        ];

        foreach ($apps as $order => [$code, $slug, $name, $initials, $color, $description, $url, $active, $layout]) {
            $app = YapinetApp::updateOrCreate(['code' => $code], [
                'slug' => $slug,
                'name' => $name,
                'description' => $description,
                'icon_type' => 'initials',
                'icon_text' => $initials,
                'color' => $color,
                'sort_order' => $order + 1,
                'is_active' => $active,
                'open_url' => $url,
                'open_mode' => 'link',
                'summary_url' => config("yapinet.dev_summary_urls.{$code}", $url.self::SUMMARY_PATH),
                'auth_type' => 'bearer',
                'detail_layout' => $layout,
                'grant_to_all' => true,
            ]);

            // firstOrCreate — jangan timpa API key yang sudah diselaraskan
            // dengan YAPINET_API_KEY di aplikasi anak.
            AppCredential::firstOrCreate(['app_id' => $app->id], [
                'api_key' => Str::random(40),
                'sso_signing_key' => Str::random(40),
                'rotated_at' => now(),
            ]);
        }

        Unit::updateOrCreate(['name' => 'Kantor Yayasan'], ['type' => 'kantor_yayasan', 'is_active' => true]);
    }
}
