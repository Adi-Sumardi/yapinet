<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppCredential;
use App\Models\AuditLog;
use App\Models\HandoffTicket;
use App\Models\UserAppAccess;
use App\Models\YapinetApp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Menerbitkan tiket handoff pendek (< 60 detik) lalu redirect ke aplikasi
 * anak — pengganti detail view, bukan re-implementasi (Bab 04/06 blueprint).
 */
class HandoffController extends Controller
{
    /**
     * Mengembalikan JSON berisi redirect_url (bukan redirect HTTP langsung)
     * supaya SPA bisa memanggilnya lewat fetch() dengan header Authorization,
     * lalu melakukan window.location sendiri di sisi client.
     */
    public function issue(Request $request, string $code): JsonResponse
    {
        $app = YapinetApp::where('code', $code)->where('is_active', true)->firstOrFail();

        $access = UserAppAccess::where('user_id', $request->user()->id)
            ->where('app_id', $app->id)
            ->first();

        abort_unless($access, 403, 'Tidak punya akses ke aplikasi ini.');

        $targetPath = $request->query('path');
        $plainTicket = Str::random(48);

        HandoffTicket::create([
            'user_id' => $request->user()->id,
            'app_id' => $app->id,
            // sha256 (bukan bcrypt) supaya endpoint verify() bisa lookup langsung by hash.
            'ticket_hash' => hash('sha256', $plainTicket),
            'target_path' => $targetPath,
            'expires_at' => now()->addSeconds(60),
        ]);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'redirect',
            'app_id' => $app->id,
            'metadata' => ['target_path' => $targetPath],
        ]);

        // public_url adalah tautan yang benar-benar dibuka pengguna di
        // browser; base_url dipakai untuk panggilan API server-to-server dan
        // di lokal sengaja diarahkan ke dev server (mis. http://127.0.0.1:8001)
        // — tidak boleh ikut jadi link publik yang dibuka pengguna.
        $publicBaseUrl = rtrim($app->public_url ?: $app->base_url, '/');

        if (! $app->sso_endpoint) {
            // Aplikasi belum mendukung SSO handoff — fallback ke tautan biasa (lihat callout Bab 06).
            return response()->json([
                'redirect_url' => $publicBaseUrl.($targetPath ? '/'.ltrim($targetPath, '/') : ''),
            ]);
        }

        $ssoPath = '/'.ltrim($app->sso_endpoint, '/');

        return response()->json([
            'redirect_url' => "{$publicBaseUrl}{$ssoPath}?ticket={$plainTicket}",
        ]);
    }

    /**
     * Dipanggil server-to-server oleh aplikasi anak (bukan oleh browser) saat
     * ia menerima ticket di endpoint /integrations/yapinet/sso/consume
     * miliknya sendiri, untuk menukar ticket dengan identitas pengguna.
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'app_code' => 'required|string',
            'api_key' => 'required|string',
            'ticket' => 'required|string',
        ]);

        $app = YapinetApp::where('code', $request->string('app_code'))->first();
        abort_unless($app && $app->credential, 401, 'Aplikasi atau kredensial tidak dikenal.');

        /** @var AppCredential $credential */
        $credential = $app->credential;
        abort_unless(hash_equals($credential->api_key_encrypted, $request->string('api_key')->toString()), 401, 'API key tidak valid.');

        $hash = hash('sha256', $request->string('ticket'));

        $ticket = HandoffTicket::with('user')
            ->where('app_id', $app->id)
            ->where('ticket_hash', $hash)
            ->first();

        if (! $ticket || $ticket->isExpired()) {
            return response()->json(['message' => 'Ticket tidak valid atau kedaluwarsa.'], 410);
        }

        $ticket->update(['consumed_at' => now()]);

        return response()->json([
            'email' => $ticket->user->primary_email,
            'full_name' => $ticket->user->full_name,
            'target_path' => $ticket->target_path,
        ]);
    }
}
