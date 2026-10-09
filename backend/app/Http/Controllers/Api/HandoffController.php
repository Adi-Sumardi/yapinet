<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppCredential;
use App\Models\HandoffTicket;
use App\Models\YapinetApp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Verifikasi tiket handoff (< 60 detik) dari aplikasi anak. Tiketnya
 * diterbitkan oleh App\Actions\OpenApp saat menu ber-open_mode handoff dibuka.
 */
class HandoffController extends Controller
{
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
        abort_unless($credential->api_key && hash_equals($credential->api_key, $request->string('api_key')->toString()), 401, 'API key tidak valid.');

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
