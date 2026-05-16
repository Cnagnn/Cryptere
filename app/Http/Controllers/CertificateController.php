<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\Enrollment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CertificateController extends Controller
{
    /**
     * List all certificates for the authenticated user.
     */
    public function index(Request $request): Response
    {
        $certificates = $request->user()
            ->certificates()
            ->with('course:id,title,slug,category,estimated_minutes')
            ->orderByDesc('issued_at')
            ->get()
            ->map(fn (Certificate $cert) => [
                'id' => $cert->id,
                'certificate_number' => $cert->certificate_number,
                'issued_at' => $cert->issued_at->toISOString(),
                'course' => [
                    'title' => $cert->course->title,
                    'slug' => $cert->course->slug,
                    'category' => $cert->course->category,
                    'estimated_minutes' => $cert->course->estimated_minutes,
                ],
                'verification_url' => route('certificates.verify', $cert->verification_code),
            ]);

        return Inertia::render('certificates/index', [
            'certificates' => $certificates,
        ]);
    }

    /**
     * Generate a certificate for a completed course.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
        ]);

        $user = $request->user();
        $courseId = $validated['course_id'];

        // Check enrollment is completed
        $hasCompletedEnrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->whereNotNull('completed_at')
            ->exists();

        if (! $hasCompletedEnrollment) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'You must complete the course before generating a certificate.',
            ]);
        }

        // Check if certificate already exists
        $certificateExists = Certificate::where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->exists();

        if ($certificateExists) {
            return back()->with('toast', [
                'type' => 'info',
                'message' => 'You already have a certificate for this course.',
            ]);
        }

        $certificate = Certificate::create([
            'user_id' => $user->id,
            'course_id' => $courseId,
            'certificate_number' => Certificate::generateCertificateNumber(),
            'verification_code' => Certificate::generateVerificationCode(),
            'issued_at' => now(),
        ]);

        return redirect()->route('certificates.show', $certificate)
            ->with('toast', [
                'type' => 'success',
                'message' => 'Certificate generated successfully! 🎓',
            ]);
    }

    /**
     * Show a specific certificate.
     */
    public function show(Request $request, Certificate $certificate): Response
    {
        // Only the owner can view their certificate detail page
        if ($certificate->user_id !== $request->user()->id) {
            abort(403);
        }

        $certificate->load('course:id,title,slug,category,estimated_minutes', 'user:id,name,username');

        return Inertia::render('certificates/show', [
            'certificate' => [
                'id' => $certificate->id,
                'certificate_number' => $certificate->certificate_number,
                'verification_code' => $certificate->verification_code,
                'issued_at' => $certificate->issued_at->toISOString(),
                'course' => [
                    'title' => $certificate->course->title,
                    'slug' => $certificate->course->slug,
                    'category' => $certificate->course->category,
                    'estimated_minutes' => $certificate->course->estimated_minutes,
                ],
                'user' => [
                    'name' => $certificate->user->name,
                    'username' => $certificate->user->username,
                ],
                'verification_url' => route('certificates.verify', $certificate->verification_code),
            ],
        ]);
    }

    /**
     * Public verification page — no auth required.
     */
    public function verify(string $code): Response|RedirectResponse
    {
        $certificate = Certificate::with('course:id,title,slug,category', 'user:id,name,username')
            ->where('verification_code', $code)
            ->first();

        if (! $certificate) {
            return Inertia::render('certificates/verify', [
                'valid' => false,
                'certificate' => null,
            ]);
        }

        return Inertia::render('certificates/verify', [
            'valid' => true,
            'certificate' => [
                'certificate_number' => $certificate->certificate_number,
                'issued_at' => $certificate->issued_at->toISOString(),
                'course_title' => $certificate->course->title,
                'user_name' => $certificate->user->name,
            ],
        ]);
    }
}
