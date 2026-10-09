<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'full_name' => ['sometimes', 'string', 'max:255'],
            'is_admin' => ['sometimes', 'boolean'],
            'status' => ['sometimes', Rule::in(['active', 'suspended'])],
        ];
    }

    /** Admin tidak boleh mencabut admin / menonaktifkan dirinya sendiri. */
    public function after(): array
    {
        return [function (Validator $validator) {
            /** @var User $target */
            $target = $this->route('user');

            if (! $target->is($this->user())) {
                return;
            }

            if ($this->has('is_admin') && ! $this->boolean('is_admin')) {
                $validator->errors()->add('is_admin', 'Anda tidak bisa mencabut role Admin dari akun sendiri.');
            }

            if ($this->input('status') === 'suspended') {
                $validator->errors()->add('status', 'Anda tidak bisa menonaktifkan akun sendiri.');
            }
        }];
    }
}
