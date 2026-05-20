<?php

namespace App\Http\Requests\Admin;

use App\Models\LessonTask;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'description' => ['required', 'string', 'max:5000'],
            'type' => ['required', Rule::in(['video', 'read', 'quiz'])],
            'video_url' => [
                'nullable',
                'url',
                'max:2048',
                Rule::requiredIf(fn (): bool => $this->input('type') === 'video' && ! $this->hasFile('video_file')),
            ],
            'video_file' => [
                'nullable',
                'file',
                'mimetypes:video/mp4,video/webm,video/quicktime,video/x-msvideo',
                'max:512000', // 500MB max
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
            'prerequisite_task_id' => ['nullable', 'integer', 'exists:lesson_tasks,id'],
            'status' => ['nullable', 'string', 'in:draft,published,archived'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $lessonId = (int) $this->input('lesson_id');
                $prerequisiteTaskId = $this->input('prerequisite_task_id');

                if ($prerequisiteTaskId === null || $prerequisiteTaskId === '') {
                    return;
                }

                $existsInLesson = LessonTask::query()
                    ->whereKey((int) $prerequisiteTaskId)
                    ->where('lesson_id', $lessonId)
                    ->exists();

                if (! $existsInLesson) {
                    $validator->errors()->add('prerequisite_task_id', __('The prerequisite task must belong to the selected lesson.'));
                }
            },
        ];
    }
}
