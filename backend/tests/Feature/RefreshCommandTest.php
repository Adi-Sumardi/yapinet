<?php

namespace Tests\Feature;

use App\Models\YapinetApp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RefreshCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_due_menus_with_summary_url_are_refreshed(): void
    {
        YapinetApp::query()->forceDelete();
        Http::fake(['*' => Http::response(['status' => 'ok'])]);

        $due = YapinetApp::factory()->create(['last_checked_at' => now()->subMinutes(30), 'refresh_minutes' => 10]);
        $fresh = YapinetApp::factory()->create(['last_checked_at' => now()->subMinutes(2), 'refresh_minutes' => 10]);
        $linkOnly = YapinetApp::factory()->linkOnly()->create();

        $this->artisan('app:refresh-app-summaries')->assertSuccessful();

        $this->assertSame(1, $due->summaries()->count());
        $this->assertSame(0, $fresh->summaries()->count());
        $this->assertSame(0, $linkOnly->summaries()->count());

        $this->artisan('app:refresh-app-summaries --force')->assertSuccessful();
        $this->assertSame(1, $fresh->summaries()->count());
    }
}
