<?php

namespace Tests\Feature;

use App\Models\AppSummaryCache;
use App\Models\User;
use App\Models\UserAppAccess;
use App\Models\YapinetApp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MenuTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Migrasi SIAKAD mengisi satu menu; kosongkan supaya tiap test terkontrol.
        YapinetApp::query()->forceDelete();
    }

    private function grant(User $user, YapinetApp $app): void
    {
        UserAppAccess::create(['user_id' => $user->id, 'app_id' => $app->id]);
    }

    public function test_user_sees_only_granted_active_menus_in_order_without_cache(): void
    {
        $user = User::factory()->create();
        $second = YapinetApp::factory()->create(['sort_order' => 2, 'name' => 'Kedua']);
        $first = YapinetApp::factory()->create(['sort_order' => 1, 'name' => 'Pertama']);
        $inactive = YapinetApp::factory()->inactive()->create();
        YapinetApp::factory()->create(); // tidak diberi akses

        foreach ([$first, $second, $inactive] as $app) {
            $this->grant($user, $app);
        }

        $this->actingAs($user)->getJson('/api/menu')
            ->assertOk()
            ->assertJsonPath('data.*.name', ['Pertama', 'Kedua'])
            ->assertJsonPath('data.0.icon.text', $first->icon_text)
            ->assertJsonPath('meta.welcome_title', 'Selamat Datang di Dashboard Yapinet');
    }

    public function test_admin_sees_all_active_menus_without_grants(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        YapinetApp::factory()->count(3)->create();
        YapinetApp::factory()->inactive()->create();

        $this->actingAs($admin)->getJson('/api/menu')->assertOk()->assertJsonCount(3, 'data');
    }

    public function test_menu_reports_worst_summary_status(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $app = YapinetApp::factory()->create();
        AppSummaryCache::create(['app_id' => $app->id, 'status' => 'warning', 'fetched_at' => now()]);

        $this->actingAs($admin)->getJson('/api/menu')->assertJsonPath('data.0.summary_status', 'warning');
    }

    public function test_detail_is_forbidden_without_access_and_accepts_slug_or_code(): void
    {
        $user = User::factory()->create();
        $app = YapinetApp::factory()->create(['slug' => 'siakad', 'code' => 'SIAK']);

        $this->actingAs($user)->getJson('/api/apps/siakad')->assertNotFound();

        $this->grant($user, $app);

        $this->actingAs($user)->getJson('/api/apps/siakad')->assertOk()->assertJsonPath('data.slug', 'siakad');
        $this->actingAs($user)->getJson('/api/apps/SIAK')->assertOk();
    }

    public function test_open_builds_url_and_rejects_external_paths(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        YapinetApp::factory()->create(['slug' => 'siakad', 'open_url' => 'https://siakad.yapinet.id/']);

        $this->actingAs($admin)->getJson('/api/apps/siakad/open?path=/nilai')
            ->assertJsonPath('data.redirect_url', 'https://siakad.yapinet.id/nilai');

        $this->actingAs($admin)->getJson('/api/apps/siakad/open?path=//evil.com')
            ->assertJsonPath('data.redirect_url', 'https://siakad.yapinet.id');

        $this->assertDatabaseHas('audit_log', ['action' => 'app.opened']);
    }

    public function test_handoff_mode_issues_ticket(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        YapinetApp::factory()->create(['slug' => 'sso', 'open_mode' => 'handoff', 'sso_path' => '/sso/consume']);

        $url = $this->actingAs($admin)->getJson('/api/apps/sso/open')->json('data.redirect_url');

        $this->assertStringContainsString('/sso/consume?ticket=', $url);
        $this->assertDatabaseCount('handoff_tickets', 1);
    }
}
