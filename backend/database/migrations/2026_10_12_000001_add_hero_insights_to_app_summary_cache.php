<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Kontrak ringkasan v1.2 (rules/detail-pages.md): angka utama "hero" dan
     * kalimat "Sorotan" yang dikirim aplikasi anak.
     */
    public function up(): void
    {
        Schema::table('app_summary_cache', function (Blueprint $table) {
            if (! Schema::hasColumn('app_summary_cache', 'hero')) {
                $table->json('hero')->nullable()->after('attention');
            }
            if (! Schema::hasColumn('app_summary_cache', 'insights')) {
                $table->json('insights')->nullable()->after('hero');
            }
        });
    }

    public function down(): void
    {
        Schema::table('app_summary_cache', function (Blueprint $table) {
            $table->dropColumn(['hero', 'insights']);
        });
    }
};
