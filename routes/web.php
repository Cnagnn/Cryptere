<?php

use App\Http\Controllers\Admin\ChallengeManagementController;
use App\Http\Controllers\Admin\CourseManagementController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\ChallengeController;
use App\Http\Controllers\ChallengeSubmissionController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\LabsController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\LessonProgressController;
use App\Http\Controllers\QuizSubmissionController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::get('/auth/{provider}/redirect', [SocialAuthController::class, 'redirect'])->name('social.redirect');
Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'callback'])->name('social.callback');

// Username availability check — rate limited to prevent enumeration attacks
Route::middleware('throttle:30,1')->get('/api/users/check-username', function (Request $request) {
    $username = $request->string('username')->trim()->toString();

    if ($username === '') {
        return response()->json(['available' => false]);
    }

    $exists = User::where('username', $username)->exists();

    return response()->json(['available' => ! $exists]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('courses', [CourseController::class, 'index'])->name('courses.index');
    Route::get('courses/{course:slug}', [CourseController::class, 'show'])->name('courses.show');
    Route::post('courses/{course:slug}/enroll', [EnrollmentController::class, 'store'])->name('courses.enroll');
    Route::post('courses/{course:slug}/reset', [EnrollmentController::class, 'reset'])->name('courses.reset');
    Route::post('courses/{course:slug}/lessons/{lesson}/complete', [LessonProgressController::class, 'store'])
        ->name('courses.lessons.complete');

    // Quiz submission — returns JSON, not an Inertia redirect
    Route::post('courses/{course:slug}/lessons/{lesson}/quiz', [QuizSubmissionController::class, 'store'])
        ->name('courses.lessons.quiz');

    Route::get('challenges', [ChallengeController::class, 'index'])->name('challenges.index');
    Route::get('challenges/{challenge:slug}', [ChallengeController::class, 'show'])->name('challenges.show');
    Route::post('challenges/{challenge:slug}/submit', [ChallengeSubmissionController::class, 'store'])
        ->name('challenges.submit');
    Route::post('challenges/{challenge:slug}/quick-submit', [ChallengeSubmissionController::class, 'quickStore'])
        ->name('challenges.quick-submit');
    Route::post('challenges/{challenge:slug}/quiz-submit', [ChallengeSubmissionController::class, 'quizSubmit'])
        ->name('challenges.quiz-submit');
    Route::post('challenges/{challenge:slug}/session-summary', [ChallengeSubmissionController::class, 'sessionSummary'])
        ->name('challenges.session-summary');

    Route::get('leaderboard', LeaderboardController::class)->name('leaderboard.index');
    Route::get('labs', LabsController::class)->name('labs.index');
    Route::get('labs/{lab}', [LabsController::class, 'show'])->name('labs.show');
});

Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('users', [UserManagementController::class, 'index'])->name('users.index');
    Route::patch('users/{user}', [UserManagementController::class, 'update'])->name('users.update');
    Route::delete('users/{user}', [UserManagementController::class, 'destroy'])->name('users.destroy');
    Route::get('courses', [CourseManagementController::class, 'index'])->name('courses.index');
    Route::post('courses', [CourseManagementController::class, 'store'])->name('courses.store');
    Route::post('courses/reorder', [CourseManagementController::class, 'reorderCourses'])->name('courses.reorder');
    Route::patch('courses/{course}', [CourseManagementController::class, 'update'])->name('courses.update');
    Route::delete('courses/{course}', [CourseManagementController::class, 'destroy'])->name('courses.destroy');
    Route::post('courses/lessons', [CourseManagementController::class, 'storeLesson'])->name('courses.lessons.store');
    Route::post('courses/lessons/reorder', [CourseManagementController::class, 'reorderLessons'])->name('courses.lessons.reorder');
    Route::patch('courses/lessons/{lesson}', [CourseManagementController::class, 'updateLesson'])->name('courses.lessons.update');
    Route::delete('courses/lessons/{lesson}', [CourseManagementController::class, 'destroyLesson'])->name('courses.lessons.destroy');
    Route::patch('courses/{course}/toggle-publish', [CourseManagementController::class, 'togglePublish'])->name('courses.toggle-publish');
    Route::post('courses/tasks', [CourseManagementController::class, 'storeTask'])->name('courses.tasks.store');
    Route::post('courses/tasks/reorder', [CourseManagementController::class, 'reorderTasks'])->name('courses.tasks.reorder');
    Route::patch('courses/tasks/{task}', [CourseManagementController::class, 'updateTask'])->name('courses.tasks.update');
    Route::delete('courses/tasks/{task}', [CourseManagementController::class, 'destroyTask'])->name('courses.tasks.destroy');
    Route::get('challenges', [ChallengeManagementController::class, 'index'])->name('challenges.index');
    Route::post('challenges', [ChallengeManagementController::class, 'store'])->name('challenges.store');
    Route::post('challenges/reorder', [ChallengeManagementController::class, 'reorder'])->name('challenges.reorder');
    Route::patch('challenges/{challenge}', [ChallengeManagementController::class, 'update'])->name('challenges.update');
    Route::delete('challenges/{challenge}', [ChallengeManagementController::class, 'destroy'])->name('challenges.destroy');
    Route::post('challenges/{challenge}/questions', [ChallengeManagementController::class, 'storeQuestion'])->name('challenges.questions.store');
    Route::patch('challenges/{challenge}/questions/{question}', [ChallengeManagementController::class, 'updateQuestion'])->name('challenges.questions.update');
    Route::delete('challenges/{challenge}/questions/{question}', [ChallengeManagementController::class, 'destroyQuestion'])->name('challenges.questions.destroy');
    Route::post('challenges/{challenge}/questions/reorder', [ChallengeManagementController::class, 'reorderQuestions'])->name('challenges.questions.reorder');
});

require __DIR__.'/settings.php';
