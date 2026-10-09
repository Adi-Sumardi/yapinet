<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Passport\Client;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Tests\TestCase;

class OAuthSsoTest extends TestCase
{
    use RefreshDatabase;

    private function makeClient(): Client
    {
        return Client::create([
            'id' => (string) Str::uuid(),
            'name' => 'Aplikasi Anak Uji',
            'secret' => 'test-secret',
            'redirect_uris' => ['https://child.test/callback'],
            'grant_types' => ['authorization_code'],
            'revoked' => false,
        ]);
    }

    private function extractAuthToken(string $html): string
    {
        preg_match('/name="auth_token" value="([^"]+)"/', $html, $matches);
        $this->assertNotEmpty($matches[1] ?? null, 'auth_token tidak ditemukan di halaman consent.');

        return $matches[1];
    }

    public function test_child_app_can_complete_authorization_code_flow_and_fetch_user(): void
    {
        $user = User::factory()->create();
        $client = $this->makeClient();

        $authorizeResponse = $this->actingAs($user)->get('/oauth/authorize?'.http_build_query([
            'client_id' => $client->id,
            'redirect_uri' => 'https://child.test/callback',
            'response_type' => 'code',
            'scope' => '',
        ]));

        $authorizeResponse->assertOk();
        $authorizeResponse->assertSee($client->name);
        $authToken = $this->extractAuthToken($authorizeResponse->getContent());

        $approveResponse = $this->actingAs($user)->post('/oauth/authorize', [
            'client_id' => $client->id,
            'auth_token' => $authToken,
        ]);

        $redirectUrl = $approveResponse->headers->get('Location');
        $this->assertNotNull($redirectUrl);

        parse_str((string) parse_url($redirectUrl, PHP_URL_QUERY), $query);
        $this->assertArrayHasKey('code', $query);

        $tokenResponse = $this->post('/oauth/token', [
            'grant_type' => 'authorization_code',
            'client_id' => $client->id,
            'client_secret' => 'test-secret',
            'redirect_uri' => 'https://child.test/callback',
            'code' => $query['code'],
        ]);

        $tokenResponse->assertOk();
        $accessToken = $tokenResponse->json('access_token');
        $this->assertNotEmpty($accessToken);

        $userResponse = $this->getJson('/api/oauth/user', [
            'Authorization' => "Bearer {$accessToken}",
        ]);

        $userResponse->assertOk();
        $userResponse->assertJson([
            'id' => $user->id,
            'primary_email' => $user->primary_email,
        ]);
    }

    public function test_oauth_user_endpoint_rejects_invalid_token(): void
    {
        $response = $this->getJson('/api/oauth/user', [
            'Authorization' => 'Bearer not-a-real-token',
        ]);

        $response->assertStatus(401);
    }

    public function test_guest_is_sent_to_web_login_then_back_to_authorize(): void
    {
        $user = User::factory()->create();
        $client = $this->makeClient();

        $authorizeUrl = '/oauth/authorize?'.http_build_query([
            'client_id' => $client->id,
            'redirect_uri' => 'https://child.test/callback',
            'response_type' => 'code',
            'scope' => '',
        ]);

        $guestResponse = $this->get($authorizeUrl);
        $guestResponse->assertRedirect('/login');

        $googleUser = (new SocialiteUser)->map(['id' => 'google-sub-1', 'email' => $user->primary_email]);
        Socialite::shouldReceive('driver->redirectUrl->user')->andReturn($googleUser);

        $this->get('/login/google/callback')->assertRedirect($authorizeUrl);

        $this->assertAuthenticatedAs($user);

        $followUp = $this->get($authorizeUrl);
        $followUp->assertOk();
        $followUp->assertSee($client->name);
    }
}
