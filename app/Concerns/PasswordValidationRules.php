<?php

namespace App\Concerns;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Validation\Rules\Password;

trait PasswordValidationRules
{
    /**
     * Get the validation rules used to validate passwords.
     *
     * Production-grade password policy:
     *   - Minimum 12 characters (modern NIST 800-63B guidance — old 8-char rule is weak)
     *   - Mixed case + at least one number
     *   - Checked against the HaveIBeenPwned breach corpus via `uncompromised()`
     *     (k-anonymity API; only the first 5 chars of the SHA-1 hash leave the server)
     *
     * @return array<int, Rule|array<mixed>|string>
     */
    protected function passwordRules(): array
    {
        return [
            'required',
            'string',
            'confirmed',
            Password::min(12)
                ->letters()
                ->mixedCase()
                ->numbers()
                ->uncompromised(),
        ];
    }

    /**
     * Get the validation rules used to validate the current password.
     *
     * @return array<int, Rule|array<mixed>|string>
     */
    protected function currentPasswordRules(): array
    {
        return ['required', 'string', 'current_password'];
    }
}
