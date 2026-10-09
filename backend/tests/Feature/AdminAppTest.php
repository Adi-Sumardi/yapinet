<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\YapinetApp;
use App\Services\SafeUrlValidator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AdminAppTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        YapinetApp::query()->forceDelete();
        $this->admin = User::factory()->create(['is_admin' => true]);
        // DNS palsu: semua host dianggap publik kecuali yang namanya "internal".
        $this->app->instance(SafeUrlValidator::class, new SafeUrlValidator(
            fn (string $host) => str_contains($host, 'internal') ? ['10.0.0.5'] : ['93.184.216.34']
        ));
    }

    private function payload(array $override = []): array
    {
        return $override + [
            'name' => 'SIAKAD',
            'slug' => 'siakad',
            'icon_type' => 'initials',
            'icon_text' => 'SA',
            'color' => '#E0A527',
            'open_url' => 'https://siakad.yapinet.id',
            'open_mode' => 'new_tab',
            'summary_url' => 'https://siakad.yapinet.id/api/integrations/yapinet/summary',
            'auth_type' => 'bearer',
            'api_key' => 'rahasia-sekali-1234',
            'detail_layout' => 'auto',
            'grant_to_all' => true,
        ];
    }

    public function test_non_admin_is_forbidden(): void
    {
        $this->actingAs(User::factory()->create())->getJson('/api/admin/apps')->assertForbidden();
    }

    public function test_admin_creates_menu_and_secret_is_never_returned(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($this->admin)->postJson('/api/admin/apps', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.code', 'SIAKAD')
            ->assertJsonPath('data.has_api_key', true)
            ->assertJsonPath('data.api_key_hint', '1234');

        $this->assertStringNotContainsString('rahasia-sekali', $response->getContent());
        $this->assertStringNotContainsString('rahasia-sekali', $this->actingAs($this->admin)->getJson('/api/admin/apps')->getContent());

        $app = YapinetApp::where('slug', 'siakad')->firstOrFail();
        $this->assertSame('rahasia-sekali-1234', $app->credential->api_key);
        // grant_to_all → semua user (termasuk yang sudah ada) dapat akses.
        $this->assertDatabaseHas('user_app_access', ['user_id' => $user->id, 'app_id' => $app->id]);
        $this->assertDatabaseHas('audit_log', ['action' => 'admin.app_created', 'app_id' => $app->id]);
    }

    public function test_validation_rejects_reserved_slug_bad_color_and_internal_url(): void
    {
        $this->actingAs($this->admin)->postJson('/api/admin/apps', $this->payload([
            'slug' => 'admin',
            'color' => 'merah',
            'summary_url' => 'https://internal.hosting/api',
        ]))->assertUnprocessable()->assertJsonValidationErrors(['slug', 'color', 'summary_url']);
    }

    public function test_update_keeps_api_key_unless_sent_and_can_remove_it(): void
    {
        $app = YapinetApp::factory()->create();
        $app->credential()->create(['api_key' => 'lama-abcd']);

        $this->actingAs($this->admin)->putJson("/api/admin/apps/{$app->id}", ['name' => 'Nama Baru'])
            ->assertOk()->assertJsonPath('data.name', 'Nama Baru')->assertJsonPath('data.api_key_hint', 'abcd');

        $this->actingAs($this->admin)->putJson("/api/admin/apps/{$app->id}", ['remove_api_key' => true])
            ->assertOk()->assertJsonPath('data.has_api_key', false);
    }

    public function test_reorder_and_soft_delete(): void
    {
        [$a, $b] = YapinetApp::factory()->count(2)->create();

        $this->actingAs($this->admin)->postJson('/api/admin/apps/reorder', ['ids' => [$b->id, $a->id]])->assertNoContent();
        $this->assertSame(1, $b->fresh()->sort_order);

        $this->actingAs($this->admin)->deleteJson("/api/admin/apps/{$a->id}")->assertNoContent();
        $this->assertSoftDeleted('apps', ['id' => $a->id]);
    }

    public function test_connection_test_returns_preview_and_contract_warnings(): void
    {
        Http::fake(['siakad.yapinet.id/*' => Http::response([
            'contract_version' => 1,
            'status' => 'warning',
            'headline' => '3 nilai belum diinput',
            'metrics' => [['label' => 'Siswa', 'value' => 120, 'format' => 'number'], ['tanpa' => 'label']],
            'sections' => [['type' => 'stats', 'items' => []], ['type' => 'video']],
        ])]);

        $this->actingAs($this->admin)->postJson('/api/admin/apps/test-connection', [
            'summary_url' => 'https://siakad.yapinet.id/api/summary',
            'auth_type' => 'bearer',
            'api_key' => 'k',
        ])
            ->assertOk()
            ->assertJsonPath('data.ok', true)
            ->assertJsonPath('data.http_status', 200)
            ->assertJsonPath('data.preview.status', 'warning')
            ->assertJsonCount(1, 'data.preview.metrics')
            ->assertJsonCount(1, 'data.preview.sections')
            ->assertJsonCount(2, 'data.warnings');

        Http::assertSent(fn ($request) => $request->hasHeader('Authorization', 'Bearer k'));
    }

    public function test_connection_test_reports_http_errors_and_blocks_internal_hosts(): void
    {
        Http::fake(['*' => Http::response('oops', 500)]);

        $this->actingAs($this->admin)->postJson('/api/admin/apps/test-connection', [
            'summary_url' => 'https://siakad.yapinet.id/api/summary', 'auth_type' => 'none',
        ])->assertJsonPath('data.ok', false)->assertJsonPath('data.message', 'Aplikasi membalas HTTP 500.');

        $this->actingAs($this->admin)->postJson('/api/admin/apps/test-connection', [
            'summary_url' => 'https://internal.hosting/api', 'auth_type' => 'none',
        ])->assertJsonPath('data.ok', false);

        Http::assertSentCount(1);
    }

    public function test_admin_refresh_stores_sections_in_cache(): void
    {
        $app = YapinetApp::factory()->create();
        Http::fake(['*' => Http::response(['status' => 'ok', 'sections' => [['type' => 'alert', 'tone' => 'info', 'text' => 'Halo']]])]);

        $this->actingAs($this->admin)->postJson("/api/admin/apps/{$app->id}/refresh")->assertOk()->assertJsonPath('data.ok', true);

        $this->assertSame('Halo', $app->summaries()->first()->sections[0]['text']);
        $this->assertTrue($app->fresh()->last_check_ok);
    }

    public function test_dns_failures_are_cached(): void
    {
        $lookups = 0;
        $this->app->instance(SafeUrlValidator::class, new SafeUrlValidator(function () use (&$lookups) {
            $lookups++;

            return [];
        }));

        foreach ([1, 2] as $_) {
            $this->actingAs($this->admin)->postJson('/api/admin/apps/test-connection', [
                'summary_url' => 'https://dns-rusak.example/api', 'auth_type' => 'none',
            ])->assertJsonPath('data.ok', false);
        }

        $this->assertSame(1, $lookups);
    }
}
