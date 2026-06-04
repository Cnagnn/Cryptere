import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string): string {
    return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('profile settings layout', () => {
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
});
