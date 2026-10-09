<?php

namespace App\Actions;

use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Support\Facades\DB;

class DeleteUser
{
    public function __construct(private AuditLogger $audit) {}

    public function __invoke(User $user, User $actor): void
    {
        DB::transaction(function () use ($user, $actor) {
            // Token Sanctum (morph) & token OAuth Passport tidak punya FK
            // cascade ke users — hapus manual supaya sesi user ikut mati.
            $user->tokens()->delete();
            DB::table('oauth_access_tokens')->where('user_id', $user->id)->delete();
            DB::table('oauth_auth_codes')->where('user_id', $user->id)->delete();

            $this->audit->log($actor, 'admin.user_deleted', metadata: [
                'user_id' => $user->id,
                'email' => $user->primary_email,
            ]);

            $user->delete();
        });
    }
}
