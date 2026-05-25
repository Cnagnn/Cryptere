<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class StoreAdminAssessmentRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'topic_id' => ['nullable', 'integer', 'exists:topics,id'],
            'bloom_level' => ['required', 'in:C1,C2,C3,C4,C5,C6'],
            'grading_type' => ['nullable', 'in:auto'],
            'passing_score' => ['required', 'integer', 'min:1', 'max:100'],
            'max_attempts' => ['required', 'integer', 'min:1', 'max:10'],
            'time_limit_minutes' => ['nullable', 'integer', 'min:1', 'max:480'],
            'status' => ['nullable', 'string', 'in:draft,published,archived'],
            'available_from' => ['nullable', 'date'],
            'available_until' => ['nullable', 'date', 'after:available_from'],
        ];
    }

    protected function passedValidation(): void
    {
        $this->merge(['grading_type' => 'auto']);
    }
}
