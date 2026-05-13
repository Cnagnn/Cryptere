<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreAdminAssessmentQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'bloom_level' => ['required', 'in:C1,C2,C3,C4,C5,C6'],
            'question_type' => ['required', 'in:mcq,true_false,short_answer,essay,computation,case_study,design'],
            'question_text' => ['required', 'string', 'max:5000'],
            'options' => ['nullable', 'array'],
            'options.*' => ['string', 'max:500'],
            'correct_answer' => ['nullable', 'string', 'max:2000'],
            'explanation' => ['nullable', 'string', 'max:2000'],
            'rubric' => ['nullable', 'array'],
            'points' => ['required', 'integer', 'min:1', 'max:100'],
            'grading_type' => ['required', 'in:auto,manual'],
            'min_words' => ['nullable', 'integer', 'min:1'],
            'max_words' => ['nullable', 'integer', 'min:1'],
            'question_bank_id' => ['nullable', 'integer', 'exists:question_banks,id'],
        ];
    }
}
