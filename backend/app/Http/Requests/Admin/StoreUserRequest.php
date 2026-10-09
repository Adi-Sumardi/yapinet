<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['primary_email' => strtolower(trim((string) $this->input('primary_email')))]);
    }

    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:255'],
            'primary_email' => ['required', 'email', 'max:255', Rule::unique('users', 'primary_email')],
            'is_admin' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return ['primary_email.unique' => 'Email ini sudah terdaftar.'];
    }
}
