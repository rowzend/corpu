'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Loader2, Shield, Users, Key, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { roleService, type RoleDetail } from '@/lib/services';
import { showSuccess, showError, showDeleteConfirm, showLoading, closeLoading } from '@/lib/sweetalert';

export default function RoleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const roleId = parseInt(params.id as string);

    const [role, setRole] = useState<RoleDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => { loadRole(); }, [roleId]);

    const loadRole = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const roleData = await roleService.getRoleById(roleId);
            setRole(roleData);
            setEditName(roleData.name);
        } catch (err) {
            setError('Failed to load role details.');
            showError('Gagal memuat detail role. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editName.trim()) { showError('Nama role wajib diisi'); return; }
        try {
            setIsSaving(true);
            showLoading('Memperbarui role...');
            await roleService.updateRole(roleId, { name: editName.trim() });
            await loadRole();
            setIsEditing(false);
            closeLoading();
            showSuccess('Role berhasil diperbarui');
        } catch (error) {
            closeLoading();
            showError('Gagal memperbarui role. Silakan coba lagi.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!role) return;
        const confirmed = await showDeleteConfirm(role.name, 'role');
        if (!confirmed) return;
        try {
            showLoading('Menghapus role...');
            await roleService.deleteRole(roleId);
            closeLoading();
            showSuccess('Role berhasil dihapus');
            router.push('/roles');
        } catch (error) {
            closeLoading();
            showError('Gagal menghapus role. Silakan coba lagi.');
        }
    };

    if (error) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                        <Shield className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Role</h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button onClick={loadRole}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all">
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading || !role) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading role details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/roles')}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-2 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white">Role Details</h1>
                            <p className="text-blue-100 text-sm">View and manage role information</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => router.push(`/roles/${roleId}/permissions`)}
                            className="inline-flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium transition-all text-sm">
                            <Key className="w-4 h-4" /> Permissions
                        </button>
                        <button onClick={handleDelete}
                            className="inline-flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium transition-all text-sm">
                            <Trash2 className="w-4 h-4" /> Delete
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Role ID', value: role.id, icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Name', value: role.name, icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Users', value: role.user_count, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Permissions', value: role.permission_count, icon: Key, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} rounded-xl p-4`}>
                        <stat.icon className={`w-5 h-5 ${stat.color} mb-1`} />
                        <div className={`text-lg font-bold ${stat.color} truncate`}>{stat.value}</div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Role Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Role Information</h2>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)}
                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                    )}
                </div>
                <div className="p-6">
                    {isEditing ? (
                        <div className="space-y-4 max-w-md">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Role Name</label>
                                <input type="text" value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm" />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleSave} disabled={isSaving}
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2.5 rounded-xl font-medium transition-all text-sm">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button onClick={() => { setIsEditing(false); setEditName(role.name); }}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {[
                                { label: 'Role ID', value: role.id },
                                { label: 'Role Name', value: role.name },
                                { label: 'Total Users', value: role.user_count },
                                { label: 'Total Permissions', value: role.permission_count },
                            ].map((field, i) => (
                                <div key={i}>
                                    <p className="text-xs font-medium text-gray-500 mb-1">{field.label}</p>
                                    <p className="text-base font-semibold text-gray-900">{field.value}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Permissions List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Assigned Permissions <span className="text-gray-400 font-normal">({role.permissions.length})</span>
                    </h2>
                    <button onClick={() => router.push(`/roles/${roleId}/permissions`)}
                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                        Manage <span className="text-lg leading-none">&rarr;</span>
                    </button>
                </div>
                <div className="p-6">
                    {role.permissions.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                                <Key className="w-7 h-7 text-gray-400" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">No Permissions Assigned</h3>
                            <p className="text-sm text-gray-500 mb-4">This role doesn't have any permissions yet</p>
                            <button onClick={() => router.push(`/roles/${roleId}/permissions`)}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all text-sm">
                                <Key className="w-4 h-4" /> Add Permissions
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {role.permissions.map((permission) => (
                                <div key={permission.id}
                                    className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-blue-100 transition-all">
                                    <div className="flex items-start gap-3 min-w-0">
                                        {permission.rule_detail.is_active
                                            ? <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            : <XCircle className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                                        }
                                        <div className="min-w-0">
                                            <div className="font-medium text-gray-900 text-sm truncate">
                                                {permission.rule_detail.function_name}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                {permission.rule_detail.module_name} &rarr; {permission.rule_detail.control_name}
                                            </div>
                                            <div className="text-xs text-gray-400 font-mono mt-1 bg-gray-50 px-2 py-0.5 rounded inline-block">
                                                {permission.rule_detail.permission_string}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge className={`text-xs font-medium border-0 flex-shrink-0 ml-3 ${
                                        permission.rule_detail.is_active
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-500'
                                    }`}>
                                        {permission.rule_detail.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
