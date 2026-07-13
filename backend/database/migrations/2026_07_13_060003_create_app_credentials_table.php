<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_credentials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('app_id')->unique()->constrained('apps')->cascadeOnDelete();
            $table->text('api_key_encrypted');
            $table->text('sso_signing_key_encrypted')->nullable();
            $table->timestamp('rotated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_credentials');
    }
};
