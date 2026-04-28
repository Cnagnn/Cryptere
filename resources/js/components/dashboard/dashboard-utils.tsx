import {
    Award,
    BookOpen,
    ClipboardCheck,
    FlaskConical,
    GraduationCap,
    Link2,
    Shield,
    Swords,
    UserCheck,
} from 'lucide-react';

/* ── EvilCharts-style custom bar shape (gradient fade) ── */
export function GradientBar(
    props: React.SVGProps<SVGRectElement> & {
        dataKey?: string;
        prefix?: string;
    },
) {
    const {
        fill,
        x,
        y,
        width,
        height,
        dataKey,
        prefix = 'gradient-bar',
    } = props;
    const id = `${prefix}-${dataKey}`;

    return (
        <>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                stroke="none"
                fill={`url(#${id})`}
            />
            <rect
                x={x}
                y={y}
                width={width}
                height={2}
                stroke="none"
                fill={fill}
            />
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={fill} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={fill} stopOpacity={0} />
                </linearGradient>
            </defs>
        </>
    );
}

export function initials(fullName: string): string {
    const names = fullName.trim().split(' ');

    if (names.length <= 1) {
        return (names[0]?.charAt(0) ?? '').toUpperCase();
    }

    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
}

export function formatNumber(n: number): string {
    if (n >= 1000) {
        return `${(n / 1000).toFixed(1)}k`;
    }

    return String(n);
}

export function getTimeGreeting(name: string): {
    text: string;
    emoji: string;
    subtitle: string;
} {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
        return {
            text: `Good morning, ${name}`,
            emoji: '☀️',
            subtitle: 'Ready to learn something new today?',
        };
    }

    if (hour >= 12 && hour < 17) {
        return {
            text: `Good afternoon, ${name}`,
            emoji: '👋',
            subtitle: 'Keep the momentum going!',
        };
    }

    if (hour >= 17 && hour < 21) {
        return {
            text: `Good evening, ${name}`,
            emoji: '🌆',
            subtitle: 'Wind down with a quick lesson?',
        };
    }

    return {
        text: `Good night, ${name}`,
        emoji: '🌙',
        subtitle: 'A little late-night learning?',
    };
}

export const ACTIVITY_TAG_CONFIG: Record<
    string,
    { icon: typeof BookOpen; label: string }
> = {
    Lesson: { icon: BookOpen, label: 'Lesson' },
    Challenge: { icon: Swords, label: 'Challenge' },
    Course: { icon: GraduationCap, label: 'Course' },
    Badge: { icon: Award, label: 'Badge' },
    Quiz: { icon: ClipboardCheck, label: 'Quiz' },
    Lab: { icon: FlaskConical, label: 'Lab' },
    Account: { icon: UserCheck, label: 'Account' },
    Security: { icon: Shield, label: 'Security' },
    Social: { icon: Link2, label: 'Social' },
};

export const DEFAULT_ACTIVITY_TAG = ACTIVITY_TAG_CONFIG.Lesson;
