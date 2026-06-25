'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Lock, ShieldCheck, Key, Eye, EyeOff } from 'lucide-react';
import { User as UserType, CreateUserData, UpdateUserData, Role, roleService } from '@/lib/services';

interface UserFormProps {
    user?: UserType | null;
    onSubmit: (data: CreateUserData | UpdateUserData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function UserForm({ user, onSubmit, onCancel, isLoading }: UserFormProps) {
    const [activeTab, setActiveTab] = useState<'account' | 'password'>('account');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        email: '',
        password: '',
        password_confirm: '',
        is_active: true,
        role_ids: [] as number[],
    });
    const [roles, setRoles] = useState<Role[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadRoles();
    }, []);

    useEffect(() => {
        if (!user) return;
        setFormData(prev => ({
            username: user.username,
            name: user.name,
            email: user.email || '',
            password: '',
            password_confirm: '',
            is_active: user.is_active,
            role_ids: prev.role_ids,
        }));
    }, [user]);

    // Map user's role names to role IDs setelah roles siap
    useEffect(() => {
        if (!user || roles.length === 0) return;
        const ids = user.roles
            .map(name => roles.find(r => r.name === name)?.id)
            .filter((id): id is number => id !== undefined);
        setFormData(prev => ({ ...prev, role_ids: ids }));
    }, [user?.id, roles]);

    const loadRoles = async () => {
        try {
            const rolesData = await roleService.getRoles();
            setRoles(rolesData);
        } catch (error) {
            console.error('Failed to load roles:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleRoleToggle = (roleId: number) => {
        setFormData(prev => ({
            ...prev,
            role_ids: prev.role_ids.includes(roleId)
                ? prev.role_ids.filter(id => id !== roleId)
                : [...prev.role_ids, roleId]
        }));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Username wajib diisi';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username minimal 3 karakter';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Nama lengkap wajib diisi';
        }

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Format email tidak valid';
        }

        if (!user) {
            if (!formData.password) {
                newErrors.password = 'Password wajib diisi';
            } else if (formData.password.length < 6) {
                newErrors.password = 'Password minimal 6 karakter';
            }
            if (formData.password !== formData.password_confirm) {
                newErrors.password_confirm = 'Konfirmasi password tidak cocok';
            }
        } else if (formData.password) {
            if (formData.password.length < 6) {
                newErrors.password = 'Password minimal 6 karakter';
            }
            if (formData.password !== formData.password_confirm) {
                newErrors.password_confirm = 'Konfirmasi password tidak cocok';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const submitData: CreateUserData | UpdateUserData = {
                username: formData.username,
                name: formData.name,
                email: formData.email || undefined,
                is_active: formData.is_active,
                role_ids: formData.role_ids.length > 0 ? formData.role_ids : undefined,
            };

            if (!user) {
                (submitData as CreateUserData).password = formData.password;
                (submitData as CreateUserData).password_confirm = formData.password_confirm;
            } else if (formData.password) {
                (submitData as UpdateUserData).password = formData.password;
            }

            await onSubmit(submitData);
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    const inputClass = (field: string) =>
        `w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors text-sm ${
            errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-200'
        }`;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white">
                                {user ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                            </h2>
                            <p className="text-blue-200 text-sm mt-0.5">
                                {user ? 'Perbarui informasi akun pengguna' : 'Buat akun baru untuk pengguna'}
                            </p>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-6 pt-4 gap-1">
                    {[
                        { id: 'account' as const, label: 'Akun', icon: User },
                        { id: 'password' as const, label: 'Kata Sandi', icon: Lock },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2 -mb-px ${
                                activeTab === tab.id
                                    ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[60vh]">
                    {activeTab === 'account' && (
                        <div className="space-y-4">
                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className={`pl-9 ${inputClass('username')}`}
                                        placeholder="Masukkan username"
                                    />
                                </div>
                                {errors.username && (
                                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                        <span>⚠</span> {errors.username}
                                    </p>
                                )}
                            </div>

                            {/* Nama Lengkap */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Nama Lengkap <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`pl-9 ${inputClass('name')}`}
                                        placeholder="Masukkan nama lengkap"
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                        <span>⚠</span> {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`pl-9 ${inputClass('email')}`}
                                        placeholder="contoh@email.com"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                        <span>⚠</span> {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Role / Peran <span className="text-gray-400 text-xs">(bisa pilih lebih dari satu)</span>
                                </label>
                                <div className="space-y-2 border border-gray-200 rounded-xl p-3 bg-gray-50">
                                    {roles.length === 0 ? (
                                        <p className="text-sm text-gray-400">Memuat role...</p>
                                    ) : (
                                        roles.map((role) => (
                                            <label
                                                key={role.id}
                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.role_ids.includes(role.id)}
                                                    onChange={() => handleRoleToggle(role.id)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <div className="flex-1 flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-700">{role.name}</span>
                                                    {role.user_count !== undefined && (
                                                        <span className="text-xs text-gray-400">{role.user_count} pengguna</span>
                                                    )}
                                                </div>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center gap-3 pt-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                                    <span className="ml-3 text-sm font-medium text-gray-700">Akun Aktif</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'password' && (
                        <div className="space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 flex items-start gap-2">
                                <Key className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>
                                    {user
                                        ? 'Kosongkan jika tidak ingin mengubah password.'
                                        : 'Password minimal 6 karakter untuk keamanan akun.'}
                                </span>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Password {!user && <span className="text-red-500">*</span>}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`pl-9 pr-10 ${inputClass('password')}`}
                                        placeholder={user ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                        <span>⚠</span> {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            {(formData.password || !user) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Konfirmasi Password {!user && <span className="text-red-500">*</span>}
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            name="password_confirm"
                                            value={formData.password_confirm}
                                            onChange={handleChange}
                                            className={`pl-9 pr-10 ${inputClass('password_confirm')}`}
                                            placeholder="Ulangi password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.password_confirm && (
                                        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                            <span>⚠</span> {errors.password_confirm}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 rounded-xl transition-all shadow-lg shadow-blue-200"
                        >
                            {isLoading && (
                                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            )}
                            {user ? 'Simpan Perubahan' : 'Buat Pengguna'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
