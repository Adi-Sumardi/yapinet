<?php

namespace App\Rules;

use App\Services\SafeUrlValidator;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class SafeExternalUrl implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $result = app(SafeUrlValidator::class)->check((string) $value);

        if (! $result['ok']) {
            $fail($result['error']);
        }
    }
}
