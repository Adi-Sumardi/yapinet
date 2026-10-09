<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Menu dinamis (rules/system-features.md F5): tampilan, tujuan, dan
     * integrasi tiap menu sekarang disimpan di tabel apps — sebelumnya
     * tersebar di frontend (appSlugs.ts, appIcons.ts, CUSTOM_DETAIL) dan
     * DashboardController::$order. Nilai lama itu dipindahkan ke sini.
     */
    private const LEGACY = [
        // code => [slug, inisial, warna, deskripsi, urutan, layout detail]
        'SNGR' => ['sianggar', 'SG', '#3E7CB1', 'Aplikasi Pengajuan Anggaran', 1, 'sianggar'],
        'SMYA' => ['simaya', 'SM', '#4CAF7D', 'Aplikasi Sistem Manajemen Aset YAPI', 2, 'simaya'],
        'SMNK' => ['simonik', 'MK', '#2FA8B0', 'Aplikasi Sistem Manajemen Meeting, Notulensi, dan Follow up', 3, 'simonik'],
        'SMNS' => ['simonas', 'SN', '#9C5FC0', 'Aplikasi Sistem Monitoring Warga Asrama', 4, 'simonas'],
        'SHRS' => ['siharis', 'HR', '#1C1C1E', 'Aplikasi Sistem Manajemen Kepegawaian YAPI', 5, 'auto'],
        'SMOY' => ['simoy', 'SY', '#5C6BC0', 'Aplikasi Sistem Manajemen Peminjaman Mobil YAPI', 6, 'auto'],
        'SIAK' => ['siakad', 'SA', '#E0A527', 'Aplikasi Sistem Informasi Akademik', 7, 'auto'],
        'ESPP' => ['espp', 'SP', '#E0A527', 'Aplikasi Sistem Manajemen Pembayaran SPP Murid', 8, 'auto'],
        'PMB' => ['pmb', 'PM', '#1F6FA6', 'Aplikasi Sistem Manajemen Penerimaan Murid Baru', 9, 'auto'],
        'ARSD' => ['arsip-digital', 'AD', '#6D4E9C', 'Aplikasi Sistem Manajemen Arsip Digital', 10, 'auto'],
        'SKLH' => ['sekolah', 'SK', '#D9534F', 'Aplikasi Sistem Manajemen Sekolah', 11, 'auto'],
        'FRNT' => ['front-office', 'FO', '#2E8B57', 'Aplikasi Sistem Manajemen Front Office', 12, 'auto'],
    ];

    public function up(): void
    {
        Schema::table('apps', function (Blueprint $table) {
            $table->string('slug', 50)->nullable()->after('code');
            $table->string('description')->nullable()->after('name');
            $table->string('icon_type', 20)->default('initials')->after('description');
            $table->string('icon_text', 3)->nullable()->after('icon_type');
            $table->string('color', 7)->default('#2E6DA4')->after('icon_url');
            $table->unsignedInteger('sort_order')->default(0)->index()->after('color');
            $table->string('open_url')->nullable();
            $table->string('open_mode', 20)->default('link');
            $table->string('sso_path')->nullable();
            $table->string('summary_url')->nullable();
            $table->string('auth_type', 20)->default('none');
            $table->string('auth_header', 100)->nullable();
            $table->unsignedSmallInteger('refresh_minutes')->nullable();
            $table->string('detail_layout', 30)->default('auto');
            $table->boolean('grant_to_all')->default(true);
            $table->timestamp('last_checked_at')->nullable();
            $table->boolean('last_check_ok')->nullable();
            $table->string('last_check_message')->nullable();
            $table->softDeletes();
            $table->index('is_active');
        });

        foreach (DB::table('apps')->get() as $app) {
            [$slug, $initials, $color, $description, $order, $layout] = self::LEGACY[$app->code]
                ?? [Str::slug($app->name), Str::upper(Str::substr($app->code, 0, 2)), '#2E6DA4', null, 100, 'auto'];

            $ttl = (int) $app->cache_ttl_seconds;

            DB::table('apps')->where('id', $app->id)->update([
                'slug' => $slug,
                'description' => $description,
                'icon_type' => $app->icon_url ? 'image' : 'initials',
                'icon_text' => $initials,
                'color' => $color,
                'sort_order' => $order,
                'open_url' => $app->public_url ?: $app->base_url,
                'open_mode' => $app->sso_endpoint ? 'handoff' : 'link',
                'sso_path' => $app->sso_endpoint,
                'summary_url' => rtrim($app->base_url, '/').'/'.ltrim($app->summary_endpoint, '/'),
                // Semua aplikasi lama memakai Bearer API key dari app_credentials.
                'auth_type' => 'bearer',
                // 600 dtk adalah default lama → biarkan ikut pengaturan global.
                'refresh_minutes' => $ttl && $ttl !== 600 ? max(1, intdiv($ttl, 60)) : null,
                'detail_layout' => $layout,
            ]);
        }

        Schema::table('apps', function (Blueprint $table) {
            $table->string('slug', 50)->nullable(false)->change();
            $table->string('open_url')->nullable(false)->change();
            $table->unique('slug');
            $table->dropColumn(['base_url', 'public_url', 'summary_endpoint', 'sso_endpoint', 'cache_ttl_seconds']);
        });
    }

    public function down(): void
    {
        Schema::table('apps', function (Blueprint $table) {
            $table->string('base_url')->nullable();
            $table->string('public_url')->nullable();
            $table->string('summary_endpoint')->nullable();
            $table->string('sso_endpoint')->nullable();
            $table->unsignedInteger('cache_ttl_seconds')->default(600);
        });

        foreach (DB::table('apps')->get() as $app) {
            $parts = parse_url((string) $app->summary_url);
            $base = isset($parts['host']) ? "{$parts['scheme']}://{$parts['host']}".(isset($parts['port']) ? ":{$parts['port']}" : '') : $app->open_url;

            DB::table('apps')->where('id', $app->id)->update([
                'base_url' => $base,
                'public_url' => $app->open_url,
                'summary_endpoint' => $parts['path'] ?? '/api/integrations/yapinet/summary',
                'sso_endpoint' => $app->sso_path,
                'cache_ttl_seconds' => ($app->refresh_minutes ?? 10) * 60,
            ]);
        }

        Schema::table('apps', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropIndex(['sort_order']);
            $table->dropIndex(['is_active']);
            $table->dropSoftDeletes();
            $table->dropColumn([
                'slug', 'description', 'icon_type', 'icon_text', 'color', 'sort_order', 'open_url', 'open_mode',
                'sso_path', 'summary_url', 'auth_type', 'auth_header', 'refresh_minutes', 'detail_layout',
                'grant_to_all', 'last_checked_at', 'last_check_ok', 'last_check_message',
            ]);
        });
    }
};
