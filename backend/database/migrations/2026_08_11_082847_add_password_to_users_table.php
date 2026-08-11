<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable()->after('primary_email');
            $table->boolean('must_change_password')->default(false)->after('password');
        });

        // Login Google dihapus (lihat AuthController) — user lama belum
        // punya password sendiri, jadi diberi password default dan wajib
        // ganti di login pertama mereka setelah migrasi ini.
        DB::table('users')->whereNull('password')->update([
            'password' => Hash::make(config('yapinet.default_password')),
            'must_change_password' => true,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['password', 'must_change_password']);
        });
    }
};
