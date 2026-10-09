<?php

namespace App\Actions;

use App\Models\AppCredential;
use App\Models\User;
use App\Models\YapinetApp;
use App\Services\AuditLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Buat / ubah menu beserta API key-nya. API key bersifat write-only:
 * field `api_key` tidak dikirim = tidak diubah, `remove_api_key` = hapus.
 */
class SaveApp
{
    public function __construct(
        private GrantAppToAllUsers $grantAppToAllUsers,
        private AuditLogger $audit,
    ) {}

    public function __invoke(array $data, User $actor, ?YapinetApp $app = null): YapinetApp
    {
        return DB::transaction(function () use ($data, $actor, $app) {
            $isNew = $app === null;
            $app ??= new YapinetApp;

            $apiKey = $data['api_key'] ?? null;
            $removeKey = (bool) ($data['remove_api_key'] ?? false);
            unset($data['api_key'], $data['remove_api_key']);

            if ($isNew) {
                $data['code'] ??= $this->codeFromSlug($data['slug']);
                $data['sort_order'] = (int) YapinetApp::withTrashed()->max('sort_order') + 1;
            }

            $wasGrantToAll = (bool) $app->grant_to_all;
            $app->fill($data)->save();
            $changed = array_keys($app->getChanges());

            $keyChanged = $this->saveCredential($app, $apiKey, $removeKey);

            if ($app->grant_to_all && ($isNew || ! $wasGrantToAll)) {
                ($this->grantAppToAllUsers)($app, $actor);
            }

            $this->audit->log($actor, $isNew ? 'admin.app_created' : 'admin.app_updated', $app, array_filter([
                'changed' => $isNew ? null : array_values(array_diff($changed, ['updated_at'])),
                'api_key_changed' => $keyChanged ?: null,
            ]));

            return $app->load('credential');
        });
    }

    private function saveCredential(YapinetApp $app, ?string $apiKey, bool $remove): bool
    {
        if ($apiKey === null && ! $remove) {
            return false;
        }

        $credential = $app->credential ?? new AppCredential(['app_id' => $app->id]);
        $credential->api_key = $remove ? null : $apiKey;
        $credential->rotated_at = now();
        $credential->save();
        $app->setRelation('credential', $credential);

        return true;
    }

    private function codeFromSlug(string $slug): string
    {
        $base = Str::upper(Str::substr(str_replace('-', '', $slug), 0, 16));
        $code = $base;

        for ($i = 2; YapinetApp::withTrashed()->where('code', $code)->exists(); $i++) {
            $code = $base.$i;
        }

        return $code;
    }
}
