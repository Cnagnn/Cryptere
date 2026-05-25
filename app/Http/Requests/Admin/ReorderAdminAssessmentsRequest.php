<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class ReorderAdminAssessmentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can(User::PERMISSION_MANAGE_ASSESSMENTS);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'integer', 'exists:assessments,id'],
            'items.*.sort_order' => ['required', 'integer', 'min:0'],
        ];
    }
}
