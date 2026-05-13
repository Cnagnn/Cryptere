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
            $uploadedDocument = $request->file('document');
            if ($uploadedDocument !== null) {
                $storedPath = $uploadedDocument->store('lesson-documents', 'public');
                $documentName = $uploadedDocument->getClientOriginalName();
                $conversionStatus = 'pending';

                // Dispatch the PDF conversion job
                ConvertLessonDocument::dispatch($storedPath, $lesson->id);
            }
        }

        $nextOrder = (int) LessonTask::query()->where('lesson_id', $lesson->id)->max('sort_order') + 1;

        $createdTask = DB::transaction(function () use ($validated, $lesson, $documentName, $conversionStatus, $nextOrder, $videoProcessingStatus, $videoUrl): LessonTask {
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
                'pdf_url' => null,
                'sort_order' => $nextOrder,
                'published_at' => null,
                'published_by' => null,
                'estimated_minutes' => $validated['estimated_minutes'] ?? null,
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
        $videoProcessingStatus = $task->video_processing_status;
        $videoMp4Url = $task->video_mp4_url;
        $videoUrl = $validated['type'] === 'video' ? ($validated['video_url'] ?? $task->video_url) : null;

        if ($validated['type'] === 'read') {
            $uploadedDocument = $request->file('document');
            if ($uploadedDocument !== null) {
                $storedPath = $uploadedDocument->store('lesson-documents', 'public');
                $documentName = $uploadedDocument->getClientOriginalName();
                $conversionStatus = 'pending';
                $pdfUrl = null;

                // Dispatch the PDF conversion job
                ConvertLessonDocument::dispatch($storedPath, $task->lesson_id);
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

            if (isset($validated['estimated_minutes'])) {
                $updateData['estimated_minutes'] = $validated['estimated_minutes'];
            }

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
        $items = collect($request->validated('items'));

        DB::transaction(function () use ($items): void {
            $items->each(function (array $item): void {
                LessonTask::query()
                    ->whereKey((int) $item['id'])
                    ->update(['sort_order' => (int) $item['sort_order'] + 1000]);
            });

            $items->each(function (array $item): void {
                LessonTask::query()
                    ->whereKey((int) $item['id'])
                    ->update(['sort_order' => (int) $item['sort_order']]);
            });
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
}
