<?php

use App\Http\Controllers\Admin\ChallengeController as AdminChallengeController;
use App\Http\Controllers\Admin\ChallengeQuestionController as AdminChallengeQuestionController;
use App\Http\Controllers\Admin\CourseController as AdminCourseController;
use App\Http\Controllers\Admin\LessonController as AdminLessonController;
use App\Http\Controllers\Admin\TaskController as AdminTaskController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\Challenge\ChallengeController;
use App\Http\Controllers\Challenge\ChallengeSubmissionController;
use App\Http\Controllers\Course\CourseController;
use App\Http\Controllers\Course\EnrollmentController;
use App\Http\Controllers\Course\LessonProgressController;
use App\Http\Controllers\Course\QuizSubmissionController;
use App\Http\Controllers\DailyRewardController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HealthCheckController;
use App\Http\Controllers\Lab\LabController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\LearningPathController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\SearchController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

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

    // Quiz submission — returns JSON, not an Inertia redirect
    Route::post('courses/{course:slug}/lessons/{lesson}/quiz', [QuizSubmissionController::class, 'store'])
        ->middleware('throttle:quiz-submit')
        ->name('courses.lessons.quiz');

    Route::get('challenges', [ChallengeController::class, 'index'])->name('challenges.index');
    Route::get('challenges/{challenge:slug}', [ChallengeController::class, 'show'])->name('challenges.show');
    Route::post('challenges/{challenge:slug}/submit', [ChallengeSubmissionController::class, 'store'])
        ->middleware('throttle:challenge-submit')
        ->name('challenges.submit');
    Route::post('challenges/{challenge:slug}/quick-submit', [ChallengeSubmissionController::class, 'quickStore'])
        ->middleware('throttle:challenge-submit')
        ->name('challenges.quick-submit');
    Route::post('challenges/{challenge:slug}/quiz-submit', [ChallengeSubmissionController::class, 'quizSubmit'])
        ->middleware('throttle:challenge-submit')
        ->name('challenges.quiz-submit');
    Route::post('challenges/{challenge:slug}/session-summary', [ChallengeSubmissionController::class, 'sessionSummary'])
        ->middleware('throttle:challenge-submit')
        ->name('challenges.session-summary');

    Route::get('leaderboard', LeaderboardController::class)->name('leaderboard.index');
    Route::get('labs', LabController::class)->name('labs.index');
    Route::get('labs/{lab}', [LabController::class, 'show'])->name('labs.show');

    Route::get('search', SearchController::class)->middleware('throttle:30,1')->name('search');

    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');

    Route::get('daily-rewards', [DailyRewardController::class, 'index'])->name('daily-rewards.index');
    Route::post('daily-rewards/claim', [DailyRewardController::class, 'claim'])->middleware('throttle:5,1')->name('daily-rewards.claim');

    Route::get('learning-path', LearningPathController::class)->name('learning-path');

    Route::get('notes', [NoteController::class, 'index'])->name('notes.index');
    Route::post('notes', [NoteController::class, 'store'])->name('notes.store');
    Route::patch('notes/{note}', [NoteController::class, 'update'])->name('notes.update');
    Route::delete('notes/{note}', [NoteController::class, 'destroy'])->name('notes.destroy');
    Route::get('notes/export', [NoteController::class, 'export'])->name('notes.export');

    Route::get('analytics', AnalyticsController::class)->name('analytics');

    Route::get('onboarding', [OnboardingController::class, 'show'])->name('onboarding');
    Route::post('onboarding/complete', [OnboardingController::class, 'complete'])->name('onboarding.complete');
    Route::post('onboarding/skip', [OnboardingController::class, 'skip'])->name('onboarding.skip');

    Route::get('certificates', [CertificateController::class, 'index'])->name('certificates.index');
    Route::post('certificates', [CertificateController::class, 'store'])->name('certificates.store');
    Route::get('certificates/{certificate}', [CertificateController::class, 'show'])->name('certificates.show');

});

// Public certificate verification — no auth required
Route::get('verify/{code}', [CertificateController::class, 'verify'])->name('certificates.verify');

Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {
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

    // Challenges
    Route::get('challenges', [AdminChallengeController::class, 'index'])->name('challenges.index');
    Route::post('challenges', [AdminChallengeController::class, 'store'])->name('challenges.store');
    Route::post('challenges/reorder', [AdminChallengeController::class, 'reorder'])->name('challenges.reorder');
    Route::patch('challenges/{challenge}', [AdminChallengeController::class, 'update'])->name('challenges.update');
    Route::delete('challenges/{challenge}', [AdminChallengeController::class, 'destroy'])->name('challenges.destroy');

    // Challenge Questions
    Route::post('challenges/{challenge}/questions', [AdminChallengeQuestionController::class, 'store'])->name('challenges.questions.store');
    Route::patch('challenges/{challenge}/questions/{question}', [AdminChallengeQuestionController::class, 'update'])->name('challenges.questions.update');
    Route::delete('challenges/{challenge}/questions/{question}', [AdminChallengeQuestionController::class, 'destroy'])->name('challenges.questions.destroy');
    Route::post('challenges/{challenge}/questions/reorder', [AdminChallengeQuestionController::class, 'reorder'])->name('challenges.questions.reorder');
});

require __DIR__.'/settings.php';
