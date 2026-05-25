<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\PublicPageCacheHeaders;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\SetLocale;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state', 'locale']);

        $middleware->alias([
            'permission' => PermissionMiddleware::class,
        ]);

        $middleware->web(prepend: [
            PublicPageCacheHeaders::class,
        ]);

        $middleware->web(append: [
            SecurityHeaders::class,
            SetLocale::class,
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
            if ($e instanceof AuthenticationException && $request->headers->has('X-Inertia')) {
                $authUrl = rtrim((string) config('app.urls.auth'), '/');
                $loginUrl = $authUrl !== '' ? $authUrl.'/login' : route('login');
                $targetHost = parse_url($loginUrl, PHP_URL_HOST);

                if (is_string($targetHost) && $targetHost !== $request->getHost()) {
                    return Inertia::location($loginUrl);
                }
            }

            // Tampilkan error asli Laravel di local/development untuk debugging
            if (app()->environment('local', 'development')) {
                return $response;
            }

            $status = $e instanceof HttpExceptionInterface
                ? $e->getStatusCode()
                : $response->getStatusCode();

            if (! app()->environment('testing') && in_array($status, [403, 404, 500, 503])) {
                return Inertia::render('error', [
                    'status' => $status,
                    'message' => match ($status) {
                        403 => 'You are not authorized to access this page.',
                        404 => 'The page you are looking for could not be found.',
                        500 => 'An unexpected error occurred. Please try again later.',
                        503 => 'We are currently performing maintenance. Please check back soon.',
                        default => 'An error occurred.',
                    },
                ])
                    ->toResponse($request)
                    ->setStatusCode($status);
            }

            return $response;
        });
    })->create();
