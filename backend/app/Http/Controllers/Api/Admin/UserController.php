<?php

namespace App\Http\Controllers\Api\Admin;

use App\Actions\DeleteUser;
use App\Actions\GrantDefaultAccess;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\Admin\UserResource;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/** Kelola pengguna (rules/system-features.md F6). Role hanya Admin & User. */
class UserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $users = User::query()
            ->withCount(['appAccess', 'googleIdentities'])
            ->when($request->query('search'), fn ($q, $search) => $q->where(fn ($q) => $q
                ->where('full_name', 'like', "%{$search}%")
                ->orWhere('primary_email', 'like', "%{$search}%")))
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->orderByDesc('is_admin')
            ->orderBy('full_name')
            ->paginate(min(100, max(1, (int) $request->query('per_page', 50))));

        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request, GrantDefaultAccess $grantDefaultAccess, AuditLogger $audit): JsonResponse
    {
        $user = User::create($request->validated() + ['status' => 'active']);
        $grantDefaultAccess($user, $request->user());
        $audit->log($request->user(), 'admin.user_created', metadata: ['user_id' => $user->id, 'email' => $user->primary_email]);

        return (new UserResource($user->loadCount(['appAccess', 'googleIdentities'])))->response()->setStatusCode(201);
    }

    public function show(User $user): UserResource
    {
        return new UserResource($user->loadCount(['appAccess', 'googleIdentities']));
    }

    public function update(UpdateUserRequest $request, User $user, AuditLogger $audit): UserResource
    {
        $user->update($request->validated());

        if ($user->status === 'suspended') {
            // Akun nonaktif harus langsung keluar dari semua sesi.
            $user->tokens()->delete();
        }

        $audit->log($request->user(), 'admin.user_updated', metadata: ['user_id' => $user->id, 'changed' => array_keys($request->validated())]);

        return new UserResource($user->loadCount(['appAccess', 'googleIdentities']));
    }

    public function destroy(Request $request, User $user, DeleteUser $deleteUser): Response
    {
        abort_if($user->is($request->user()), 422, 'Anda tidak bisa menghapus akun sendiri.');

        $deleteUser($user, $request->user());

        return response()->noContent();
    }
}
