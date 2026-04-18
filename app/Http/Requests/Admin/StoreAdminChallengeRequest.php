<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAdminChallengeRequest extends FormRequest
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
            'difficulty' => ['required', 'string', Rule::in(['beginner', 'intermediate', 'advanced'])],
            'expected_answer' => ['required', 'string', 'max:255'],
            'points_reward' => ['required', 'integer', 'min:1'],
            'is_published' => ['required', 'boolean'],
            'time_start' => ['nullable', 'date'],
            'time_end' => ['nullable', 'date', 'after_or_equal:time_start'],
        ];
    }
}
