<?php

namespace App\Models;

use App\Enums\AuthType;
use App\Enums\IconType;
use App\Enums\OpenMode;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Satu baris = satu menu di dashboard (rules/system-features.md F5).
 */
class YapinetApp extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'apps';

    /** Layout detail khusus yang masih punya komponen React sendiri. */
    public const CUSTOM_LAYOUTS = ['sianggar', 'simaya', 'simonik', 'simonas'];

    public const DETAIL_LAYOUTS = ['auto', 'link_only', ...self::CUSTOM_LAYOUTS];

    protected $fillable = [
        'code', 'slug', 'name', 'description', 'icon_type', 'icon_text', 'icon_url',
        'color', 'sort_order', 'is_active', 'open_url', 'open_mode', 'sso_path',
        'summary_url', 'auth_type', 'auth_header', 'refresh_minutes',
        'detail_layout', 'grant_to_all',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'grant_to_all' => 'boolean',
            'sort_order' => 'integer',
            'refresh_minutes' => 'integer',
            'icon_type' => IconType::class,
            'open_mode' => OpenMode::class,
            'auth_type' => AuthType::class,
            'last_checked_at' => 'datetime',
            'last_check_ok' => 'boolean',
        ];
    }

    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): void
    {
        $query->orderBy('sort_order')->orderBy('name');
    }

    /** Menu aktif yang boleh dilihat user: Admin melihat semua, User hanya yang diberi akses. */
    public function scopeVisibleTo(Builder $query, User $user): void
    {
        $query->active();

        if (! $user->isAdmin()) {
            $query->whereHas('accessGrants', fn (Builder $grants) => $grants->where('user_id', $user->id));
        }
    }

    /** Slug atau kode (kode dipakai frontend lama sampai Fase 2 live). */
    public function scopeIdentifiedBy(Builder $query, string $slugOrCode): void
    {
        $query->where(fn (Builder $q) => $q->where('slug', $slugOrCode)->orWhere('code', strtoupper($slugOrCode)));
    }

    public function hasSummary(): bool
    {
        return $this->summary_url !== null && $this->detail_layout !== 'link_only';
    }

    public function credential(): HasOne
    {
        return $this->hasOne(AppCredential::class, 'app_id');
    }

    public function accessGrants(): HasMany
    {
        return $this->hasMany(UserAppAccess::class, 'app_id');
    }

    public function summaries(): HasMany
    {
        return $this->hasMany(AppSummaryCache::class, 'app_id');
    }
}
