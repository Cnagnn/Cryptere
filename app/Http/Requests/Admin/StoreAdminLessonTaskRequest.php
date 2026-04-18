<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAdminLessonTaskRequest extends FormRequest
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
            'lesson_id' => ['required', 'integer', 'exists:lessons,id'],
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['video', 'read', 'quiz'])],
            'minutes' => ['required', 'integer', 'min:1', 'max:240'],
            'video_url' => [
                'nullable',
                'url',
                'max:2048',
                Rule::requiredIf(fn (): bool => $this->input('type') === 'video'),
            ],
            'document' => [
                'nullable',
                'file',
                'max:20480',
                Rule::requiredIf(fn (): bool => $this->input('type') === 'read'),
            ],
            'quiz_questions' => [
                Rule::requiredIf(fn (): bool => $this->input('type') === 'quiz'),
                'array',
                'min:1',
            ],
            'quiz_questions.*.question' => ['required', 'string', 'max:1000'],
            'quiz_questions.*.options' => ['required', 'array', 'size:4'],
            'quiz_questions.*.options.*' => ['required', 'string', 'max:255'],
            'quiz_questions.*.correct_option' => ['required', 'integer', 'min:0', 'max:3'],
            'quiz_questions.*.explanation' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
