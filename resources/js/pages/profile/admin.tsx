/**
 * Legacy re-export � the canonical profile settings page now lives at
 * resources/js/pages/settings/profile.tsx and is rendered via
 * Inertia::render('settings/profile').
 *
 * This file is kept only for backward compatibility with any code that
 * may still reference the 'profile/admin' page name.
 */
export { default } from '@/pages/settings/profile';
