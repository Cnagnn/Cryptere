<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAdminChallengeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'prompt' => ['required', 'string'],
            'hint' => ['nullable', 'string'],
            'expected_answer' => ['required', 'string', 'max:255'],
            'is_published' => ['required', 'boolean'],
            'time_start' => ['nullable', 'date'],
            'time_end' => ['nullable', 'date', 'after_or_equal:time_start'],
            'time_limit_seconds' => ['nullable', 'integer', 'min:5', 'max:300'],
            'questions_per_session' => ['nullable', 'integer', 'min:1', 'max:50'],
            'max_points_per_question' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
