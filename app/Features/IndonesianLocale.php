<?php

namespace App\Features;

/**
 * Controls whether Indonesian (Bahasa Indonesia) locale / i18n is enabled.
 *
 * When active, the application will offer Indonesian language support
 * and locale-specific formatting. This is a preparatory flag for R12
 * internationalization implementation.
 *
 * @see IMPLEMENTATION_PLAN.md R12: Internationalization
 */
class IndonesianLocale
{
    /**
     * Resolve the initial value of the feature.
     */
    public function resolve(mixed $scope): bool
    {
        return false; // Disabled by default — will be enabled when R12 is implemented
    }
}
