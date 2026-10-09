<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_settings_exclude_private_keys(): void
    {
        $data = $this->getJson('/api/settings/public')->assertOk()->json('data');

        $this->assertSame('Yapinet', $data['branding.app_name']);
        $this->assertArrayNotHasKey('integration.request_timeout_seconds', $data);
    }

    public function test_admin_updates_and_resets_settings(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)->putJson('/api/admin/settings', ['values' => [
            'branding.app_name' => 'Portal YAPI',
            'branding.primary_color' => '#112233',
            'announcement.enabled' => true,
        ]])->assertOk();

        $this->assertSame('Portal YAPI', $this->getJson('/api/settings/public')->json('data')['branding.app_name']);

        $this->actingAs($admin)->deleteJson('/api/admin/settings/branding.app_name')->assertNoContent();
        $this->assertSame('Yapinet', $this->getJson('/api/settings/public')->json('data')['branding.app_name']);
    }

    public function test_invalid_and_unknown_settings_are_rejected(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)->putJson('/api/admin/settings', ['values' => [
            'branding.primary_color' => 'biru',
            'tidak.ada' => 1,
        ]])->assertUnprocessable()->assertJsonValidationErrors(['values.branding.primary_color', 'values.tidak.ada']);
    }

    public function test_non_admin_cannot_read_admin_settings(): void
    {
        $this->actingAs(User::factory()->create())->getJson('/api/admin/settings')->assertForbidden();
    }
}
