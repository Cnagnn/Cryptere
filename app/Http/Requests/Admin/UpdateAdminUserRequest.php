<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateAdminUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return (bool) $this->user()?->can(User::PERMISSION_MANAGE_USERS);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'role' => ['required', Rule::in(User::ROLES)],
            'points' => ['required', 'integer', 'min:0'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $targetUser = $this->route('user');
                $requestedRole = (string) $this->input('role');
                $actor = $this->user();

                if (! $targetUser instanceof User || ! $actor instanceof User) {
                    return;
                }

                if ($requestedRole === User::ROLE_SUPER_ADMIN && ! $actor->isSuperAdmin()) {
                    $validator->errors()->add('role', 'Only a Super Admin can grant the Super Admin role.');
                }

                if ($targetUser->isSuperAdmin() && ! $actor->isSuperAdmin()) {
                    $validator->errors()->add('role', 'Only a Super Admin can modify another Super Admin.');
                }

                if (
                    $targetUser->isSuperAdmin()
                    && $requestedRole !== User::ROLE_SUPER_ADMIN
                    && User::countUsersWithRole(User::ROLE_SUPER_ADMIN) <= 1
                ) {
                    $validator->errors()->add('role', 'The last Super Admin cannot be demoted.');
                }
            },
        ];
    }
}
