<?php

namespace Tests\Feature;

use App\Models\GoogleIdentity;
use App\Models\User;
use App\Models\UserAppAccess;
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

        $this->assertDatabaseHas('audit_log', ['action' => 'auth.login_rejected']);

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

    public function test_login_does_not_regrant_revoked_access(): void
    {
        $user = User::factory()->create(['primary_email' => 'guru@yayasan.id']);
        $this->fakeGoogle('guru@yayasan.id');

        $this->get('/api/auth/google/callback');

        $this->assertSame(0, UserAppAccess::where('user_id', $user->id)->count());
    }
}
