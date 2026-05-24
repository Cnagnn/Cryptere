<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Security headers applied to every web response.
     *
     * Uses nonce-based CSP to avoid unsafe-inline for scripts and style blocks.
     * The nonce is generated per-request and shared via request attributes
     * so Blade templates and Vite can use it.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Generate a cryptographically secure nonce for this request
        $nonce = base64_encode(random_bytes(16));
        $request->attributes->set('csp-nonce', $nonce);

        $response = $next($request);

        $scriptSrc = "script-src 'self' 'nonce-{$nonce}' https://*.sentry.io";
        $styleSrc = "style-src 'self' 'nonce-{$nonce}'";
        $styleSrcElem = "style-src-elem 'self' 'nonce-{$nonce}' 'unsafe-inline' https://fonts.googleapis.com";
        $styleSrcAttr = "style-src-attr 'unsafe-inline'";
        $imgSrc = "img-src 'self' data: blob:";
        $fontSrc = "font-src 'self' data: https://fonts.gstatic.com";
        $connectSrc = "connect-src 'self' https://*.sentry.io https://*.ingest.sentry.io";

        if (app()->environment('local', 'testing', 'development')) {
            $scriptSrc .= " 'unsafe-inline' 'unsafe-eval' http://localhost:5173 http://127.0.0.1:5173 http://[::1]:5173";
            $styleSrc .= " 'unsafe-inline' http://localhost:5173 http://127.0.0.1:5173 http://[::1]:5173";
            $styleSrcElem .= ' http://localhost:5173 http://127.0.0.1:5173 http://[::1]:5173';
            $connectSrc .= ' ws://localhost:5173 ws://127.0.0.1:5173 ws://[::1]:5173 http://localhost:5173 http://127.0.0.1:5173 http://[::1]:5173';
            $imgSrc .= ' http://localhost:5173 http://127.0.0.1:5173 http://[::1]:5173';
        }

        $csp = implode('; ', [
            "default-src 'self'",
            $scriptSrc,
            $styleSrc,
            $styleSrcElem,
            $styleSrcAttr,
            $imgSrc,
            $fontSrc,
            $connectSrc,
            "object-src 'none'",
            "frame-ancestors 'none'",
        ]);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $response->headers->set('Content-Security-Policy', $csp);

        if (app()->isProduction()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
