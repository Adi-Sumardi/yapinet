<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Sisa era login password (Agustus 2026) dan tabel notifikasi yang tidak
     * pernah dipakai — login sekarang hanya lewat Google (rules/database.md).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['password', 'must_change_password']);
        });

        Schema::dropIfExists('notifications');
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable()->after('primary_email');
            $table->boolean('must_change_password')->default(false)->after('password');
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('app_id')->nullable()->constrained('apps')->nullOnDelete();
            $table->string('title');
            $table->text('body')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }
};
