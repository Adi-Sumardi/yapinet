<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'type', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function userAppAccess(): HasMany
    {
        return $this->hasMany(UserAppAccess::class);
    }

    public function summaryCache(): HasMany
    {
        return $this->hasMany(AppSummaryCache::class);
    }
}
