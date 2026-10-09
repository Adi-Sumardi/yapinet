<?php

namespace App\Http\Requests\Admin;

use App\Services\SettingsService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Validator as ValidatorFactory;
use Illuminate\Validation\Validator;

/**
 * Body: { "values": { "branding.app_name": "..." } }. Key memakai titik,
 * jadi tiap nilai divalidasi manual dengan aturan dari config/settings.php
 * (aturan bertitik akan dibaca Laravel sebagai array bersarang).
 */
class UpdateSettingsRequest extends FormRequest
{
    public function rules(): array
    {
        return ['values' => ['required', 'array']];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            $definitions = app(SettingsService::class)->definitions();

            foreach ((array) $this->input('values', []) as $key => $value) {
                if (! isset($definitions[$key])) {
                    $validator->errors()->add("values.{$key}", "Pengaturan \"{$key}\" tidak dikenal.");

                    continue;
                }

                $check = ValidatorFactory::make(['value' => $value], ['value' => $definitions[$key]['rules']], [], ['value' => $definitions[$key]['label']]);

                foreach ($check->errors()->all() as $message) {
                    $validator->errors()->add("values.{$key}", $message);
                }
            }
        }];
    }

    /** @return array<string, mixed> */
    public function settingValues(): array
    {
        return (array) $this->input('values');
    }
}
