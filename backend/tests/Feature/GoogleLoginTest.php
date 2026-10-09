<?php

namespace Tests\Feature;

use App\Models\GoogleIdentity;
use App\Models\AppSummaryCache;
use App\Models\User;
use App\Models\UserAppAccess;
use App\Models\YapinetApp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Tests\TestCase;

class GoogleLoginTest extends TestCase
{
    use RefreshDatabase;

    private function fakeGoogle(string $email, string $sub = 'google-sub-1'): void
    {
        $googleUser = (new SocialiteUser)->map(['id' => $sub, 'email' => $email, 'name' => 'Uji']);
        Socialite::shouldReceive('driver->stateless->user')->andReturn($googleUser);
    }

    private function frontend(string $path): string
    {
        return rtrim(config('app.frontend_url'), '/').$path;
    }

    public function test_registered_email_can_log_in_and_gets_linked(): void
    {
        $user = User::factory()->create(['primary_email' => 'guru@yayasan.id']);
        $this->fakeGoogle('Guru@Yayasan.id');

        $response = $this->get('/api/auth/google/callback');

        $this->assertStringStartsWith($this->frontend('/auth/callback?token='), $response->headers->get('Location'));
        $this->assertDatabaseHas('google_identities', ['user_id' => $user->id, 'google_sub' => 'google-sub-1']);
    }

    public function test_unregistered_email_is_rejected_and_not_created(): void
    {
        $this->fakeGoogle('orang.asing@gmail.com');

        $this->get('/api/auth/google/callback')
            ->assertRedirect($this->frontend('/login?error=not_registered'));

        $this->assertDatabaseMissing('users', ['primary_email' => 'orang.asing@gmail.com']);
        $this->assertSame(0, GoogleIdentity::count());
    }

    public function test_suspended_user_is_rejected(): void
    {
        User::factory()->create(['primary_email' => 'nonaktif@yayasan.id', 'status' => 'suspended']);
        $this->fakeGoogle('nonaktif@yayasan.id');

        $this->get('/api/auth/google/callback')
            ->assertRedirect($this->frontend('/login?error=suspended'));
    }

    public function test_admin_can_register_user_without_password(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)
            ->postJson('/api/admin/users', ['full_name' => 'Guru Baru', 'primary_email' => 'baru@yayasan.id'])
            ->assertCreated();

        $this->assertDatabaseHas('users', ['primary_email' => 'baru@yayasan.id', 'password' => null]);
    }

    public function test_admin_can_delete_other_user_but_not_self(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $other = User::factory()->create();
        $other->createToken('x');

        $this->actingAs($admin)->deleteJson("/api/admin/users/{$other->id}")->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $other->id]);
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $other->id]);

        $this->actingAs($admin)->deleteJson("/api/admin/users/{$admin->id}")->assertStatus(422);
    }

    public function test_dashboard_hides_inactive_apps(): void
    {
        $user = User::factory()->create();
        $siakad = YapinetApp::where('code', 'SIAK')->firstOrFail();
        $espp = YapinetApp::create([
            'code' => 'ESPP', 'name' => 'e-SPP', 'base_url' => 'https://espp.test',
            'summary_endpoint' => '/summary', 'cache_ttl_seconds' => 600, 'is_active' => false,
        ]);

        foreach ([$siakad, $espp] as $app) {
            UserAppAccess::create(['user_id' => $user->id, 'app_id' => $app->id, 'unit_id' => null, 'yayasan_role' => 'bph', 'can_act' => true]);
            AppSummaryCache::create(['app_id' => $app->id, 'unit_id' => null, 'status' => 'ok', 'headline' => 'x', 'metrics' => [], 'fetched_at' => now(), 'expires_at' => now()->addHour()]);
        }

        $codes = collect($this->actingAs($user)->getJson('/api/dashboard/summary')->assertOk()->json('cards'))->pluck('app_code');

        $this->assertSame(['SIAK'], $codes->all());
    }
}
