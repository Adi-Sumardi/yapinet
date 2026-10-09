# Models (Eloquent)

Lokasi: `backend/app/Models/`.

## Aturan

1. **UUID**: semua model domain memakai `use HasUuids;`.
2. **Mass assignment**: pakai properti `protected $fillable = [...]`.
   Jangan campur dengan atribut `#[Fillable]` (sekarang `User` memakai
   atribut, model lain properti — samakan ke properti saat menyentuh `User`).
   Kolom sensitif (`is_admin`, `status`) boleh fillable **hanya** jika semua
   jalur penulisan lewat FormRequest admin.
3. **Casts** di method `casts(): array`. Wajib untuk: boolean, datetime,
   json/array, dan secret (`encrypted`).
4. **`$hidden`** untuk apa pun yang tidak boleh ikut serialisasi (secret, token).
   Tetap jangan andalkan `$hidden` saja — respons API selalu lewat Resource.
5. **Relasi** diberi return type (`BelongsTo`, `HasMany`, …) dan nama yang
   jelas (`credential()`, `accessGrants()`, `summaries()`).
6. **Query scope** untuk filter yang berulang:
   - `YapinetApp::active()` → `is_active = true`
   - `YapinetApp::ordered()` → `orderBy('sort_order')->orderBy('name')`
   - `YapinetApp::visibleTo(User $user)` → aktif + (user Admin **atau** punya baris di `user_app_access`)
7. **Tidak ada logika bisnis berat di model.** Model boleh punya helper kecil
   (`isExpired()`, `isStale()`, accessor turunan). Proses yang melibatkan
   beberapa model / HTTP → `app/Services` atau `app/Actions`.
8. **Tidak ada HTTP call / query N+1 di accessor.** Eager load (`with()`) di
   query pemanggil.
9. Konstanta nilai tetap disimpan sebagai **PHP enum** di `app/Enums`
   (mis. `OpenMode`, `AuthType`, `SummaryStatus`) dan dipakai di
   cast: `'open_mode' => OpenMode::class`.
10. Soft delete hanya di model yang memang butuh riwayat (`YapinetApp`).

## Katalog model (target)

| Model | Tabel | Relasi utama | Catatan |
|---|---|---|---|
| `User` | users | `accessGrants`, `googleIdentities` | `is_admin` (= role Admin), `status`; helper `isAdmin()` |
| `GoogleIdentity` | google_identities | `user` | dibuat saat login Google pertama |
| `YapinetApp` | apps | `credential`, `accessGrants`, `summaries` | SoftDeletes; nama class tetap (dipakai di banyak tempat) |
| `AppCredential` | app_credentials | `app` | semua kolom secret di-cast `encrypted`, `$hidden` |
| `UserAppAccess` | user_app_access | `user`, `app`, `unit` | `scope_key` |
| `AppSummaryCache` | app_summary_cache | `app`, `unit` | `isStale()` membaca pengaturan `integration.stale_after_minutes` |
| `Unit` | units | | |
| `Setting` | settings | `updatedBy` | **jangan** dibaca langsung — pakai `SettingsService` |
| `AuditLog` | audit_log | `user`, `app` | ditulis lewat `AuditLogger`, bukan `AuditLog::create` tersebar |
| `HandoffTicket` | handoff_tickets | `user`, `app` | |

## Contoh

```php
class YapinetApp extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'apps';

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
            'open_mode' => OpenMode::class,
            'auth_type' => AuthType::class,
            'last_checked_at' => 'datetime',
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

    public function credential(): HasOne
    {
        return $this->hasOne(AppCredential::class, 'app_id');
    }
}
```
