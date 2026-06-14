<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PublicPageCacheHeaders
{
    /**
     * Apply edge-cache friendly headers to the public landing page only.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Belt-and-braces: any 5xx on the public landing path must NEVER be
        // cached by the LiteSpeed edge or Cloudflare. Without this guard a
        // transient origin error gets pinned for s-maxage seconds and the
        // homepage stays "down" long after the underlying issue clears.
        if ($this->isPublicLandingPath($request) && $response->getStatusCode() >= 500) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            $response->headers->set('CDN-Cache-Control', 'no-store');
            $response->headers->set('Cloudflare-CDN-Cache-Control', 'no-store');

            return $response;
        }

        if (! $this->isPublicLandingPage($request, $response)) {
            return $response;
        }

        $response->headers->remove('Set-Cookie');
        $response->headers->set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
        $response->headers->set('Cloudflare-CDN-Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');

        return $response;
    }

    private function isPublicLandingPath(Request $request): bool
    {
        return $request->isMethodCacheable()
            && $request->getHost() === config('app.domains.public')
            && $request->path() === '/';
    }

    private function isPublicLandingPage(Request $request, Response $response): bool
    {
        return $this->isPublicLandingPath($request)
            && ! $request->headers->has('X-Inertia')
            && $response->isSuccessful();
    }
}
