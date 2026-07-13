<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_summary_cache', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('app_id')->constrained('apps')->cascadeOnDelete();
            $table->foreignUuid('unit_id')->nullable()->constrained('units')->cascadeOnDelete();
            $table->enum('status', ['ok', 'warning', 'critical', 'degraded'])->default('degraded');
            $table->string('headline')->nullable();
            $table->json('metrics')->nullable();
            $table->timestamp('fetched_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->unique(['app_id', 'unit_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_summary_cache');
    }
};
