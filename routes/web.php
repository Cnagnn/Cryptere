<?php

use App\Http\Controllers\Admin\AssessmentController as AdminAssessmentController;
use App\Http\Controllers\Admin\AssessmentQuestionController as AdminAssessmentQuestionController;
use App\Http\Controllers\Admin\ContentVersionController;
use App\Http\Controllers\Admin\CourseController as AdminCourseController;
use App\Http\Controllers\Admin\LessonController as AdminLessonController;
use App\Http\Controllers\Admin\QuestionBankController;
use App\Http\Controllers\Admin\TaskController as AdminTaskController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Assessment\AssessmentSubmissionController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\Course\CourseController;
use App\Http\Controllers\Course\DocumentController;
use App\Http\Controllers\Course\EnrollmentController;
use App\Http\Controllers\Course\LessonProgressController;
use App\Http\Controllers\Course\QuizSubmissionController;
use App\Http\Controllers\Course\TaskHeartbeatController;
use App\Http\Controllers\DailyRewardController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HealthCheckController;
use App\Http\Controllers\Lab\LabController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\LearningPathController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\SystemStatsController;
use App\Models\Assessment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::post('locale', function (Request $request) {
    $locale = $request->validate(['locale' => 'required|in:en,id'])['locale'];

    return back()->withCookie(cookie('locale', $locale, 60 * 24 * 365));
})->name('locale.switch');

Route::get('/health', HealthCheckController::class)->name('health');

Route::get('/auth/{provider}/redirect', [SocialAuthController::class, 'redirect'])->name('social.redirect');
Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'callback'])->name('social.callback');

