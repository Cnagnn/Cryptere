<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContentVersion;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ContentVersionController extends Controller
{
    /**
     * List versions for a versionable entity.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'versionable_type' => ['required', 'string', 'in:Course,Lesson,LessonTask,Assessment'],
            'versionable_id' => ['required', 'integer'],
        ]);

        $versionableType = 'App\\Models\\'.$validated['versionable_type'];
        $versionableId = $validated['versionable_id'];

        $versions = ContentVersion::query()
            ->where('versionable_type', $versionableType)
            ->where('versionable_id', $versionableId)
            ->with('creator:id,name')
            ->orderByDesc('version_number')
            ->paginate(20);

        // Load the current entity
        $entity = $versionableType::find($versionableId);

        return Inertia::render('admin/content-versions/index', [
            'versions' => $versions,
            'entity' => $entity,
            'versionable_type' => $validated['versionable_type'],
            'versionable_id' => $versionableId,
        ]);
    }

    /**
     * Show a specific version.
     */
    public function show(ContentVersion $contentVersion): Response
    {
        $contentVersion->load('creator:id,name', 'versionable');

        return Inertia::render('admin/content-versions/show', [
            'version' => $contentVersion,
            'diff' => $contentVersion->diff(),
        ]);
    }

    /**
     * Restore to a specific version.
     */
    public function restore(Request $request, ContentVersion $contentVersion): RedirectResponse
    {
        DB::beginTransaction();
        try {
            $model = $contentVersion->versionable;

            if (! $model) {
                return back()->withErrors(['error' => 'Entity not found.']);
            }

            // Create a new version snapshot before restoring
            $currentSnapshot = $model->only(array_keys($contentVersion->content_snapshot));

            ContentVersion::create([
                'versionable_type' => get_class($model),
                'versionable_id' => $model->id,
                'version_number' => $model->version + 1,
                'content_snapshot' => $currentSnapshot,
                'changed_fields' => array_keys($currentSnapshot),
                'change_summary' => 'Pre-restore snapshot',
                'created_by' => $request->user()->id,
            ]);

            // Restore the version
            $success = $contentVersion->restore();

            if (! $success) {
                DB::rollBack();

                return back()->withErrors(['error' => 'Failed to restore version.']);
            }

            // Increment version number
            $model->increment('version');

            app(AuditService::class)->log($request->user(), 'restored_version', $model, [
                'version_number' => $contentVersion->version_number,
            ]);

            DB::commit();

            return back()->with('success', "Restored to version {$contentVersion->version_number}.");
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Restore failed: '.$e->getMessage()]);
        }
    }

    /**
     * Compare two versions.
     */
    public function compare(Request $request): Response
    {
        $validated = $request->validate([
            'version_a_id' => ['required', 'integer', 'exists:content_versions,id'],
            'version_b_id' => ['required', 'integer', 'exists:content_versions,id'],
        ]);

        $versionA = ContentVersion::with('creator:id,name')->findOrFail($validated['version_a_id']);
        $versionB = ContentVersion::with('creator:id,name')->findOrFail($validated['version_b_id']);

        // Ensure both versions are for the same entity
        if ($versionA->versionable_type !== $versionB->versionable_type ||
            $versionA->versionable_id !== $versionB->versionable_id) {
            abort(400, 'Versions must be for the same entity.');
        }

        // Calculate diff between the two snapshots
        $diff = [];
        $allKeys = array_unique(array_merge(
            array_keys($versionA->content_snapshot),
            array_keys($versionB->content_snapshot)
        ));

        foreach ($allKeys as $key) {
            $valueA = $versionA->content_snapshot[$key] ?? null;
            $valueB = $versionB->content_snapshot[$key] ?? null;

            if ($valueA !== $valueB) {
                $diff[$key] = [
                    'version_a' => $valueA,
                    'version_b' => $valueB,
                ];
            }
        }

        return Inertia::render('admin/content-versions/compare', [
            'version_a' => $versionA,
            'version_b' => $versionB,
            'diff' => $diff,
        ]);
    }
}
