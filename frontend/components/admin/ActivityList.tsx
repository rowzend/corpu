'use client';

import { Activity } from '@/lib/services';

interface ActivityListProps {
    activities: Activity[];
    isLoading?: boolean;
}

const typeColors = {
    success: 'bg-green-100 text-green-600',
    primary: 'bg-blue-100 text-blue-600',
    info: 'bg-cyan-100 text-cyan-600',
    warning: 'bg-yellow-100 text-yellow-600',
    danger: 'bg-red-100 text-red-600',
};

const typeIcons = {
    success: '✅',
    primary: 'ℹ️',
    info: '📋',
    warning: '⚠️',
    danger: '❌',
};

export default function ActivityList({ activities, isLoading }: ActivityListProps) {
    if (isLoading) {
        return (
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">
                    Recent Activities
                </h3>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-start space-x-4 animate-pulse">
                            <div className="w-10 h-10 bg-muted rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-muted rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-card-foreground">
                    Recent Activities
                </h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View All
                </button>
            </div>

            {activities.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-muted-foreground">No recent activities</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeColors[activity.type] || typeColors.primary
                                }`}>
                                <span className="text-lg">
                                    {typeIcons[activity.type] || typeIcons.primary}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-card-foreground">
                                    {activity.title}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {activity.description}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {new Date(activity.created_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}