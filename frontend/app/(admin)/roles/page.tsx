'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldPlus, Users, Key, Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { roleService, type Role } from '@/lib/services';
import { showSuccess, showError, showDeleteConfirm, showLoading, closeLoading } from '@/lib/sweetalert';

export default function RolesPage() {
    const router = useRouter();
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => { loadRoles(); }, []);

    const loadRoles = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const rolesData = await roleService.getRoles();
            setRoles(rolesData);
        } catch (err) {
            setError('Failed to load roles. Please try again.');
            showError('Gagal memuat data role. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoleName.trim()) { showError('Nama role wajib diisi'); return; }
        try {
            setIsCreating(true);
            showLoading('Membuat role...');
            await roleService.createRole({ name: newRoleName.trim() });
            setNewRoleName('');
            setShowCreateForm(false);
            await loadRoles();
            closeLoading();
            showSuccess('Role berhasil dibuat');
        } catch (error) {
            closeLoading();
            showError('Gagal membuat role. Silakan coba lagi.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteRole = async (role: Role) => {
        const confirmed = await showDeleteConfirm(role.name, 'role');
        if (!confirmed) return;
        try {
            showLoading('Menghapus role...');
            await roleService.deleteRole(role.id);
            await loadRoles();
            closeLoading();
            showSuccess('Role berhasil dihapus');
        } catch (error) {
            closeLoading();
            showError('Gagal menghapus role. Silakan coba lagi.');
        }
    };

    const filtered = roles.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: roles.length,
        totalUsers: roles.reduce((s, r) => s + (r.user_count || 0), 0),
        totalPerms: roles.reduce((s, r) => s + (r.permission_count || 0), 0),
    };

    if (error) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                        <Shield className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Roles</h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button onClick={loadRoles}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all">
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Roles</h1>
                                <p className="text-blue-100 text-sm">Manage user roles and permissions</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                        >
                            <ShieldPlus className="w-4 h-4" /> Add Role
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                        {[
                            { label: 'Total Roles', value: stats.total, icon: Shield, color: 'bg-blue-400/20 text-blue-200' },
                            { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-green-400/20 text-green-200' },
                            { label: 'Total Permissions', value: stats.totalPerms, icon: Key, color: 'bg-purple-400/20 text-purple-200' },
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
            </div>

            {/* Create Role Form */}
            {showCreateForm && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Create New Role</h3>
                        <button onClick={() => { setShowCreateForm(false); setNewRoleName(''); }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <form onSubmit={handleCreateRole} className="flex flex-col sm:flex-row items-end gap-3">
                        <div className="flex-1 w-full space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Role Name</label>
                            <input type="text" value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                placeholder="Enter role name"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm"
                                required />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" disabled={isCreating}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2.5 rounded-xl font-medium transition-all text-sm">
                                {isCreating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search */}
            {roles.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Cari role..." value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors text-sm" />
                    </div>
                </div>
            )}

            {/* Roles Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                            <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                            <div className="flex gap-2">
                                <div className="h-8 bg-gray-200 rounded-lg w-20" />
                                <div className="h-8 bg-gray-200 rounded-lg w-20" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                        <Shield className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {roles.length === 0 ? 'No Roles Found' : 'Role tidak ditemukan'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {roles.length === 0 ? 'Get started by creating your first role' : 'Coba ubah kata kunci pencarian'}
                    </p>
                    {roles.length === 0 && (
                        <button onClick={() => setShowCreateForm(true)}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-200">
                            <ShieldPlus className="w-4 h-4" /> Create Role
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((role) => (
                        <div key={role.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all group">
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                            <Shield className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{role.name}</h3>
                                            <p className="text-xs text-gray-400">ID: {role.id}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => router.push(`/roles/${role.id}`)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => handleDeleteRole(role)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Badge className="bg-blue-50 text-blue-700 border-0 text-xs font-medium">
                                        <Users className="w-3 h-3 mr-1" /> {role.user_count} users
                                    </Badge>
                                    <Badge className="bg-purple-50 text-purple-700 border-0 text-xs font-medium">
                                        <Key className="w-3 h-3 mr-1" /> {role.permission_count} permissions
                                    </Badge>
                                </div>

                                <div className="flex gap-2 border-t border-gray-50 pt-3">
                                    <button onClick={() => router.push(`/roles/${role.id}`)}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-xl transition-colors font-medium">
                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    <button onClick={() => router.push(`/roles/${role.id}/permissions`)}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors font-medium">
                                        <Key className="w-3.5 h-3.5" /> Permissions
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
