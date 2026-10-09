<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Kontrak v1 (rules/api.md): simpan sections[] & versi kontrak, alasan
     * gagal terakhir, dan pakai scope_key (bukan unit_id nullable) untuk unik.
     */
    public function up(): void
    {
        Schema::table('app_summary_cache', function (Blueprint $table) {
            $table->string('scope_key', 36)->default('all')->after('unit_id');
            $table->json('sections')->nullable()->after('details');
            $table->unsignedTinyInteger('contract_version')->default(0)->after('sections');
            $table->string('error_message')->nullable()->after('contract_version');
        });

        DB::table('app_summary_cache')->whereNotNull('unit_id')->update(['scope_key' => DB::raw('unit_id')]);

        $seen = [];
        foreach (DB::table('app_summary_cache')->orderByDesc('fetched_at')->get(['id', 'app_id', 'scope_key']) as $row) {
            $key = "{$row->app_id}|{$row->scope_key}";
            if (isset($seen[$key])) {
                DB::table('app_summary_cache')->where('id', $row->id)->delete();
            }
            $seen[$key] = true;
        }

        Schema::table('app_summary_cache', function (Blueprint $table) {
            $table->dropUnique(['app_id', 'unit_id']);
            $table->unique(['app_id', 'scope_key']);
            // string, bukan enum, supaya status baru tidak butuh ALTER enum.
            $table->string('status', 20)->default('degraded')->change();
        });
    }

    public function down(): void
    {
        Schema::table('app_summary_cache', function (Blueprint $table) {
            $table->dropUnique(['app_id', 'scope_key']);
            $table->unique(['app_id', 'unit_id']);
            $table->dropColumn(['scope_key', 'sections', 'contract_version', 'error_message']);
        });
    }
};
