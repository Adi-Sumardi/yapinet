<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Role Yapinet tinggal Admin & User (users.is_admin) — peran per menu
     * (yayasan_role) dan can_act dihapus; satu baris = user boleh melihat
     * menu itu. unique(user_id, app_id, unit_id) diganti scope_key non-null
     * karena di MySQL NULL tidak dianggap sama sehingga duplikat lolos.
     */
    public function up(): void
    {
        Schema::table('user_app_access', function (Blueprint $table) {
            $table->string('scope_key', 36)->default('all')->after('unit_id');
        });

        DB::table('user_app_access')->whereNotNull('unit_id')->update(['scope_key' => DB::raw('unit_id')]);

        // Buang duplikat yang sempat lolos lewat unit_id NULL — sisakan yang tertua.
        $seen = [];
        foreach (DB::table('user_app_access')->orderBy('created_at')->get(['id', 'user_id', 'app_id', 'scope_key']) as $row) {
            $key = "{$row->user_id}|{$row->app_id}|{$row->scope_key}";
            if (isset($seen[$key])) {
                DB::table('user_app_access')->where('id', $row->id)->delete();
            }
            $seen[$key] = true;
        }

        Schema::table('user_app_access', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'app_id', 'unit_id']);
            $table->unique(['user_id', 'app_id', 'scope_key']);
        });

        Schema::table('user_app_access', function (Blueprint $table) {
            $table->dropColumn(['yayasan_role', 'can_act']);
        });
    }

    public function down(): void
    {
        Schema::table('user_app_access', function (Blueprint $table) {
            $table->enum('yayasan_role', ['bph', 'pembina', 'pengawas', 'app_admin'])->default('pembina');
            $table->boolean('can_act')->default(false);
        });

        Schema::table('user_app_access', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'app_id', 'scope_key']);
            $table->unique(['user_id', 'app_id', 'unit_id']);
            $table->dropColumn('scope_key');
        });
    }
};
