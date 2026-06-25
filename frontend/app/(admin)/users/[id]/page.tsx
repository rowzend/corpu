'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { userService, roleService, type User, type Role } from '@/lib/services';
import { showSuccess, showError, showDeleteConfirm, showConfirm, showLoading, closeLoading } from '@/lib/sweetalert';

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = parseInt(params.id as string);

    const [user, setUser] = useState<User | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [editData, setEditData] = useState({
        name: '',
        email: '',
        username: '',
        is_active: true,
    });

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const [userData, rolesData] = await Promise.all([
                userService.getUserById(userId),
                roleService.getRoles(),
            ]);

            setUser(userData);
            setRoles(rolesData);
            setEditData({
                name: userData.name,
                email: userData.email,
                username: userData.username,
                is_active: userData.is_active,
            });
        } catch (err) {
            console.error('Failed to load user:', err);
            setError('Failed to load user details. Please try again.');
            showError('Gagal memuat detail pengguna. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editData.name.trim() || !editData.email.trim() || !editData.username.trim()) {
            showError('Nama, email, dan username wajib diisi');
            return;
        }

        try {
            setIsSaving(true);
            showLoading('Memperbarui pengguna...');
            await userService.updateUser(userId, editData);
            await loadData();
            setIsEditing(false);
            closeLoading();
            showSuccess('Pengguna berhasil diperbarui');
        } catch (error) {
            console.error('Failed to update user:', error);
            closeLoading();
            showError('Gagal memperbarui pengguna. Silakan coba lagi.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!user) return;

        const confirmed = await showDeleteConfirm(user.name, 'pengguna');
        if (!confirmed) return;

        try {
            showLoading('Menghapus pengguna...');
            await userService.deleteUser(userId);
            closeLoading();
            showSuccess('Pengguna berhasil dihapus');
            router.push('/users');
        } catch (error) {
            console.error('Failed to delete user:', error);
            closeLoading();
            showError('Gagal menghapus pengguna. Silakan coba lagi.');
        }
    };

    const handleToggleStatus = async () => {
        if (!user) return;

        const action = user.is_active ? 'menonaktifkan' : 'mengaktifkan';
        const confirmed = await showConfirm(
            `Apakah Anda yakin ingin ${action} pengguna "${user.name}"?`,
            'Konfirmasi Status',
            'Ya, Lanjutkan',
            'Batal'
        );
        
        if (!confirmed) return;

        try {
            showLoading(`${user.is_active ? 'Menonaktifkan' : 'Mengaktifkan'} pengguna...`);
            await userService.updateUser(userId, { is_active: !user.is_active });
            await loadData();
            closeLoading();
            showSuccess(`Pengguna berhasil ${!user.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
        } catch (error) {
            console.error('Failed to update user status:', error);
            closeLoading();
            showError('Gagal memperbarui status pengguna. Silakan coba lagi.');
        }
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">❌</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Error Loading User
                    </h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadData}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4 animate-spin">⚙️</div>
                    <p className="text-gray-600">Loading user details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <Link
                            href="/users"
                            className="text-blue-600 hover:text-blue-700"
                        >
                            ← Back to Users
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
                    <p className="text-gray-600">View and manage user information</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleToggleStatus}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            user.is_active
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                    >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        Delete User
                    </button>
                </div>
            </div>

            {/* User Status Badge */}
            <div className={`rounded-xl p-4 ${
                user.is_active
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
            }`}>
                <div className="flex items-center space-x-2">
                    <span className="text-2xl">{user.is_active ? '✅' : '🚫'}</span>
                    <div>
                        <div className="font-semibold text-gray-900">
                            Account Status: {user.is_active ? 'Active' : 'Inactive'}
                        </div>
                        <div className="text-sm text-gray-600">
                            {user.is_active
                                ? 'This user can log in and access the system'
                                : 'This user cannot log in to the system'}
                        </div>
                    </div>
                </div>
            </div>

            {/* User Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">User Information</h2>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Edit
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    value={editData.name}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Username *
                                </label>
                                <input
                                    type="text"
                                    value={editData.username}
                                    onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={editData.email}
                                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={editData.is_active ? 'active' : 'inactive'}
                                    onChange={(e) => setEditData({ ...editData, is_active: e.target.value === 'active' })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex space-x-2 pt-4">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditData({
                                        name: user.name,
                                        email: user.email,
                                        username: user.username,
                                        is_active: user.is_active,
                                    });
                                }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                                User ID
                            </label>
                            <p className="text-lg text-gray-900">{user.id}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                                Full Name
                            </label>
                            <p className="text-lg text-gray-900">{user.name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                                Username
                            </label>
                            <p className="text-lg text-gray-900">{user.username}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                                Email
                            </label>
                            <p className="text-lg text-gray-900">{user.email}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                                Role
                            </label>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {user.roles && user.roles.length > 0
                                    ? user.roles.map((r, i) => (
                                        <span key={i} className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                            {r}
                                        </span>
                                    ))
                                    : <p className="text-lg text-gray-900">{user.role || 'No role assigned'}</p>
                                }
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                                Status
                            </label>
                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                                user.is_active
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                            }`}>
                                {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                                Date Joined
                            </label>
                            <p className="text-lg text-gray-900">
                                {new Date(user.date_joined).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                                Last Updated
                            </label>
                            <p className="text-lg text-gray-900">
                                {new Date(user.updated_at).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                            Pegawai ID
                        </label>
                        <p className="text-lg text-gray-900">{user.id_pegawai || '-'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                            OPD ID
                        </label>
                        <p className="text-lg text-gray-900">{user.user_id_opd || '-'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                            Profile Image
                        </label>
                        {user.image ? (
                            <img
                                src={user.image}
                                alt={user.name}
                                className="w-16 h-16 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl">
                                👤
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
