<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('apps', function (Blueprint $table) {
            // URL yang benar-benar dibuka pengguna di browser ("Buka Aplikasi")
            // — dipisah dari `base_url` karena `base_url` dipakai untuk
            // panggilan API server-to-server (summary fetch) dan di lokal
            // sengaja dioverride ke host dev (mis. http://127.0.0.1:8001)
            // lewat env, yang tidak boleh ikut jadi link publik yang dibuka
            // pengguna. Null berarti jatuh ke `base_url` (perilaku lama).
            $table->string('public_url')->nullable()->after('base_url');
        });
    }

    public function down(): void
    {
        Schema::table('apps', function (Blueprint $table) {
            $table->dropColumn('public_url');
        });
    }
};
