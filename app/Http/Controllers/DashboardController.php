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
     * Show the dashboard — learner view for members, analytics view for admins.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return $this->traceSpan('dashboard.admin', 'Admin dashboard render', fn () => Inertia::render('dashboard', $this->adminBuilder->build()),
            );
        }

        return $this->traceSpan('dashboard.learner', 'Learner dashboard render', fn () => Inertia::render('dashboard', $this->learnerBuilder->build($user)),
        );
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
