<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Supported locales.
     *
     * @var list<string>
     */
    private const SUPPORTED = ['en', 'id'];

    /**
     * Set the application locale from cookie or Accept-Language header.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->cookie('locale')
            ?? $this->parseAcceptLanguage($request->header('Accept-Language', 'en'));

        $locale = in_array($locale, self::SUPPORTED, true) ? $locale : 'en';

        app()->setLocale($locale);

        return $next($request);
    }

    /**
     * Extract the primary language tag from the Accept-Language header.
     */
    private function parseAcceptLanguage(string $header): string
    {
        // Take the first language tag (e.g., "id-ID,id;q=0.9,en;q=0.8" → "id")
        $primary = explode(',', $header)[0];

        return strtolower(explode('-', trim($primary))[0]);
    }
}
