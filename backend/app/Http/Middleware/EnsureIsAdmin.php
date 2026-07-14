<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Menjaga rute /api/admin/* — hanya user dengan users.is_admin yang boleh
 * mengelola App Registry & hak akses pengguna lain (panel Pengaturan).
 */
class EnsureIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->is_admin, 403, 'Hanya admin yang boleh mengakses ini.');

        return $next($request);
    }
}
