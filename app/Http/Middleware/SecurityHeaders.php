<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

use function public_path;

class SecurityHeaders
{
    /**
     * Security headers applied to every web response.
     *
     * Uses nonce-based CSP to avoid unsafe-inline for scripts.
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
        Vite::useCspNonce($nonce);

        $response = $next($request);

        $scriptSrc = "script-src 'self' 'nonce-{$nonce}' https://*.sentry.io";
        $styleSrc = "style-src 'self' 'nonce-{$nonce}'";
        $styleSrcElem = "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com";
        $styleSrcAttr = "style-src-attr 'unsafe-inline'";
        $imgSrc = "img-src 'self' data: blob: https://deifkwefumgah.cloudfront.net";
        $fontSrc = "font-src 'self' data: https://fonts.gstatic.com";
        $connectSources = [
            "'self'",
            'https://*.sentry.io',
            'https://*.ingest.sentry.io',
            'https://*.pusher.com',
            'wss://*.pusher.com',
        ];

        $reverbHost = (string) config('reverb.apps.apps.0.options.host', '');
        $reverbPort = (int) config('reverb.apps.apps.0.options.port', 443);
        $reverbScheme = (string) config('reverb.apps.apps.0.options.scheme', 'https');

        if ($reverbHost !== '') {
            $httpScheme = $reverbScheme === 'https' ? 'https' : 'http';
            $wsScheme = $reverbScheme === 'https' ? 'wss' : 'ws';
            $portSuffix = in_array($reverbPort, [80, 443], true) ? '' : ":{$reverbPort}";

            $connectSources[] = "{$httpScheme}://{$reverbHost}{$portSuffix}";
            $connectSources[] = "{$wsScheme}://{$reverbHost}{$portSuffix}";
        }

        $connectSrc = 'connect-src '.implode(' ', array_unique($connectSources));

        if ($this->shouldAllowDevelopmentOrigins()) {
            $scriptSrc .= " 'unsafe-inline' 'unsafe-eval' http://localhost:5173 http://127.0.0.1:5173 http://[::1]:5173";
            $styleSrc .= " 'unsafe-inline' http://localhost:5173 http://127.0.0.1:5173 http://[::1]:5173";
            $styleSrcElem .= ' http://localhost:5173 http://127.0.0.1:5173 http://[::1]:5173';
            $connectSrc .= ' ws://localhost:5173 ws://127.0.0.1:5173 ws://[::1]:5173 http://localhost:5173 http://127.0.0.1:5173 http://[::1]:5173 ws://localhost:8080 http://localhost:8080';
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

    private function shouldAllowDevelopmentOrigins(): bool
    {
        if (app()->isProduction()) {
            return false;
        }

        return is_file(public_path('hot'));
    }
}
