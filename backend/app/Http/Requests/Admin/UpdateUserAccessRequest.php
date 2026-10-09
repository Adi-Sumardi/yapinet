<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserAccessRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'app_ids' => ['present', 'array'],
            'app_ids.*' => ['uuid', 'distinct', 'exists:apps,id'],
        ];
    }
}
