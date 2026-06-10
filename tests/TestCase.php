<?php

namespace Tests;

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->disableCsrfMiddleware();
    }

    protected function refreshApplication(): void
    {
        parent::refreshApplication();

        $this->disableCsrfMiddleware();
    }

    private function disableCsrfMiddleware(): void
    {
        if ($this->app->environment('testing')) {
            $this->withoutMiddleware(ValidateCsrfToken::class);
        }
    }
}
