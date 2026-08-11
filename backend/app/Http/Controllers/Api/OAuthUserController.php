<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use League\OAuth2\Server\Exception\OAuthServerException;
use League\OAuth2\Server\ResourceServer;
use Symfony\Bridge\PsrHttpMessage\Factory\PsrHttpFactory;

/**
 * Endpoint yang dipanggil aplikasi anak (server-to-server) setelah SSO
 * OAuth2 (Authorization Code Grant via Passport) untuk menukar access
 * token dengan identitas pengguna Yapinet.
 *
 * Validasi token dilakukan manual lewat ResourceServer (bukan middleware
 * auth:api / guard passport) karena User masih memakai Sanctum HasApiTokens
 * untuk sesi PWA — kedua trait HasApiTokens (Sanctum & Passport) tidak bisa
 * digabung di model yang sama (nama method & properti bertabrakan).
 */
class OAuthUserController extends Controller
{
    public function show(Request $request, ResourceServer $server): JsonResponse
    {
        try {
            $psr = $server->validateAuthenticatedRequest((new PsrHttpFactory)->createRequest($request));
        } catch (OAuthServerException) {
            return response()->json(['message' => 'Token tidak valid atau kedaluwarsa.'], 401);
        }

        $userId = $psr->getAttribute('oauth_user_id');
        abort_unless($userId, 401, 'Token ini bukan milik pengguna (client credentials).');

        $user = User::find($userId);
        abort_unless($user, 404, 'Pengguna tidak ditemukan.');

        return response()->json([
            'id' => $user->id,
            'full_name' => $user->full_name,
            'primary_email' => $user->primary_email,
            'status' => $user->status,
        ]);
    }
}
