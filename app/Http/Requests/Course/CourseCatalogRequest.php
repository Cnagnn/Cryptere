<?php

namespace App\Http\Requests\Course;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CourseCatalogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'enrollment' => ['nullable', Rule::in(['all', 'enrolled', 'not-enrolled'])],
            'sort' => ['nullable', Rule::in(['title', 'progress', 'newest'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:4', 'max:24'],
        ];
    }

    /**
     * @return array{search: string, enrollment: string, sort: string, per_page: int}
     */
    public function catalogFilters(): array
    {
        $validated = $this->validated();

        return [
            'search' => trim((string) ($validated['search'] ?? '')),
            'enrollment' => (string) ($validated['enrollment'] ?? 'all'),
            'sort' => (string) ($validated['sort'] ?? 'title'),
            'per_page' => (int) ($validated['per_page'] ?? 12),
        ];
    }
}
