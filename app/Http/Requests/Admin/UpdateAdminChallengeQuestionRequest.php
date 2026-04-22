<?php

namespace App\Http\Requests\Admin;

use App\Models\ChallengeQuestion;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAdminChallengeQuestionRequest extends FormRequest
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
            'type' => ['required', 'string', Rule::in(ChallengeQuestion::TYPES)],
            'question' => ['required', 'string', 'max:1000'],
            'options' => ['nullable', 'array', 'min:2', 'max:6'],
            'options.*' => ['required', 'string', 'max:500'],
            'correct_answer' => ['required', 'string', 'max:500'],
            'explanation' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
