<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('apps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code')->unique(); // SNGR, SMYA, SMNK, SMOY, SHRS, SMNS, ...
            $table->string('name');
            $table->string('icon_url')->nullable();
            $table->string('base_url');
            $table->string('summary_endpoint');
            $table->string('sso_endpoint')->nullable();
            $table->unsignedInteger('cache_ttl_seconds')->default(600);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('apps');
    }
};
