import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('app sidebar logout', () => {
    it('submits logout with a full form post instead of Inertia XHR', () => {
        const sidebar = readFileSync(
            resolve(process.cwd(), 'resources/js/components/app-sidebar.tsx'),
            'utf8',
        );

        expect(sidebar).not.toContain('router.post(urls.logout)');
        expect(sidebar).toContain("document.createElement('form')");
        expect(sidebar).toContain('meta[name="csrf-token"]');
    });
});

describe('app sidebar account links', () => {
    it('uses the profile settings route instead of the legacy tab query', () => {
        const sidebar = readFileSync(
            resolve(process.cwd(), 'resources/js/components/app-sidebar.tsx'),
            'utf8',
        );
        const sidebarHeader = readFileSync(
            resolve(
                process.cwd(),
                'resources/js/components/app-sidebar-header.tsx',
            ),
            'utf8',
        );

        expect(sidebar).toContain('profileSettings.url');
        expect(sidebarHeader).toContain('profileSettings.url');
        expect(sidebarHeader).not.toContain("tab: 'settings'");
        expect(sidebarHeader).not.toContain('Security Settings');
        expect(sidebarHeader).not.toContain('Appearance Settings');
        expect(sidebarHeader).not.toContain('Connected Accounts');
    });
});

describe('app sidebar mobile navigation', () => {
    it('closes the mobile sidebar when a navigation link is clicked', () => {
        const sidebar = readFileSync(
            resolve(process.cwd(), 'resources/js/components/app-sidebar.tsx'),
            'utf8',
        );

        expect(sidebar).toContain('setOpenMobile(false)');
        expect(sidebar).toContain('onClick={closeMobileSidebar}');
    });
});
