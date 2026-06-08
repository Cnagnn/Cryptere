<?php

namespace App\Http\Controllers;

use App\Services\Dashboard\AdminDashboardBuilder;
use App\Services\Dashboard\LearnerDashboardBuilder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Sentry\SentrySdk;
use Sentry\Tracing\SpanContext;

class DashboardController extends Controller
{
    public function __construct(
        private readonly AdminDashboardBuilder $adminBuilder,
        private readonly LearnerDashboardBuilder $learnerBuilder,
    ) {}

    /**
     * Show the dashboard — learner view for members, combined view for admins.
     *
     * Admins receive both admin analytics data AND learner data so the frontend
     * can render tabs allowing them to switch between "Home" and "Analytics".
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        \Log::info('DashboardController invoked', ['user_id' => $user?->id, 'can_access_admin' => $user?->canAccessAdmin()]);
        try {
            if ($user->canAccessAdmin()) {
                \Log::info('Rendering admin dashboard', ['user_id' => $user->id]);
                $result = $this->traceSpan('dashboard.admin', 'Admin dashboard render', fn () => Inertia::render('dashboard', array_merge(
                    $this->adminBuilder->build($request->string('period')->toString()),
                    $this->learnerBuilder->build($user),
                )));
                \Log::info('Admin dashboard rendered successfully', ['user_id' => $user->id]);

                return $result;
            }
            \Log::info('Rendering learner dashboard', ['user_id' => $user->id]);
            $result = $this->traceSpan('dashboard.learner', 'Learner dashboard render', fn () => Inertia::render('dashboard', $this->learnerBuilder->build($user)));
            \Log::info('Learner dashboard rendered successfully', ['user_id' => $user->id]);

            return $result;
        } catch (\Throwable $e) {
            \Log::error('Dashboard error', [
                'user_id' => $user?->id,
                'can_access_admin' => $user?->canAccessAdmin(),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Execute a callback within a Sentry performance span.
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    private function traceSpan(string $op, string $description, callable $callback): mixed
    {
        $parentSpan = SentrySdk::getCurrentHub()->getSpan();

        if ($parentSpan === null) {
            return $callback();
        }

        $context = new SpanContext;
        $context->setOp($op);
        $context->setDescription($description);

        $span = $parentSpan->startChild($context);
        SentrySdk::getCurrentHub()->setSpan($span);

        try {
            $result = $callback();
        } finally {
            $span->finish();
            SentrySdk::getCurrentHub()->setSpan($parentSpan);
        }

        return $result;
    }
}
