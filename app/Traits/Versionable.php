<?php

namespace App\Traits;

use App\Models\ContentVersion;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait Versionable
{
    /**
     * Boot the Versionable trait.
     */
    protected static function bootVersionable(): void
    {
        static::updating(function ($model) {
            // Auto-create version on update if model has changed
            if ($model->isDirty() && ! $model->isVersioningDisabled()) {
                $changedFields = array_keys($model->getDirty());
                $model->createVersion($changedFields, 'Auto-saved version');
            }
        });
    }

    /**
     * Get all versions for this model.
     */
    public function versions(): MorphMany
    {
        return $this->morphMany(ContentVersion::class, 'versionable')
            ->orderBy('version_number', 'desc');
    }

    /**
     * Get the latest version.
     */
    public function latestVersion(): ?ContentVersion
    {
        return $this->versions()->first();
    }

    /**
     * Create a new version snapshot.
     */
    public function createVersion(array $changedFields, string $summary): ContentVersion
    {
        $latestVersion = $this->latestVersion();
        $versionNumber = $latestVersion ? $latestVersion->version_number + 1 : 1;

        return $this->versions()->create([
            'version_number' => $versionNumber,
            'content_snapshot' => $this->getAttributes(),
            'changed_fields' => $changedFields,
            'change_summary' => $summary,
            'created_by' => auth()->id(),
        ]);
    }

    /**
     * Restore a specific version.
     */
    public function restoreVersion(int $versionNumber): bool
    {
        $version = $this->versions()
            ->where('version_number', $versionNumber)
            ->first();

        if (! $version) {
            return false;
        }

        // Disable versioning during restore to avoid creating a new version
        $this->disableVersioning();

        $this->fill($version->content_snapshot);
        $result = $this->save();

        $this->enableVersioning();

        // Mark version as restored
        $version->update(['restored_at' => now()]);

        return $result;
    }

    /**
     * Disable automatic versioning.
     */
    public function disableVersioning(): void
    {
        $this->versioningDisabled = true;
    }

    /**
     * Enable automatic versioning.
     */
    public function enableVersioning(): void
    {
        $this->versioningDisabled = false;
    }

    /**
     * Check if versioning is disabled.
     */
    public function isVersioningDisabled(): bool
    {
        return $this->versioningDisabled ?? false;
    }
}
