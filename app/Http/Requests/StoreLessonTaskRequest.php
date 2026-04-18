<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreLessonTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdmin();
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:video,read,quiz'],
            'video_url' => [
                'required_if:type,video',
                'nullable',
                'url',
                'max:2048',
            ],
            'document' => [
                'required_if:type,read',
                'nullable',
                'file',
                'mimes:pdf',
                'max:20480',
            ],
        ];
    }
}
