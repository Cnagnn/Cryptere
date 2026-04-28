<?php

namespace Database\Seeders;

/**
 * Provides substantive lesson content, learning objectives, and key concepts
 * for the ComprehensiveSeeder. Content is loaded from individual course files
 * in the content/ directory.
 */
class LessonContentProvider
{
    private static ?array $cache = null;

    /**
     * Get content data for a lesson by slug.
     *
     * @return array{content: string, learning_objectives: list<string>, key_concepts: list<string>}|null
     */
    public static function get(string $slug): ?array
    {
        return self::all()[$slug] ?? null;
    }

    /**
     * @return array<string, array{content: string, learning_objectives: list<string>, key_concepts: list<string>}>
     */
    public static function all(): array
    {
        if (self::$cache !== null) {
            return self::$cache;
        }

        $contentDir = __DIR__.'/content';

        self::$cache = array_merge(
            require $contentDir.'/course1-crypto-foundations.php',
            require $contentDir.'/course2-classical-ciphers.php',
            require $contentDir.'/course3-modern-crypto.php',
            require $contentDir.'/course4-blockchain-crypto.php',
            require $contentDir.'/course5-network-security.php',
            require $contentDir.'/course6-post-quantum.php',
        );

        return self::$cache;
    }
}
