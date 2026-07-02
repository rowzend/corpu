'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, Users, UserPlus, ShieldCheck, Activity } from 'lucide-react';
import UserTable from '@/components/admin/UserTable';
import UserForm from '@/components/admin/UserForm';
import {
    userService,
    type User,
    type CreateUserData,
    type UpdateUserData,
    type UserListParams
} from '@/lib/services';
import { showSuccess, showError, showDeleteConfirm, showLoading, closeLoading } from '@/lib/sweetalert';
import { useThemeColors } from '@/lib/hooks/useThemeColors';

export default function UsersPage() {
    const t = useTranslations('admin.users');
    const { card, text } = useThemeColors();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [filters, setFilters] = useState<UserListParams>({
        page: 1,
        page_size: 20,
        search: '',
    });
    const [pagination, setPagination] = useState({
        page: 1,
        page_size: 20,
        total: 0,
        total_pages: 0,
    });

    useEffect(() => {
        loadUsers();
    }, [filters]);

    const loadUsers = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await userService.getUsers(filters);
            setUsers(response.data);
            setPagination(response.pagination);
        } catch (err) {
            console.error('Failed to load users:', err);
            setError(t('error_desc'));
            showError(t('error_desc'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (searchTerm: string) => {
        setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
    };

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    const handleCreateUser = () => {
        setEditingUser(null);
        setShowForm(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setShowForm(true);
    };

    const handleDeleteUser = async (user: User) => {
        const confirmed = await showDeleteConfirm(user.name, t('delete_confirm_item'));
        if (!confirmed) return;

        try {
            showLoading(t('delete_loading'));
            await userService.deleteUser(user.id);
            await loadUsers();
            closeLoading();
            showSuccess(t('delete_success'));
        } catch (error) {
            console.error('Failed to delete user:', error);
            closeLoading();
            showError(t('delete_error'));
        }
    };

    const handleFormSubmit = async (data: CreateUserData | UpdateUserData) => {
        try {
            setIsSubmitting(true);
            showLoading(editingUser ? t('update_loading') : t('create_loading'));

            if (editingUser) {
                await userService.updateUser(editingUser.id, data as UpdateUserData);
            } else {
                await userService.createUser(data as CreateUserData);
            }

            setShowForm(false);
            setEditingUser(null);
            await loadUsers();
            closeLoading();

            showSuccess(
                editingUser ? t('update_success') : t('create_success'),
                editingUser ? t('update_success_title') : t('create_success_title')
            );
        } catch (error) {
            console.error('Failed to save user:', error);
            closeLoading();
            showError(
                editingUser ? t('update_error') : t('create_error')
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setEditingUser(null);
    };

    const activeCount = users.filter(u => u.is_active).length;
    const roleCount = new Set(users.flatMap(u => u.roles?.map(r => r.name) || [])).size;

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-card-foreground mb-2">{t('error_title')}</h2>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <button
                        onClick={loadUsers}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-200"
                    >
                        <Activity className="w-4 h-4" />{t('retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Gradient */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{t('page_title')}</h1>
                                <p className="text-blue-100 text-sm">{t('page_desc')}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleCreateUser}
                        className="inline-flex items-center gap-2 bg-card text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                    >
                        <UserPlus className="w-4 h-4" />
                        {t('add_user')}
                    </button>
                </div>

                {/* Stats Row */}
                <div className="relative z-10 grid grid-cols-4 gap-4 mt-6">
                    {[
                        { label: t('stats_total'), value: pagination.total, icon: Users, color: 'bg-blue-400/20 text-blue-200' },
                        { label: t('stats_active'), value: activeCount, icon: ShieldCheck, color: 'bg-green-400/20 text-green-200' },
                        { label: t('stats_inactive'), value: pagination.total - activeCount, icon: Activity, color: 'bg-yellow-400/20 text-yellow-200' },
                        { label: t('stats_roles'), value: roleCount || '-' , icon: ShieldCheck, color: 'bg-purple-400/20 text-purple-200' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${stat.color}`}>
                                    <stat.icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                                    <p className="text-xs text-blue-200">{stat.label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className={`${card.bgClass} ${card.borderClass} border rounded-xl shadow-sm p-4`}>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search className={`absolute left-3 top-2.5 w-5 h-5 ${text.mutedClass}`} />
                            <input
                                type="text"
                                placeholder={t('search_placeholder')}
                                value={filters.search || ''}
                                onChange={(e) => handleSearch(e.target.value)}
                                className={`w-full pl-10 pr-4 py-2.5 border ${card.borderClass} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${card.bgClass} transition-colors text-sm ${text.primaryClass}`}
                            />
                        </div>
                        <select
                            value={filters.page_size}
                            onChange={(e) => setFilters(prev => ({ ...prev, page_size: parseInt(e.target.value), page: 1 }))}
                            className={`px-3 py-2.5 border ${card.borderClass} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${card.bgClass} text-sm ${text.primaryClass}`}
                        >
                            <option value={10}>10 {t('per_page')}</option>
                            <option value={20}>20 {t('per_page')}</option>
                            <option value={50}>50 {t('per_page')}</option>
                        </select>
                    </div>
                    <div className={`text-sm ${text.mutedClass}`}>
                        {isLoading ? t('loading') : `${users.length} ${t('of')} ${pagination.total} ${t('users_count')}`}
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <UserTable
                users={users}
                isLoading={isLoading}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
            />

            {/* Pagination */}
            {pagination.total_pages > 1 && (
                <div className={`${card.bgClass} ${card.borderClass} border rounded-xl shadow-sm px-6 py-4`}>
                    <div className="flex items-center justify-between">
                        <div className={`text-sm ${text.mutedClass}`}>
                            {t('page')} {pagination.page} {t('of_pages')} {pagination.total_pages}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className={`px-3 py-2 text-sm border ${card.borderClass} rounded-lg ${card.hoverClass} disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${text.primaryClass}`}
                            >
                                {t('prev')}
                            </button>
                            {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                                const pageNum = Math.max(1, pagination.page - 2) + i;
                                if (pageNum > pagination.total_pages) return null;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`w-9 h-9 text-sm rounded-lg font-medium transition-all ${
                                            pageNum === pagination.page
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                                : `${text.secondaryClass} ${card.hoverClass} border ${card.borderClass}`
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.total_pages}
                                className={`px-3 py-2 text-sm border ${card.borderClass} rounded-lg ${card.hoverClass} disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${text.primaryClass}`}
                            >
                                {t('next')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Form Modal */}
            {showForm && (
                <UserForm
                    user={editingUser}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                    isLoading={isSubmitting}
                />
            )}
        </div>
    );
}
