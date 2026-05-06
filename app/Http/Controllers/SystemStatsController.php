<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\File;

class SystemStatsController extends Controller
{
    public function __invoke(): JsonResponse
    {
        // Get CPU usage
        $cpuPercent = $this->getCpuUsage();

        // Get memory usage
        $memoryTotal = $this->getMemoryTotal();
        $memoryUsed = $this->getMemoryUsed();
        $memoryPercent = $memoryTotal > 0
            ? round(($memoryUsed / $memoryTotal) * 100, 1)
            : 0;

        // Get disk usage
        $diskPath = PHP_OS_FAMILY === 'Windows' ? 'C:' : '/';
        $diskTotal = disk_total_space($diskPath);
        $diskFree = disk_free_space($diskPath);
        $diskUsed = $diskTotal - $diskFree;
        $diskPercent = $diskTotal > 0
            ? round(($diskUsed / $diskTotal) * 100, 1)
            : 0;

        return response()->json([
            'cpu' => $cpuPercent,
            'ram' => $memoryPercent,
            'storage' => $diskPercent,
            'details' => [
                'cpu' => [
                    'current' => $cpuPercent,
                ],
                'memory' => [
                    'used' => $this->formatBytes($memoryUsed),
                    'total' => $this->formatBytes($memoryTotal),
                    'percent' => $memoryPercent,
                ],
                'disk' => [
                    'used' => $this->formatBytes($diskUsed),
                    'total' => $this->formatBytes($diskTotal),
                    'free' => $this->formatBytes($diskFree),
                    'percent' => $diskPercent,
                ],
            ],
        ]);
    }

    private function getCpuUsage(): float
    {
        if (PHP_OS_FAMILY === 'Windows') {
            // Windows: use PowerShell Get-CimInstance
            $output = shell_exec('powershell -Command "Get-CimInstance -ClassName Win32_Processor | Select-Object -ExpandProperty LoadPercentage"');

            return $output ? (float) trim($output) : 0;
        } else {
            // Linux: use sys_getloadavg
            if (function_exists('sys_getloadavg')) {
                $load = sys_getloadavg();
                $cpuCount = $this->getCpuCount();

                return $cpuCount > 0 ? round(($load[0] / $cpuCount) * 100, 1) : 0;
            }
        }

        return 0;
    }

    private function getCpuCount(): int
    {
        if (PHP_OS_FAMILY === 'Windows') {
            $output = shell_exec('powershell -Command "(Get-CimInstance -ClassName Win32_ComputerSystem).NumberOfLogicalProcessors"');

            return $output ? (int) trim($output) : 1;
        } else {
            return (int) shell_exec('nproc') ?: 1;
        }
    }

    private function getMemoryTotal(): int
    {
        if (PHP_OS_FAMILY === 'Windows') {
            // Windows: use PowerShell Get-CimInstance
            $output = shell_exec('powershell -Command "Get-CimInstance -ClassName Win32_OperatingSystem | Select-Object -ExpandProperty TotalVisibleMemorySize"');
            if ($output) {
                return (int) trim($output) * 1024; // Convert KB to bytes
            }
        } else {
            // Linux: read from /proc/meminfo
            if (File::exists('/proc/meminfo')) {
                $meminfo = File::get('/proc/meminfo');
                if (preg_match('/MemTotal:\s+(\d+)/', $meminfo, $matches)) {
                    return (int) $matches[1] * 1024; // Convert KB to bytes
                }
            }
        }

        return 0;
    }

    private function getMemoryUsed(): int
    {
        if (PHP_OS_FAMILY === 'Windows') {
            // Windows: use PowerShell Get-CimInstance
            $output = shell_exec('powershell -Command "Get-CimInstance -ClassName Win32_OperatingSystem | Select-Object -ExpandProperty FreePhysicalMemory"');
            if ($output) {
                $free = (int) trim($output) * 1024;
                $total = $this->getMemoryTotal();

                return $total - $free;
            }
        } else {
            // Linux: read from /proc/meminfo
            if (File::exists('/proc/meminfo')) {
                $meminfo = File::get('/proc/meminfo');
                $total = 0;
                $available = 0;

                if (preg_match('/MemTotal:\s+(\d+)/', $meminfo, $matches)) {
                    $total = (int) $matches[1] * 1024;
                }
                if (preg_match('/MemAvailable:\s+(\d+)/', $meminfo, $matches)) {
                    $available = (int) $matches[1] * 1024;
                }

                return $total - $available;
            }
        }

        return 0;
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));

        return round($bytes, 2).' '.$units[$pow];
    }
}
