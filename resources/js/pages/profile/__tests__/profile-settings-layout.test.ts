import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string): string {
    return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('profile settings layout', () => {
    it('uses the shared dashboard tabs component for profile navigation', () => {
        const profileShell = readSource(
            'resources/js/features/profile/profile-shell.tsx',
        );

        expect(profileShell).toContain(
            "import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'",
        );
        expect(profileShell).toContain('<Tabs value={active}');
        expect(profileShell).toContain(
            '<TabsList aria-label="Profile sections">',
        );
        expect(profileShell).toContain('className="mb-6 flex justify-center"');
        expect(profileShell).toContain('<TabsTrigger value="profile">');
        expect(profileShell).toContain('<TabsTrigger value="settings">');
        expect(profileShell).not.toContain('border-b-2');
    });

    it('uses one-page settings sections without the old profile overview card', () => {
        const settingsPage = readSource(
            'resources/js/pages/profile/settings.tsx',
        );

        expect(settingsPage).not.toContain('ProfileOverviewCard');

        for (const section of [
            'profile',
            'avatar',
            'security',
            'connections',
            'appearance',
            'danger-zone',
        ]) {
            expect(settingsPage).toContain(`id="${section}"`);
            expect(settingsPage).toContain(`href: '#${section}'`);
        }
    });

    it('uses explicit public and private visibility choices', () => {
        const profileForm = readSource(
            'resources/js/features/settings/profile-settings-form.tsx',
        );

        expect(profileForm).not.toContain('<Select');
        expect(profileForm).toContain("setVisibility('public')");
        expect(profileForm).toContain("setVisibility('private')");
        expect(profileForm).toContain('Public profile');
        expect(profileForm).toContain('Private profile');
    });

    it('does not show inactive profile placeholder actions', () => {
        const profilePage = readSource('resources/js/pages/profile/show.tsx');
        const profileOverview = readSource(
            'resources/js/features/profile/profile-overview-card.tsx',
        );

        expect(profilePage).not.toContain('ProfileInterests');
        expect(profilePage).not.toContain('Add interests');
        expect(profileOverview).not.toContain('<Eye');
    });

    it('uses the approved developer-profile inspired layout', () => {
        const profilePage = readSource('resources/js/pages/profile/show.tsx');
        const profileOverview = readSource(
            'resources/js/features/profile/profile-overview-card.tsx',
        );

        expect(profilePage).toContain('className="grid gap-6 lg:grid-cols-12"');
        expect(profilePage).toContain('className="lg:col-span-4"');
        expect(profilePage).toContain('className="lg:col-span-8"');
        expect(profileOverview).toContain('<CardFooter');
        expect(profileOverview).not.toContain('aria-hidden="true"');
        expect(profileOverview).not.toContain('-mt-14');
        expect(profileOverview).not.toContain('bg-foreground text-background');
        expect(profileOverview).not.toContain('sticky top-24');
        expect(profilePage).toContain("from '@/components/ui/empty'");
        expect(profilePage).toContain(
            'className="-mt-14 flex flex-col items-center gap-4 text-center"',
        );
        expect(profilePage).not.toContain('rounded-none');
    });
});
