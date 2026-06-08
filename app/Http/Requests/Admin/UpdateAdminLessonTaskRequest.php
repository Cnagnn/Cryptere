<?php

namespace App\Http\Requests\Admin;

use App\Models\LessonTask;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateAdminLessonTaskRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return (bool) $this->user()?->can(User::PERMISSION_MANAGE_TASKS);
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
            'description' => ['required', 'string', 'max:5000'],
            'type' => ['required', Rule::in(['video', 'read', 'quiz'])],
            'video_url' => [
                'nullable',
                'url',
                'max:2048',
                Rule::requiredIf(fn (): bool => $this->input('type') === 'video'),
            ],
            'video_file' => [
                'prohibited',
            ],
            'document' => [
                'nullable',
                'file',
                'max:20480',
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
                $prerequisiteTaskId = $this->input('prerequisite_task_id');

                if ($prerequisiteTaskId === null || $prerequisiteTaskId === '') {
                    return;
                }

                $task = $this->route('task');
                if (! $task instanceof LessonTask) {
                    return;
                }

                $existsInLesson = LessonTask::query()
                    ->whereKey((int) $prerequisiteTaskId)
                    ->where('lesson_id', $task->lesson_id)
                    ->exists();

                if (! $existsInLesson) {
                    $validator->errors()->add('prerequisite_task_id', __('The prerequisite task must belong to the same lesson.'));
                }
            },
        ];
    }
}
