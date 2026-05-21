<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderAdminTasksRequest;
use App\Http\Requests\Admin\StoreAdminLessonTaskRequest;
use App\Http\Requests\Admin\UpdateAdminLessonTaskRequest;
use App\Jobs\ConvertLessonDocument;
use App\Jobs\ConvertLessonVideo;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use App\Models\QuizSubmission;
use App\Models\TaskProgress;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TaskController extends Controller
{
    public function store(StoreAdminLessonTaskRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $lesson = Lesson::query()->findOrFail($validated['lesson_id']);
        $documentName = null;
        $conversionStatus = null;
        $pdfUrl = null;
        $pendingDocumentPath = null;
        $videoProcessingStatus = null;
        $videoUrl = $validated['type'] === 'video' ? ($validated['video_url'] ?? null) : null;

        // Handle video file upload
        if ($validated['type'] === 'video' && $request->hasFile('video_file')) {
            $path = $request->file('video_file')
                ->store('lesson-videos/originals', 'public');

            $videoUrl = Storage::disk('public')->url($path);
            $videoProcessingStatus = 'pending';
        } elseif ($validated['type'] === 'video' && ! empty($validated['video_url'])) {
            // External URLs (YouTube/Vimeo) or direct video URLs don't need processing
            $videoProcessingStatus = 'ready';
        }

        if ($validated['type'] === 'read') {
            $document = $this->storeReadDocument($request);
            $documentName = $document['document_name'];
            $conversionStatus = $document['conversion_status'];
            $pdfUrl = $document['pdf_url'];
            $pendingDocumentPath = $document['pending_document_path'];
        }

        $nextOrder = (int) LessonTask::query()->where('lesson_id', $lesson->id)->max('sort_order') + 1;

        $createdTask = DB::transaction(function () use ($validated, $lesson, $documentName, $conversionStatus, $pdfUrl, $nextOrder, $videoProcessingStatus, $videoUrl): LessonTask {
            $task = LessonTask::query()->create([
                'lesson_id' => $lesson->id,
                'title' => $validated['title'],
                'description' => $validated['description'],
                'type' => $validated['type'],
                'video_url' => $videoUrl,
                'video_processing_status' => $videoProcessingStatus,
                'video_mp4_url' => null,
                'document_name' => $documentName,
                'conversion_status' => $conversionStatus,
                'pdf_url' => $pdfUrl,
                'sort_order' => $nextOrder,
                'published_at' => null,
                'published_by' => null,
                'prerequisite_task_id' => $validated['prerequisite_task_id'] ?? null,
                'status' => $validated['status'] ?? 'draft',
                'version' => 1,
            ]);

            if ($validated['type'] === 'quiz') {
                collect($validated['quiz_questions'] ?? [])
                    ->values()
                    ->each(function (array $question, int $index) use ($task): void {
                        QuizQuestion::query()->create([
                            'lesson_task_id' => $task->id,
                            'question' => $question['question'],
                            'options' => $question['options'],
                            'correct_option' => (int) $question['correct_option'],
                            'explanation' => $question['explanation'] ?? null,
                            'sort_order' => $index + 1,
                        ]);
                    });
            }

            return $task;
        });

        if ($pendingDocumentPath !== null) {
            ConvertLessonDocument::dispatch($pendingDocumentPath, $createdTask->lesson_id);
        }

        if ($createdTask->type === 'video' && $createdTask->video_processing_status === 'pending') {
            ConvertLessonVideo::dispatch($createdTask->id);
        }

        app(AuditService::class)->log($request->user(), 'created', $createdTask);

        return back();
    }

    public function update(UpdateAdminLessonTaskRequest $request, LessonTask $task): RedirectResponse
    {
        $validated = $request->validated();
        $documentName = $task->document_name;
        $conversionStatus = $task->conversion_status;
        $pdfUrl = $task->pdf_url;
        $pendingDocumentPath = null;
        $videoProcessingStatus = $task->video_processing_status;
        $videoMp4Url = $task->video_mp4_url;
        $videoUrl = $validated['type'] === 'video' ? ($validated['video_url'] ?? $task->video_url) : null;

        if ($validated['type'] === 'read') {
            $document = $this->storeReadDocument($request);

            if ($document['document_name'] !== null) {
                $documentName = $document['document_name'];
                $conversionStatus = $document['conversion_status'];
                $pdfUrl = $document['pdf_url'];
                $pendingDocumentPath = $document['pending_document_path'];
            }
        } else {
            $documentName = null;
            $conversionStatus = null;
            $pdfUrl = null;
        }

        if ($validated['type'] === 'video') {
            // Handle video file upload
            if ($request->hasFile('video_file')) {
                $path = $request->file('video_file')
                    ->store('lesson-videos/originals', 'public');

                $videoUrl = Storage::disk('public')->url($path);
                $videoProcessingStatus = 'pending';
                $videoMp4Url = null;
            } elseif (! empty($validated['video_url']) && $validated['video_url'] !== $task->video_url) {
                // URL changed - external URLs don't need processing
                $videoUrl = $validated['video_url'];
                $videoProcessingStatus = 'ready';
                $videoMp4Url = null;
            }
            // If neither file nor new URL, keep existing values
        } else {
            $videoUrl = null;
            $videoProcessingStatus = null;
            $videoMp4Url = null;
        }

        DB::transaction(function () use ($task, $validated, $documentName, $conversionStatus, $pdfUrl, $videoProcessingStatus, $videoMp4Url, $videoUrl): void {
            $updateData = [
                'title' => $validated['title'],
                'description' => $validated['description'],
                'type' => $validated['type'],
                'video_url' => $videoUrl,
                'video_processing_status' => $videoProcessingStatus,
                'video_mp4_url' => $videoMp4Url,
                'document_name' => $documentName,
                'conversion_status' => $conversionStatus,
                'pdf_url' => $pdfUrl,
            ];

            if (isset($validated['prerequisite_task_id'])) {
                // Validate no circular dependency
                if ($this->wouldCreateCircularDependency($task, $validated['prerequisite_task_id'])) {
                    throw new \Exception('Circular dependency detected.');
                }
                $updateData['prerequisite_task_id'] = $validated['prerequisite_task_id'];
            }

            if (isset($validated['status'])) {
                $updateData['status'] = $validated['status'];
            }

            // Increment version on update
            $updateData['version'] = $task->version + 1;

            $task->update($updateData);

            $task->quizQuestions()->delete();

            if ($validated['type'] === 'quiz') {
                collect($validated['quiz_questions'] ?? [])
                    ->values()
                    ->each(function (array $question, int $index) use ($task): void {
                        QuizQuestion::query()->create([
                            'lesson_task_id' => $task->id,
                            'question' => $question['question'],
                            'options' => $question['options'],
                            'correct_option' => (int) $question['correct_option'],
                            'explanation' => $question['explanation'] ?? null,
                            'sort_order' => $index + 1,
                        ]);
                    });
            }
        });

        if ($pendingDocumentPath !== null) {
            ConvertLessonDocument::dispatch($pendingDocumentPath, $task->lesson_id);
        }

        if ($task->type === 'video' && $task->video_processing_status === 'pending') {
            ConvertLessonVideo::dispatch($task->id);
        }

        app(AuditService::class)->log($request->user(), 'updated', $task);

        return back();
    }

    public function videoStatus(LessonTask $task): JsonResponse
    {
        return response()->json([
            'status' => $task->video_processing_status,
            'videoUrl' => $task->video_mp4_url ?? $task->video_url,
            'isReady' => $task->video_processing_status === 'ready',
        ]);
    }

    public function reorder(ReorderAdminTasksRequest $request): RedirectResponse
    {
        $sourceId = $request->integer('source_id');
        $targetId = $request->integer('target_id');

        $source = LessonTask::findOrFail($sourceId);
        $target = LessonTask::findOrFail($targetId);

        DB::transaction(function () use ($source, $target): void {
            $sourceSortOrder = $source->sort_order;
            $targetSortOrder = $target->sort_order;

            if ($sourceSortOrder < $targetSortOrder) {
                LessonTask::whereBetween('sort_order', [$sourceSortOrder + 1, $targetSortOrder])
                    ->decrement('sort_order');
            } else {
                LessonTask::whereBetween('sort_order', [$targetSortOrder, $sourceSortOrder - 1])
                    ->increment('sort_order');
            }

            $source->update(['sort_order' => $targetSortOrder]);
        });

        return back();
    }

    public function destroy(LessonTask $task): RedirectResponse
    {
        $this->authorize('delete', $task->lesson->course);

        if (
            TaskProgress::query()->where('lesson_task_id', $task->id)->exists()
            || QuizSubmission::query()->where('lesson_task_id', $task->id)->exists()
        ) {
            return back()->withErrors([
                'task' => __('Archive this task instead. It already has learner history.'),
            ]);
        }

        app(AuditService::class)->log(request()->user(), 'deleted', $task);

        $task->delete();

        return back();
    }

    /**
     * Publish a task (set status to published).
     */
    public function publishTask(LessonTask $task): RedirectResponse
    {
        $task->update([
            'status' => 'published',
            'published_by' => request()->user()->id,
            'published_at' => now(),
        ]);

        app(AuditService::class)->log(request()->user(), 'published', $task);

        return back()->with('success', 'Task published.');
    }

    /**
     * Check if setting a prerequisite would create a circular dependency.
     */
    private function wouldCreateCircularDependency(LessonTask $task, ?int $prerequisiteId): bool
    {
        if ($prerequisiteId === null || $prerequisiteId === $task->id) {
            return false;
        }

        $visited = [];
        $current = $prerequisiteId;

        while ($current !== null) {
            if ($current === $task->id) {
                return true;
            }

            if (in_array($current, $visited)) {
                break;
            }

            $visited[] = $current;
            $prerequisite = LessonTask::find($current);
            $current = $prerequisite?->prerequisite_task_id;
        }

        return false;
    }

    /**
     * @return array{document_name: string|null, conversion_status: string|null, pdf_url: string|null, pending_document_path: string|null}
     */
    private function storeReadDocument(StoreAdminLessonTaskRequest|UpdateAdminLessonTaskRequest $request): array
    {
        $uploadedDocument = $request->file('document');

        if ($uploadedDocument === null) {
            return [
                'document_name' => null,
                'conversion_status' => null,
                'pdf_url' => null,
                'pending_document_path' => null,
            ];
        }

        $storedPath = $uploadedDocument->store('lesson-documents', 'public');
        $extension = strtolower(pathinfo($storedPath, PATHINFO_EXTENSION));

        if ($extension === 'pdf') {
            return [
                'document_name' => $uploadedDocument->getClientOriginalName(),
                'conversion_status' => 'converted',
                'pdf_url' => Storage::disk('public')->url($storedPath),
                'pending_document_path' => null,
            ];
        }

        return [
            'document_name' => $uploadedDocument->getClientOriginalName(),
            'conversion_status' => 'pending',
            'pdf_url' => null,
            'pending_document_path' => $storedPath,
        ];
    }
}
