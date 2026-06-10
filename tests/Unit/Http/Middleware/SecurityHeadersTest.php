<?php

use App\Http\Middleware\SecurityHeaders;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

test('production security policy does not allow localhost development origins', function (): void {
    $originalEnv = $this->app['env'];
    $this->app['env'] = 'production';

    try {
        $middleware = new SecurityHeaders;
        $request = Request::create('https://cryptere.com/', 'GET');

        $response = $middleware->handle($request, fn (Request $request): Response => new Response('ok', 200));
    } finally {
        $this->app['env'] = $originalEnv;
    }

    $policy = (string) $response->headers->get('Content-Security-Policy');

    expect($policy)
        ->not->toContain('http://localhost:5173')
        ->not->toContain('http://127.0.0.1:5173')
        ->not->toContain('http://[::1]:5173')
        ->not->toContain('ws://localhost:5173')
        ->not->toContain('ws://127.0.0.1:5173')
        ->not->toContain('ws://[::1]:5173')
        ->not->toContain('http://localhost:8080')
        ->not->toContain('ws://localhost:8080');
});
