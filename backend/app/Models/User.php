<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    protected $fillable = ['full_name', 'primary_email', 'password', 'must_change_password', 'status', 'is_admin'];

    protected $hidden = ['password'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'must_change_password' => 'boolean',
            'is_admin' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /** Role Yapinet hanya dua: Admin (is_admin) dan User. */
    public function isAdmin(): bool
    {
        return (bool) $this->is_admin;
    }

    public function googleIdentities(): HasMany
    {
        return $this->hasMany(GoogleIdentity::class);
    }

    public function appAccess(): HasMany
    {
        return $this->hasMany(UserAppAccess::class);
    }
}
