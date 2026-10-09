<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Services\AuditLogger;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/** Pengaturan dinamis (rules/system-features.md F8). */
class SettingController extends Controller
{
    public function index(SettingsService $settings): JsonResponse
    {
        $items = collect($settings->definitions())->map(fn (array $def, string $key) => [
            'key' => $key,
            'group' => strtok($key, '.'),
            'label' => $def['label'],
            'type' => $def['type'],
            'options' => $def['options'] ?? null,
            'public' => $def['public'] ?? false,
            'default' => $def['default'],
            'value' => $settings->get($key),
            'is_default' => ! $settings->isOverridden($key),
        ])->values();

        return response()->json(['data' => $items, 'meta' => ['groups' => config('settings.groups')]]);
    }

    public function update(UpdateSettingsRequest $request, SettingsService $settings, AuditLogger $audit): JsonResponse
    {
        $values = $request->settingValues();
        $settings->setMany($values, $request->user());
        $audit->log($request->user(), 'admin.settings_updated', metadata: ['keys' => array_keys($values)]);

        return $this->index($settings);
    }

    public function destroy(Request $request, string $key, SettingsService $settings, AuditLogger $audit): Response
    {
        abort_unless($settings->has($key), 404, 'Pengaturan tidak dikenal.');

        $settings->reset($key);
        $audit->log($request->user(), 'admin.settings_updated', metadata: ['keys' => [$key], 'reset' => true]);

        return response()->noContent();
    }
}
