'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Pencil, Trash2, Mail, Calendar, Shield, Users, CheckCircle, XCircle } from 'lucide-react';
import { User } from '@/lib/services';
import { useThemeColors } from '@/lib/hooks/useThemeColors';

interface UserTableProps {
    users: User[];
    isLoading?: boolean;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
}

const roleColors: Record<string, string> = {
    admin: 'from-purple-500 to-indigo-600',
    superadmin: 'from-red-500 to-pink-600',
    user: 'from-blue-500 to-cyan-500',
    operator: 'from-green-500 to-emerald-600',
};

export default function UserTable({ users, isLoading, onEdit, onDelete }: UserTableProps) {
    const { card, text } = useThemeColors();
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

    const toggleSelectUser = (userId: number) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(user => user.id));
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className={`${card.bgClass} ${card.borderClass} border rounded-xl p-5 animate-pulse`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-5 h-5 ${card.hoverClass} rounded`} />
                            <div className={`w-12 h-12 ${card.hoverClass} rounded-full`} />
                            <div className="flex-1 space-y-2">
                                <div className={`h-4 ${card.hoverClass} rounded w-48`} />
                                <div className={`h-3 ${card.hoverClass} rounded w-32`} />
                            </div>
                            <div className={`h-6 ${card.hoverClass} rounded w-20`} />
                            <div className={`h-6 ${card.hoverClass} rounded w-16`} />
                            <div className={`h-6 ${card.hoverClass} rounded w-24`} />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className={`${card.bgClass} ${card.borderClass} border rounded-xl shadow-sm`}>
                <div className="p-16 text-center">
                    <div className={`w-20 h-20 mx-auto mb-4 ${card.hoverClass} rounded-full flex items-center justify-center`}>
                        <Users className={`w-10 h-10 ${text.mutedClass}`} />
                    </div>
                    <h3 className={`text-lg font-semibold ${text.primaryClass} mb-2`}>Tidak Ada Pengguna</h3>
                    <p className={`${text.mutedClass} mb-6`}>Belum ada data pengguna yang tersedia.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`${card.bgClass} ${card.borderClass} border rounded-xl shadow-sm overflow-hidden`}>
            {/* Bulk Actions Bar */}
            {selectedUsers.length > 0 && (
                <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700">
                        {selectedUsers.length} pengguna dipilih
                    </span>
                    <button className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1.5">
                        <Trash2 className="w-4 h-4" /> Hapus Dipilih
                    </button>
                </div>
            )}

            {/* Column Headers */}
            <div className={`hidden md:flex items-center gap-4 px-5 py-3 ${card.hoverClass} border-b ${card.borderClass} text-xs font-semibold ${text.mutedClass} uppercase tracking-wider`}>
                <div className="flex items-center gap-3 w-12">
                    <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 border-border rounded focus:ring-blue-500"
                    />
                </div>
                <div className="flex-1 min-w-0">Pengguna</div>
                <div className="w-28">Role</div>
                <div className="w-24">Status</div>
                <div className="w-32">Bergabung</div>
                <div className="w-28 text-right">Aksi</div>
            </div>

            {/* User Cards */}
            <div className={`divide-y ${card.borderClass}`}>
                {users.map((user) => (
                    <div
                        key={user.id}
                        className={`group relative flex flex-col md:flex-row md:items-center gap-3 md:gap-4 px-5 py-4 transition-all duration-200 ${
                            selectedUsers.includes(user.id) ? 'bg-blue-50/50' : card.hoverClass
                        }`}
                    >
                        {/* Checkbox */}
                        <div className="flex items-center gap-3 md:w-12">
                            <input
                                type="checkbox"
                                checked={selectedUsers.includes(user.id)}
                                onChange={() => toggleSelectUser(user.id)}
                                className="w-4 h-4 text-blue-600 border-border rounded focus:ring-blue-500"
                            />
                            <div className={`md:hidden text-xs ${text.mutedClass}`}>#{user.id}</div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                                roleColors[user.roles?.[0]?.name?.toLowerCase() || ''] || 'from-gray-500 to-gray-600'
                            } flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                <span className="text-white text-sm font-bold">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="min-w-0">
                                <Link
                                    href={`/users/${user.id}`}
                                    className={`text-sm font-semibold ${text.primaryClass} hover:text-blue-600 transition-colors truncate block`}
                                >
                                    {user.name}
                                </Link>
                                <div className={`flex items-center gap-3 text-xs ${text.mutedClass} mt-0.5`}>
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        {user.email || user.username}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Role */}
                        <div className="md:w-28">
                            <div className="flex flex-wrap gap-1">
                                {user.roles && user.roles.length > 0 ? (
                                    user.roles.map((role) => (
                                        <span
                                            key={role.id}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border border-indigo-100`}
                                        >
                                            <Shield className="w-3 h-3" />
                                            {role.name}
                                        </span>
                                    ))
                                ) : (
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${card.hoverClass} ${text.mutedClass} border ${card.borderClass}`}>
                                        <Shield className="w-3 h-3" />
                                        User
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Status */}
                        <div className="md:w-24">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${
                                user.is_active
                                    ? 'bg-green-50 text-green-700 border border-green-100'
                                    : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                                {user.is_active
                                    ? <CheckCircle className="w-3 h-3" />
                                    : <XCircle className="w-3 h-3" />
                                }
                                {user.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                        </div>

                        {/* Join Date */}
                        <div className={`md:w-32 text-xs ${text.mutedClass} flex items-center gap-1.5`}>
                            <Calendar className="w-3 h-3" />
                            {new Date(user.date_joined).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>

                        {/* Actions */}
                        <div className="md:w-28 flex items-center justify-end gap-1">
                            <Link
                                href={`/users/${user.id}`}
                                className={`p-2 ${text.mutedClass} hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all`}
                                title="Lihat Detail"
                            >
                                <Eye className="w-4 h-4" />
                            </Link>
                            <button
                                onClick={() => onEdit(user)}
                                className={`p-2 ${text.mutedClass} hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all`}
                                title="Edit Pengguna"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onDelete(user)}
                                className={`p-2 ${text.mutedClass} hover:text-red-600 hover:bg-red-50 rounded-lg transition-all`}
                                title="Hapus Pengguna"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
