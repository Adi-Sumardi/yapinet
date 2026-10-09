<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Satu pintu baca/tulis pengaturan dinamis. Nilai = override di tabel
 * settings, jatuh ke default di config/settings.php bila tidak ada.
 */
class SettingsService
{
    private const CACHE_KEY = 'settings.values';

    /** @return array<string, array<string, mixed>> */
    public function definitions(): array
    {
        return config('settings.definitions');
    }

    public function has(string $key): bool
    {
        return array_key_exists($key, $this->definitions());
    }

    public function get(string $key): mixed
    {
        if (! $this->has($key)) {
            throw new InvalidArgumentException("Pengaturan [{$key}] tidak terdaftar di config/settings.php.");
        }

        $overrides = $this->overrides();

        return array_key_exists($key, $overrides) ? $overrides[$key] : $this->definitions()[$key]['default'];
    }

    /** @return array<string, mixed> semua nilai efektif */
    public function all(): array
    {
        return collect($this->definitions())->mapWithKeys(fn ($def, $key) => [$key => $this->get($key)])->all();
    }

    /** @return array<string, mixed> nilai yang boleh dibaca tanpa login */
    public function public(): array
    {
        return collect($this->definitions())
            ->filter(fn ($def) => $def['public'] ?? false)
            ->mapWithKeys(fn ($def, $key) => [$key => $this->get($key)])
            ->all();
    }

    public function isOverridden(string $key): bool
    {
        return array_key_exists($key, $this->overrides());
    }

    /** @param array<string, mixed> $values sudah divalidasi (lihat UpdateSettingsRequest) */
    public function setMany(array $values, ?User $by = null): void
    {
        DB::transaction(function () use ($values, $by) {
            foreach ($values as $key => $value) {
                Setting::updateOrCreate(['key' => $key], ['value' => $this->cast($key, $value), 'updated_by' => $by?->id]);
            }
        });

        Cache::forget(self::CACHE_KEY);
    }

    public function reset(string $key): void
    {
        Setting::where('key', $key)->delete();
        Cache::forget(self::CACHE_KEY);
    }

    private function cast(string $key, mixed $value): mixed
    {
        return match ($this->definitions()[$key]['type']) {
            'bool' => (bool) $value,
            'int' => (int) $value,
            'color' => strtoupper((string) $value),
            default => $value,
        };
    }

    /** @return array<string, mixed> */
    private function overrides(): array
    {
        return Cache::rememberForever(self::CACHE_KEY, fn () => Setting::pluck('value', 'key')->all());
    }
}
