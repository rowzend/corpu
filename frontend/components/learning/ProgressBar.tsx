'use client';

interface ProgressBarProps {
    value: number;
    max?: number;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    color?: string;
}

export default function ProgressBar({ value, max = 100, showLabel = true, size = 'md', color }: ProgressBarProps) {
    const percentage = Math.min(Math.round((value / max) * 100), 100);

    const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
    const colors: Record<string, string> = {
        'blue': 'bg-blue-600',
        'green': 'bg-green-600',
        'yellow': 'bg-yellow-500',
        'red': 'bg-red-500',
        'purple': 'bg-purple-600',
    };

    const barColor = color ? (colors[color] || `bg-${color}-600`) : (
        percentage >= 80 ? 'bg-green-600' :
        percentage >= 50 ? 'bg-blue-600' :
        percentage >= 25 ? 'bg-yellow-500' : 'bg-gray-400'
    );

    return (
        <div className="w-full">
            <div className={`w-full bg-gray-200 rounded-full ${heights[size]}`}>
                <div
                    className={`${barColor} ${heights[size]} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <p className="text-xs text-gray-600 mt-1">{percentage}%</p>
            )}
        </div>
    );
}
