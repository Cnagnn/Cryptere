<?php

namespace App\Services;

use Illuminate\Support\Facades\Process;
use RuntimeException;

class DocumentConverterService
{
    /**
     * Convert a document to PDF using LibreOffice CLI.
     *
     * @param  string  $inputPath  Absolute path to the source document
     * @param  string  $outputDir  Absolute path to the output directory
     * @return string Absolute path to the generated PDF
     *
     * @throws RuntimeException If conversion fails or LibreOffice is not available
     */
    public function convertToPdf(string $inputPath, string $outputDir): string
    {
        $libreOfficeBinary = $this->resolveLibreOfficeBinary();

        $result = Process::timeout(120)->run([
            $libreOfficeBinary,
            '--headless',
            '--convert-to',
            'pdf',
            '--outdir',
            $outputDir,
            $inputPath,
        ]);

        if (! $result->successful()) {
            throw new RuntimeException(
                "Document conversion failed: {$result->errorOutput()}"
            );
        }

        $baseName = pathinfo($inputPath, PATHINFO_FILENAME);
        $pdfPath = rtrim($outputDir, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.$baseName.'.pdf';

        if (! file_exists($pdfPath)) {
            throw new RuntimeException(
                "PDF output not found at expected path: {$pdfPath}"
            );
        }

        return $pdfPath;
    }

    /**
     * Check whether LibreOffice is available on this system.
     */
    public function isAvailable(): bool
    {
        try {
            $this->resolveLibreOfficeBinary();

            return true;
        } catch (RuntimeException) {
            return false;
        }
    }

    /**
     * Resolve the LibreOffice binary path.
     *
     * @throws RuntimeException If LibreOffice is not found
     */
    private function resolveLibreOfficeBinary(): string
    {
        // Allow override via config/env
        $configured = config('services.libreoffice.binary');

        if (is_string($configured) && $configured !== '') {
            return $configured;
        }

        // Common binary names across platforms
        $candidates = PHP_OS_FAMILY === 'Windows'
            ? ['soffice.exe', 'C:\\Program Files\\LibreOffice\\program\\soffice.exe']
            : ['libreoffice', 'soffice', '/usr/bin/libreoffice'];

        foreach ($candidates as $candidate) {
            $result = Process::timeout(5)->run(
                PHP_OS_FAMILY === 'Windows'
                    ? ['where', $candidate]
                    : ['which', $candidate]
            );

            if ($result->successful()) {
                return trim($result->output()) ?: $candidate;
            }

            // Direct path check
            if (file_exists($candidate)) {
                return $candidate;
            }
        }

        throw new RuntimeException(
            'LibreOffice is not installed or not in PATH. Install LibreOffice or set LIBREOFFICE_BINARY in .env.'
        );
    }
}
