<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Log aktivitas harus tetap ada walau penggunanya dihapus admin —
     * sebelumnya cascadeOnDelete ikut menghapus riwayatnya.
     */
    public function up(): void
    {
        Schema::table('audit_log', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('audit_log', function (Blueprint $table) {
            $table->uuid('user_id')->nullable()->change();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->index(['action', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('audit_log', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropIndex(['action', 'created_at']);
        });

        Schema::table('audit_log', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
