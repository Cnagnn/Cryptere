<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class HealthCheckController extends Controller
{
    /**
     * Application health check endpoint.
     *
     * Returns status of DB, cache, and storage subsystems.
     */
    public function __invoke(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'cache' => $this->checkCache(),
            'storage' => $this->checkStorage(),
        ];

        $healthy = collect($checks)->every(fn (array $check): bool => $check['status'] === 'ok');

        return response()->json([
            'status' => $healthy ? 'healthy' : 'degraded',
            'checks' => $checks,
            'timestamp' => now()->toIso8601String(),
        ], $healthy ? 200 : 503);
    }

    private function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo();
            $latency = $this->measureMs(fn () => DB::selectOne('SELECT 1'));

            return ['status' => 'ok', 'latency_ms' => $latency];
        } catch (\Throwable $e) {
            return ['status' => 'error', 'message' => 'Database connection failed'];
        }
    }

    private function checkCache(): array
    {
        try {
            $key = 'health_check_'.uniqid();
            Cache::put($key, 'ok', 10);
            $value = Cache::get($key);
            Cache::forget($key);

            return $value === 'ok'
                ? ['status' => 'ok']
                : ['status' => 'error', 'message' => 'Cache read/write mismatch'];
        } catch (\Throwable $e) {
            return ['status' => 'error', 'message' => 'Cache unavailable'];
        }
    }

    private function checkStorage(): array
    {
        try {
            $disk = Storage::disk('local');
            $testFile = 'health_check_'.uniqid().'.tmp';
            $disk->put($testFile, 'ok');
            $content = $disk->get($testFile);
            $disk->delete($testFile);

            return $content === 'ok'
                ? ['status' => 'ok']
                : ['status' => 'error', 'message' => 'Storage read/write mismatch'];
        } catch (\Throwable $e) {
            return ['status' => 'error', 'message' => 'Storage unavailable'];
        }
    }

    private function measureMs(callable $fn): float
    {
        $start = microtime(true);
        $fn();

        return round((microtime(true) - $start) * 1000, 2);
    }
}