// Username availability check — rate limited to prevent enumeration attacks
Route::middleware('throttle:10,1')->get('/api/users/check-username', function (Request $request) {
    $username = $request->string('username')->trim()->toString();

    if ($username === '') {
        return response()->json(['available' => false]);
    }

    $exists = User::where('username', $username)->exists();

    // Consistent timing to prevent enumeration via response time analysis
    usleep(random_int(50_000, 100_000));

    return response()->json(['available' => ! $exists]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('courses', [CourseController::class, 'index'])->name('courses.index');
    Route::get('courses/{course:slug}', [CourseController::class, 'show'])->name('courses.show');
    Route::post('courses/{course:slug}/enroll', [EnrollmentController::class, 'store'])->middleware('throttle:enrollment')->name('courses.enroll');
    Route::post('courses/{course:slug}/reset', [EnrollmentController::class, 'reset'])->middleware('throttle:enrollment')->name('courses.reset');
    Route::post('courses/{course:slug}/lessons/{lesson}/complete', [LessonProgressController::class, 'store'])
        ->middleware('throttle:lesson-complete')
        ->name('courses.lessons.complete');

    // Serve lesson documents inline (prevents IDM interception)
    Route::get('courses/documents/{task}', [DocumentController::class, 'show'])
        ->name('courses.documents.show');

    // Anti-cheat heartbeat — accumulates watch/reading time
    Route::post('courses/{course:slug}/lessons/{lesson}/heartbeat', [TaskHeartbeatController::class, 'store'])
        ->middleware('throttle:heartbeat')
        ->name('courses.lessons.heartbeat');

    // Quiz submission — returns JSON, not an Inertia redirect
    Route::post('courses/{course:slug}/lessons/{lesson}/quiz', [QuizSubmissionController::class, 'store'])
        ->middleware('throttle:quiz-submit')
        ->name('courses.lessons.quiz');

    // Assessments — all UI now embedded in course detail page
    // Redirects for old bookmarks / links
    Route::get('assessments', fn () => redirect()->route('courses.index'))->name('assessments.index');
    Route::get('assessments/mastery', fn () => redirect()->route('courses.index'))->name('assessments.mastery');
    Route::get('assessments/{assessment:slug}', function (Assessment $assessment) {
        if ($assessment->course) {
            return redirect()->route('courses.show', $assessment->course->slug);
        }
        abort(404);
    })->name('assessments.show');
    Route::get('assessments/{assessment:slug}/results/{submission}', function (Assessment $assessment) {
        if ($assessment->course) {
            return redirect()->route('courses.show', $assessment->course->slug);
        }
        abort(404);
    })->name('assessments.results');

    // Assessment API endpoints (used by embedded assessment panel)
    Route::post('assessments/{assessment:slug}/start', [AssessmentSubmissionController::class, 'start'])
        ->middleware('throttle:10,1')
        ->name('assessments.start');
    Route::post('assessments/{assessment:slug}/save-answer', [AssessmentSubmissionController::class, 'saveAnswer'])
        ->middleware('throttle:60,1')
        ->name('assessments.save-answer');
    Route::post('assessments/{assessment:slug}/submit', [AssessmentSubmissionController::class, 'submit'])
        ->middleware('throttle:10,1')
        ->name('assessments.submit');

    Route::get('leaderboard', LeaderboardController::class)->name('leaderboard.index');
    Route::get('labs', LabController::class)->name('labs.index');
    Route::get('labs/{lab}', [LabController::class, 'show'])->name('labs.show');

    Route::get('search', SearchController::class)->middleware('throttle:30,1')->name('search');

    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');

    Route::get('daily-rewards', [DailyRewardController::class, 'index'])->name('daily-rewards.index');
    Route::post('daily-rewards/claim', [DailyRewardController::class, 'claim'])->middleware('throttle:daily-reward')->name('daily-rewards.claim');

    Route::get('learning-path', LearningPathController::class)->name('learning-path');

    Route::get('notes', [NoteController::class, 'index'])->name('notes.index');
    Route::post('notes', [NoteController::class, 'store'])->name('notes.store');
    Route::patch('notes/{note}', [NoteController::class, 'update'])->name('notes.update');
    Route::delete('notes/{note}', [NoteController::class, 'destroy'])->name('notes.destroy');
    Route::get('notes/export', [NoteController::class, 'export'])->name('notes.export');

    Route::get('onboarding', [OnboardingController::class, 'show'])->name('onboarding');
    Route::post('onboarding/complete', [OnboardingController::class, 'complete'])->name('onboarding.complete');
    Route::post('onboarding/skip', [OnboardingController::class, 'skip'])->name('onboarding.skip');

    Route::get('certificates', [CertificateController::class, 'index'])->name('certificates.index');
    Route::post('certificates', [CertificateController::class, 'store'])->name('certificates.store');
    Route::get('certificates/{certificate}', [CertificateController::class, 'show'])->name('certificates.show');

    // Story and CTF removed
});

// Public certificate verification — no auth required
Route::get('verify/{code}', [CertificateController::class, 'verify'])->name('certificates.verify');

Route::middleware(['auth', 'verified', 'admin', 'throttle:60,1'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('users', [AdminUserController::class, 'index'])->name('users.index');
    Route::patch('users/{user}', [AdminUserController::class, 'update'])->name('users.update');
    Route::delete('users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');
    // Courses
    Route::get('courses', [AdminCourseController::class, 'index'])->name('courses.index');
    Route::post('courses', [AdminCourseController::class, 'store'])->name('courses.store');
    Route::post('courses/reorder', [AdminCourseController::class, 'reorder'])->name('courses.reorder');
    Route::patch('courses/{course}', [AdminCourseController::class, 'update'])->name('courses.update');
    Route::delete('courses/{course}', [AdminCourseController::class, 'destroy'])->name('courses.destroy');
    Route::patch('courses/{course}/toggle-publish', [AdminCourseController::class, 'togglePublish'])->name('courses.toggle-publish');

    // Lessons
    Route::post('courses/lessons', [AdminLessonController::class, 'store'])->name('courses.lessons.store');
    Route::post('courses/lessons/reorder', [AdminLessonController::class, 'reorder'])->name('courses.lessons.reorder');
    Route::patch('courses/lessons/{lesson}', [AdminLessonController::class, 'update'])->name('courses.lessons.update');
    Route::delete('courses/lessons/{lesson}', [AdminLessonController::class, 'destroy'])->name('courses.lessons.destroy');

    // Tasks
    Route::post('courses/tasks', [AdminTaskController::class, 'store'])->name('courses.tasks.store');
    Route::post('courses/tasks/reorder', [AdminTaskController::class, 'reorder'])->name('courses.tasks.reorder');
    Route::patch('courses/tasks/{task}', [AdminTaskController::class, 'update'])->name('courses.tasks.update');
    Route::delete('courses/tasks/{task}', [AdminTaskController::class, 'destroy'])->name('courses.tasks.destroy');
    Route::get('courses/tasks/{task}/video-status', [AdminTaskController::class, 'videoStatus'])->name('courses.tasks.video-status');

    // Assessments (Bloom's Taxonomy tiered) — listing now served via CourseController section=assessment
    Route::get('assessments', fn () => redirect()->route('admin.courses.index', ['section' => 'assessment']))->name('assessments.index');
    Route::post('assessments', [AdminAssessmentController::class, 'store'])->name('assessments.store');
    Route::post('assessments/reorder', [AdminAssessmentController::class, 'reorder'])->name('assessments.reorder');
    Route::patch('assessments/{assessment}', [AdminAssessmentController::class, 'update'])->name('assessments.update');
    Route::delete('assessments/{assessment}', [AdminAssessmentController::class, 'destroy'])->name('assessments.destroy');
    Route::patch('assessments/{assessment}/toggle-publish', [AdminAssessmentController::class, 'togglePublish'])->name('assessments.toggle-publish');

    // Assessment Questions
    Route::post('assessments/{assessment}/questions', [AdminAssessmentQuestionController::class, 'store'])->name('assessments.questions.store');
    Route::patch('assessments/{assessment}/questions/{question}', [AdminAssessmentQuestionController::class, 'update'])->name('assessments.questions.update');
    Route::delete('assessments/{assessment}/questions/{question}', [AdminAssessmentQuestionController::class, 'destroy'])->name('assessments.questions.destroy');
    Route::post('assessments/{assessment}/questions/reorder', [AdminAssessmentQuestionController::class, 'reorder'])->name('assessments.questions.reorder');

    // Question Bank
    Route::get('question-bank', [QuestionBankController::class, 'index'])->name('question-bank.index');
    Route::post('question-bank', [QuestionBankController::class, 'store'])->name('question-bank.store');
    Route::patch('question-bank/{questionBank}', [QuestionBankController::class, 'update'])->name('question-bank.update');
    Route::delete('question-bank/{questionBank}', [QuestionBankController::class, 'destroy'])->name('question-bank.destroy');
    Route::post('question-bank/{questionBank}/duplicate', [QuestionBankController::class, 'duplicate'])->name('question-bank.duplicate');
    Route::post('question-bank/bulk-import', [QuestionBankController::class, 'bulkImport'])->name('question-bank.bulk-import');
    Route::get('question-bank/{questionBank}/usage-stats', [QuestionBankController::class, 'usageStats'])->name('question-bank.usage-stats');

    // Content Versions
    Route::get('versions/{versionableType}/{versionableId}', [ContentVersionController::class, 'index'])->name('versions.index');
    Route::get('versions/{version}', [ContentVersionController::class, 'show'])->name('versions.show');
    Route::post('versions/{version}/restore', [ContentVersionController::class, 'restore'])->name('versions.restore');
    Route::get('versions/{version}/compare/{compareVersion}', [ContentVersionController::class, 'compare'])->name('versions.compare');

    // Publish/Archive Actions
    Route::post('courses/{course}/publish', [AdminCourseController::class, 'publishCourse'])->name('courses.publish');
    Route::post('courses/{course}/archive', [AdminCourseController::class, 'archiveCourse'])->name('courses.archive');
    Route::post('lessons/{lesson}/publish', [AdminLessonController::class, 'publishLesson'])->name('lessons.publish');
    Route::post('tasks/{task}/publish', [AdminTaskController::class, 'publishTask'])->name('tasks.publish');
    Route::post('assessments/{assessment}/publish', [AdminAssessmentController::class, 'publishAssessment'])->name('assessments.publish');
    Route::post('assessments/{assessment}/archive', [AdminAssessmentController::class, 'archiveAssessment'])->name('assessments.archive');

    // System Stats API
    Route::get('system-stats', SystemStatsController::class)->name('system-stats');
});

require __DIR__.'/settings.php';

// Profile pages — defined after settings.php so /profile/admin is matched first
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('profile', [ProfileController::class, 'showOwn'])->name('profile.show.own');
    Route::get('profile/{user:username}', [ProfileController::class, 'show'])->name('profile.show');
});
