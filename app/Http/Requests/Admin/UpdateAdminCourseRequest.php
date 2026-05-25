<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAdminCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can(User::PERMISSION_MANAGE_COURSES);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'cover_image' => ['nullable', 'file', 'mimetypes:image/*', 'max:10240'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }
}
