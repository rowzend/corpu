'use client';

import { SystemStatus as SystemStatusType } from '@/lib/services';

interface SystemStatusProps {
    status: SystemStatusType | null;
    isLoading?: boolean;
}

const statusColors = {
    online: 'bg-green-100 text-green-600',
    offline: 'bg-red-100 text-red-600',
    disconnected: 'bg-yellow-100 text-yellow-600',
};

const statusIcons = {
    online: '✅',
    offline: '❌',
    disconnected: '⚠️',
};

export default function SystemStatus({ status, isLoading }: SystemStatusProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    System Status
                </h3>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-6 bg-gray-200 rounded w-16"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!status) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    System Status
                </h3>
                <div className="text-center py-4">
                    <p className="text-gray-500">Unable to load system status</p>
                </div>
            </div>
        );
    }

    const getOverallColor = () => {
        switch (status.overall) {
            case 'healthy': return 'text-green-600';
            case 'degraded': return 'text-yellow-600';
            case 'unhealthy': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    System Status
                </h3>
                <span className={`text-sm font-medium ${getOverallColor()}`}>
                    {status.overall.charAt(0).toUpperCase() + status.overall.slice(1)}
                </span>
            </div>

            <div className="space-y-4">
                {/* Database Status */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <span className="text-lg">🗄️</span>
                        <span className="text-sm font-medium text-gray-700">Database</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status.database.status as keyof typeof statusColors] || statusColors.offline
                        }`}>
                        <span className="mr-1">
                            {statusIcons[status.database.status as keyof typeof statusIcons] || statusIcons.offline}
                        </span>
                        {status.database.status}
                    </div>
                </div>

                {/* Cache Status */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <span className="text-lg">⚡</span>
                        <span className="text-sm font-medium text-gray-700">Cache</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status.cache.status as keyof typeof statusColors] || statusColors.offline
                        }`}>
                        <span className="mr-1">
                            {statusIcons[status.cache.status as keyof typeof statusIcons] || statusIcons.offline}
                        </span>
                        {status.cache.status}
                    </div>
                </div>

                {/* SIASN Status */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <span className="text-lg">🌐</span>
                        <span className="text-sm font-medium text-gray-700">SIASN API</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status.siasn.status as keyof typeof statusColors] || statusColors.disconnected
                        }`}>
                        <span className="mr-1">
                            {statusIcons[status.siasn.status as keyof typeof statusIcons] || statusIcons.disconnected}
                        </span>
                        {status.siasn.status}
                    </div>
                </div>
            </div>

            {/* Last Updated */}
            <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                    Last updated: {new Date().toLocaleTimeString()}
                </p>
            </div>
        </div>
    );
}