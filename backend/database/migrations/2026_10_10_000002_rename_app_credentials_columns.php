<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Akhiran _encrypted menyesatkan — enkripsi dilakukan cast `encrypted` di
     * model, bukan oleh kolomnya. api_key dibuat nullable karena menu dengan
     * auth_type = none tidak butuh key.
     */
    public function up(): void
    {
        Schema::table('app_credentials', function (Blueprint $table) {
            $table->renameColumn('api_key_encrypted', 'api_key');
            $table->renameColumn('sso_signing_key_encrypted', 'sso_signing_key');
        });

        Schema::table('app_credentials', function (Blueprint $table) {
            $table->text('api_key')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('app_credentials', function (Blueprint $table) {
            $table->renameColumn('api_key', 'api_key_encrypted');
            $table->renameColumn('sso_signing_key', 'sso_signing_key_encrypted');
        });
    }
};
