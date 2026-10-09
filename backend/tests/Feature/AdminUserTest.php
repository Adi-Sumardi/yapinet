<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserAppAccess;
use App\Models\YapinetApp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        YapinetApp::query()->forceDelete();
        $this->admin = User::factory()->create(['is_admin' => true]);
    }

    public function test_new_user_gets_only_grant_to_all_menus(): void
    {
        $everyone = YapinetApp::factory()->create(['grant_to_all' => true]);
        YapinetApp::factory()->create(['grant_to_all' => false]);

        $id = $this->actingAs($this->admin)
            ->postJson('/api/admin/users', ['full_name' => 'Guru Baru', 'primary_email' => 'Baru@Yayasan.id'])
            ->assertCreated()
            ->assertJsonPath('data.primary_email', 'baru@yayasan.id')
            ->json('data.id');

        $this->assertSame([$everyone->id], UserAppAccess::where('user_id', $id)->pluck('app_id')->all());
    }

    public function test_list_is_paginated_and_searchable(): void
    {
        User::factory()->create(['full_name' => 'Siti Aminah']);
        User::factory()->create(['full_name' => 'Budi']);

        $this->actingAs($this->admin)->getJson('/api/admin/users?search=siti')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonStructure(['data', 'meta' => ['total']]);
    }

    public function test_admin_cannot_demote_suspend_or_delete_self(): void
    {
        $this->actingAs($this->admin)->putJson("/api/admin/users/{$this->admin->id}", ['is_admin' => false, 'status' => 'suspended'])
            ->assertUnprocessable()->assertJsonValidationErrors(['is_admin', 'status']);

        $this->actingAs($this->admin)->deleteJson("/api/admin/users/{$this->admin->id}")->assertStatus(422);
    }

    public function test_suspending_user_revokes_tokens(): void
    {
        $user = User::factory()->create();
        $user->createToken('x');

        $this->actingAs($this->admin)->putJson("/api/admin/users/{$user->id}", ['status' => 'suspended'])->assertOk();

        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_delete_user_keeps_audit_trail(): void
    {
        $user = User::factory()->create();
        $user->createToken('x');

        $this->actingAs($this->admin)->deleteJson("/api/admin/users/{$user->id}")->assertNoContent();

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $user->id]);
        $this->assertDatabaseHas('audit_log', ['action' => 'admin.user_deleted']);
    }

    public function test_access_is_set_in_bulk(): void
    {
        $user = User::factory()->create();
        [$a, $b, $c] = YapinetApp::factory()->count(3)->create();
        UserAppAccess::create(['user_id' => $user->id, 'app_id' => $a->id]);

        $this->actingAs($this->admin)->putJson("/api/admin/users/{$user->id}/access", ['app_ids' => [$b->id, $c->id]])
            ->assertOk()
            ->assertJsonCount(3, 'data.apps');

        $this->assertEqualsCanonicalizing([$b->id, $c->id], $user->appAccess()->pluck('app_id')->all());
    }

    public function test_show_returns_single_user(): void
    {
        $user = User::factory()->create(['full_name' => 'Siti']);

        $this->actingAs($this->admin)->getJson("/api/admin/users/{$user->id}")->assertOk()->assertJsonPath('data.full_name', 'Siti');
    }
}
