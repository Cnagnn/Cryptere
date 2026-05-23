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

        if (! $this->isPublicLandingPage($request, $response)) {
            return $response;
        }

        $response->headers->remove('Set-Cookie');
        $response->headers->set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
        $response->headers->set('Cloudflare-CDN-Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');

        return $response;
    }

    private function isPublicLandingPage(Request $request, Response $response): bool
    {
        return $request->isMethodCacheable()
            && $request->getHost() === config('app.domains.public')
            && $request->path() === '/'
            && ! $request->headers->has('X-Inertia')
            && $response->isSuccessful();
    }
}
