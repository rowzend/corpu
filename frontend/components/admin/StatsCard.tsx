'use client';

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: string;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

const colorClasses = {
    blue: 'bg-blue-500 text-blue-600 bg-blue-50',
    green: 'bg-green-500 text-green-600 bg-green-50',
    yellow: 'bg-yellow-500 text-yellow-600 bg-yellow-50',
    red: 'bg-red-500 text-red-600 bg-red-50',
    purple: 'bg-purple-500 text-purple-600 bg-purple-50',
};

export default function StatsCard({
    title,
    value,
    icon,
    color = 'blue',
    trend
}: StatsCardProps) {
    const [bgColor, textColor, lightBg] = colorClasses[color].split(' ');

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                        {title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                    {trend && (
                        <div className="flex items-center mt-2">
                            <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                                vs last month
                            </span>
                        </div>
                    )}
                </div>
                <div className={`w-12 h-12 ${lightBg} rounded-lg flex items-center justify-center`}>
                    <span className="text-2xl">{icon}</span>
                </div>
            </div>
        </div>
    );
}