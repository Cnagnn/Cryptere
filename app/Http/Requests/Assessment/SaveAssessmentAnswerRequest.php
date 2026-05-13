<?php

namespace App\Http\Requests\Assessment;

use Illuminate\Foundation\Http\FormRequest;

class SaveAssessmentAnswerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'question_id' => ['required', 'integer', 'exists:assessment_questions,id'],
            'answer_text' => ['nullable', 'string', 'max:5000'],
            'selected_option' => ['nullable', 'string', 'max:500'],
        ];
    }
}
