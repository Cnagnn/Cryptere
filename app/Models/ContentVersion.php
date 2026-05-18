<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

#[Fillable([
    'versionable_type',
    'versionable_id',
    'version_number',
    'content_snapshot',
    'changed_fields',
    'change_summary',
    'created_by',
    'restored_at',
])]
class ContentVersion extends Model
{
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'content_snapshot' => 'array',
            'changed_fields' => 'array',
            'restored_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    /**
     * Get the parent versionable model (Course, Lesson, LessonTask, Assessment).
     */
    public function versionable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the user who created this version.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Helpers ──

    /**
     * Restore this version to the parent model.
     */
    public function restore(): bool
    {
        $model = $this->versionable;

        if (! $model) {
            return false;
        }

        if (method_exists($model, 'disableVersioning')) {
            $model->disableVersioning();
        }

        $model->fill($this->content_snapshot);
        $result = $model->save();

        if (method_exists($model, 'enableVersioning')) {
            $model->enableVersioning();
        }

        return $result;
    }

    /**
     * Get the diff between this version and the current model state.
     *
     * @return array<string, array{old: mixed, new: mixed}>
     */
    public function diff(): array
    {
        $model = $this->versionable;

        if (! $model) {
            return [];
        }

        $diff = [];
        $snapshot = $this->content_snapshot;

        foreach ($snapshot as $key => $oldValue) {
            $newValue = $model->getAttribute($key);

            if ($oldValue !== $newValue) {
                $diff[$key] = [
                    'old' => $oldValue,
                    'new' => $newValue,
                ];
            }
        }

        return $diff;
    }
}
