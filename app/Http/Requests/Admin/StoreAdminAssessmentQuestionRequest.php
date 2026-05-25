<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class StoreAdminAssessmentQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can(User::PERMISSION_MANAGE_ASSESSMENT_QUESTIONS);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'bloom_level' => ['required', 'in:C1,C2,C3,C4,C5,C6'],
            'question_type' => ['required', 'in:mcq,multiple_select,true_false,matching,short_answer,essay'],
            'question_text' => ['required', 'string', 'max:5000'],
            'options' => ['nullable', 'array'],
            'options.*' => ['string', 'max:500'],
            'correct_answer' => ['nullable', 'string', 'max:2000'],
            'explanation' => ['nullable', 'string', 'max:2000'],
            'rubric' => ['nullable', 'array'],
            'points' => ['required', 'integer', 'min:1', 'max:100'],
            'grading_type' => ['nullable', 'in:auto'],
            'min_words' => ['nullable', 'integer', 'min:1'],
            'max_words' => ['nullable', 'integer', 'min:1'],
            'question_bank_id' => ['nullable', 'integer', 'exists:question_bank,id'],
        ];
    }

    protected function passedValidation(): void
    {
        $this->merge(['grading_type' => 'auto']);
    }
}
