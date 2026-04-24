<?php

namespace App\Concerns;

trait ExtractsLegacyTasks
{
    /**
     * Extract legacy task payloads from JSON lesson content.
     *
     * @return array<int, array{taskId: null, type: string, title: string, minutes: int, videoUrl: string|null, documentName: string|null, conversionStatus: string|null, pdfUrl: string|null, isPublished: bool, publishedAt: string|null, questions: array<int, mixed>, questionCount: int}>
     */
    private function extractLegacyTaskPayloads(string $content): array
    {
        if (trim($content) === '') {
            return [];
        }

        $decoded = json_decode($content, true);

        if (! is_array($decoded) || ! isset($decoded['tasks']) || ! is_array($decoded['tasks'])) {
            return [];
        }

        $allowedTypes = ['video', 'read', 'quiz'];
        $tasks = [];

        foreach ($decoded['tasks'] as $task) {
            if (! is_array($task)) {
                continue;
            }

            $type = isset($task['type']) && in_array($task['type'], $allowedTypes, true)
                ? $task['type']
                : null;

            $title = isset($task['title']) && is_string($task['title'])
                ? trim($task['title'])
                : '';

            $minutes = isset($task['minutes'])
                ? (int) $task['minutes']
                : 0;
            $videoUrl = isset($task['videoUrl']) && is_string($task['videoUrl'])
                ? $task['videoUrl']
                : null;
            $documentName = isset($task['documentName']) && is_string($task['documentName'])
                ? $task['documentName']
                : null;
            $conversionStatus = isset($task['conversionStatus']) && is_string($task['conversionStatus'])
                ? $task['conversionStatus']
                : null;
            $pdfUrl = isset($task['pdfUrl']) && is_string($task['pdfUrl'])
                ? $task['pdfUrl']
                : null;

            if ($type === null || $title === '') {
                continue;
            }

            $tasks[] = [
                'taskId' => null,
                'type' => $type,
                'title' => $title,
                'minutes' => max($minutes, 1),
                'videoUrl' => $videoUrl,
                'documentName' => $documentName,
                'conversionStatus' => $conversionStatus,
                'pdfUrl' => $pdfUrl,
                'isPublished' => false,
                'publishedAt' => null,
                'questions' => [],
                'questionCount' => 0,
            ];
        }

        return $tasks;
    }
}
