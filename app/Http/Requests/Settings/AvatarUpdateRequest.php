<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class AvatarUpdateRequest extends FormRequest
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
        $mimes = $this->user()?->canAccessAdmin() === true
            ? 'jpg,jpeg,png,webp'
            : 'jpg,jpeg,png';

        return [
            'avatar' => ['required', 'image', 'mimes:'.$mimes, 'max:2048'],
        ];
    }
}
