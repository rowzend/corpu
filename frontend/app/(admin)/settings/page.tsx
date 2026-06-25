'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Settings,
    Save,
    RefreshCw,
    Bell,
    Shield,
    Database,
    Mail,
    Palette,
    Upload,
    X,
    Image as ImageIcon,
    Phone,
    ChevronRight
} from 'lucide-react';
import { showError, showToast } from '@/lib/sweetalert';
import { getSettings, batchUpdateSettings, type AppSetting } from '@/lib/api/settings';

interface SystemSettings {
    app_name: string;
    app_description: string;
    app_version: string;
    maintenance_mode: boolean;
    registration_enabled: boolean;
    email_notifications: boolean;
    sms_notifications: boolean;
    auto_backup: boolean;
    backup_frequency: string;
    session_timeout: number;
    max_login_attempts: number;
    password_min_length: number;
    require_password_change: boolean;
    smtp_host: string;
    smtp_port: number;
    smtp_username: string;
    smtp_password: string;
    smtp_use_tls: boolean;
    default_theme: string;
    logo: string;
    favicon: string;
    contact_email: string;
    contact_phone: string;
    contact_fax: string;
    contact_address: string;
    contact_postal_code: string;
    contact_website: string;
}

interface SettingMetadata {
    description: string;
    category: string;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<SystemSettings>({
        app_name: 'ASN CORPU',
        app_description: 'Sistem Informasi Kepegawaian ASN',
        app_version: '3.0.0',
        maintenance_mode: false,
        registration_enabled: true,
        email_notifications: true,
        sms_notifications: false,
        auto_backup: true,
        backup_frequency: 'daily',
        session_timeout: 30,
        max_login_attempts: 5,
        password_min_length: 8,
        require_password_change: false,
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_username: '',
        smtp_password: '',
        smtp_use_tls: true,
        default_theme: 'light',
        logo: '/logo.png',
        favicon: '/favicon.ico',
        contact_email: '',
        contact_phone: '',
        contact_fax: '',
        contact_address: '',
        contact_postal_code: '',
        contact_website: ''
    });

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general');
    const [logoPreview, setLogoPreview] = useState<string>('/logo.png');
    const [faviconPreview, setFaviconPreview] = useState<string>('/favicon.ico');
    const [availableSettings, setAvailableSettings] = useState<Set<string>>(new Set());
    const [settingsMetadata, setSettingsMetadata] = useState<Record<string, SettingMetadata>>({});
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setInitialLoading(true);
            const response = await getSettings();

            if (response.success && response.data) {
                const settingsArray = Array.isArray(response.data) ? response.data : [];
                const settingsMap: Record<string, any> = {};
                const metadata: Record<string, SettingMetadata> = {};

                settingsArray.forEach((setting: AppSetting) => {
                    settingsMap[setting.key] = setting.typed_value !== undefined ? setting.typed_value : setting.value;
                    metadata[setting.key] = {
                        description: setting.description || '',
                        category: setting.category || 'general'
                    };
                });

                const availableKeys = new Set<string>(Object.keys(settingsMap));
                setAvailableSettings(availableKeys);
                setSettingsMetadata(metadata);

                setSettings(prev => ({
                    ...prev,
                    ...settingsMap
                }));

                if (settingsMap.logo) setLogoPreview(settingsMap.logo);
                if (settingsMap.favicon) setFaviconPreview(settingsMap.favicon);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            showError('Gagal memuat pengaturan. Pastikan backend sudah memiliki data settings.');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const settingsToUpdate: Record<string, any> = {};
            Object.entries(settings).forEach(([key, value]) => {
                if (availableSettings.has(key)) {
                    settingsToUpdate[key] = value;
                }
            });

            if (Object.keys(settingsToUpdate).length === 0) {
                showError('Tidak ada settings yang bisa disimpan. Silakan buat settings di backend terlebih dahulu.');
                return;
            }

            await batchUpdateSettings(settingsToUpdate);
            showToast('Pengaturan berhasil disimpan!', 'success');
            await loadSettings();
        } catch (error: any) {
            showError(error.message || 'Gagal menyimpan pengaturan!');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (key: keyof SystemSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const getDescription = (key: string, fallback: string = ''): string => {
        return settingsMetadata[key]?.description || fallback;
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { showError('File harus berupa gambar!'); return; }
        if (file.size > 2 * 1024 * 1024) { showError('Ukuran file maksimal 2MB!'); return; }
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setLogoPreview(result);
            handleInputChange('logo', result);
        };
        reader.readAsDataURL(file);
    };

    const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { showError('File harus berupa gambar!'); return; }
        if (file.size > 1 * 1024 * 1024) { showError('Ukuran file maksimal 1MB!'); return; }
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setFaviconPreview(result);
            handleInputChange('favicon', result);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = () => {
        setLogoPreview('/logo.png');
        handleInputChange('logo', '/logo.png');
        if (logoInputRef.current) logoInputRef.current.value = '';
    };

    const handleRemoveFavicon = () => {
        setFaviconPreview('/favicon.ico');
        handleInputChange('favicon', '/favicon.ico');
        if (faviconInputRef.current) faviconInputRef.current.value = '';
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'email', label: 'Email', icon: Mail },
        { id: 'contact', label: 'Contact', icon: Phone },
        { id: 'backup', label: 'Backup', icon: Database },
        { id: 'appearance', label: 'Appearance', icon: Palette }
    ];

    const selectCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm";
    const inputCls = "border-gray-200 focus:border-blue-500 focus:ring-blue-500";

    return (
        <div className="space-y-6">
            {initialLoading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="text-center">
                        <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-500">Memuat pengaturan...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-gray-900 p-8">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                        <Settings className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-white">Pengaturan Sistem</h1>
                                        <p className="text-slate-300 text-sm">
                                            Kelola konfigurasi sistem dan aplikasi
                                            {availableSettings.size > 0 && (
                                                <span className="ml-2 text-blue-300">({availableSettings.size} tersedia)</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={loadSettings}
                                        disabled={loading}
                                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                        Reload
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading || availableSettings.size === 0}
                                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Save className="w-4 h-4" />
                                        {loading ? 'Menyimpan...' : 'Simpan'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {availableSettings.size === 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-amber-600 font-bold text-sm">!</span>
                                </div>
                                <div>
                                    <p className="font-medium text-amber-800 text-sm">
                                        Tidak ada settings di backend. Jalankan seed command:
                                    </p>
                                    <code className="block mt-2 p-2.5 bg-amber-100/80 rounded-lg text-sm text-amber-900 font-mono">
                                        docker exec asncorpu_backend_app python manage.py seed_app_settings
                                    </code>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Sidebar Navigation */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
                                <div className="px-5 py-4 border-b border-gray-100">
                                    <h2 className="font-semibold text-gray-900 text-sm">Kategori</h2>
                                </div>
                                <nav className="p-2 space-y-1">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        const isActive = activeTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                                    isActive
                                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                                    {tab.label}
                                                </div>
                                                {isActive && <ChevronRight className="w-4 h-4 text-blue-400" />}
                                            </button>
                                        );
                                    })}
                                </nav>
                            </div>
                        </div>

                        {/* Settings Content */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* General Settings */}
                            {activeTab === 'general' && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <Settings className="w-5 h-5 text-blue-600" />
                                            <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="app_name" className="text-sm font-medium text-gray-700">Nama Aplikasi</Label>
                                                <Input id="app_name" value={settings.app_name}
                                                    onChange={(e) => handleInputChange('app_name', e.target.value)}
                                                    className={inputCls} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="app_version" className="text-sm font-medium text-gray-700">Versi</Label>
                                                <Input id="app_version" value={settings.app_version}
                                                    onChange={(e) => handleInputChange('app_version', e.target.value)}
                                                    className={inputCls} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="app_description" className="text-sm font-medium text-gray-700">Deskripsi</Label>
                                            <Textarea id="app_description" value={settings.app_description}
                                                onChange={(e) => handleInputChange('app_description', e.target.value)}
                                                rows={3} className={inputCls} />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-700">Mode Maintenance</Label>
                                                <p className="text-xs text-gray-500 mt-0.5">{getDescription('maintenance_mode', 'Aktifkan untuk menonaktifkan akses user')}</p>
                                            </div>
                                            <Switch checked={settings.maintenance_mode}
                                                onCheckedChange={(checked) => handleInputChange('maintenance_mode', checked)} />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-700">Registrasi User Baru</Label>
                                                <p className="text-xs text-gray-500 mt-0.5">{getDescription('registration_enabled', 'Izinkan pendaftaran user baru')}</p>
                                            </div>
                                            <Switch checked={settings.registration_enabled}
                                                onCheckedChange={(checked) => handleInputChange('registration_enabled', checked)} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Security Settings */}
                            {activeTab === 'security' && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-blue-600" />
                                            <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="session_timeout" className="text-sm font-medium text-gray-700">Session Timeout (menit)</Label>
                                                <Input id="session_timeout" type="number" value={settings.session_timeout}
                                                    onChange={(e) => handleInputChange('session_timeout', parseInt(e.target.value))}
                                                    className={inputCls} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="max_login_attempts" className="text-sm font-medium text-gray-700">Max Login Attempts</Label>
                                                <Input id="max_login_attempts" type="number" value={settings.max_login_attempts}
                                                    onChange={(e) => handleInputChange('max_login_attempts', parseInt(e.target.value))}
                                                    className={inputCls} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password_min_length" className="text-sm font-medium text-gray-700">Minimum Password Length</Label>
                                            <Input id="password_min_length" type="number" value={settings.password_min_length}
                                                onChange={(e) => handleInputChange('password_min_length', parseInt(e.target.value))}
                                                className={inputCls} />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-700">Wajib Ganti Password</Label>
                                                <p className="text-xs text-gray-500 mt-0.5">{getDescription('require_password_change', 'User harus ganti password saat login pertama')}</p>
                                            </div>
                                            <Switch checked={settings.require_password_change}
                                                onCheckedChange={(checked) => handleInputChange('require_password_change', checked)} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notification Settings */}
                            {activeTab === 'notifications' && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <Bell className="w-5 h-5 text-blue-600" />
                                            <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-700">Email Notifications</Label>
                                                <p className="text-xs text-gray-500 mt-0.5">{getDescription('email_notifications', 'Kirim notifikasi via email')}</p>
                                            </div>
                                            <Switch checked={settings.email_notifications}
                                                onCheckedChange={(checked) => handleInputChange('email_notifications', checked)} />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-700">SMS Notifications</Label>
                                                <p className="text-xs text-gray-500 mt-0.5">{getDescription('sms_notifications', 'Kirim notifikasi via SMS')}</p>
                                            </div>
                                            <Switch checked={settings.sms_notifications}
                                                onCheckedChange={(checked) => handleInputChange('sms_notifications', checked)} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Email Settings */}
                            {activeTab === 'email' && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-5 h-5 text-blue-600" />
                                            <h2 className="text-lg font-semibold text-gray-900">Email Configuration</h2>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="smtp_host" className="text-sm font-medium text-gray-700">SMTP Host</Label>
                                                <Input id="smtp_host" value={settings.smtp_host}
                                                    onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                                                    className={inputCls} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="smtp_port" className="text-sm font-medium text-gray-700">SMTP Port</Label>
                                                <Input id="smtp_port" type="number" value={settings.smtp_port}
                                                    onChange={(e) => handleInputChange('smtp_port', parseInt(e.target.value))}
                                                    className={inputCls} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="smtp_username" className="text-sm font-medium text-gray-700">SMTP Username</Label>
                                                <Input id="smtp_username" value={settings.smtp_username}
                                                    onChange={(e) => handleInputChange('smtp_username', e.target.value)}
                                                    className={inputCls} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="smtp_password" className="text-sm font-medium text-gray-700">SMTP Password</Label>
                                                <Input id="smtp_password" type="password" value={settings.smtp_password}
                                                    onChange={(e) => handleInputChange('smtp_password', e.target.value)}
                                                    className={inputCls} />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-700">Use TLS</Label>
                                                <p className="text-xs text-gray-500 mt-0.5">{getDescription('smtp_use_tls', 'Gunakan enkripsi TLS untuk koneksi SMTP')}</p>
                                            </div>
                                            <Switch checked={settings.smtp_use_tls}
                                                onCheckedChange={(checked) => handleInputChange('smtp_use_tls', checked)} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Contact Settings */}
                            {activeTab === 'contact' && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-5 h-5 text-blue-600" />
                                            <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="contact_email" className="text-sm font-medium text-gray-700">Email</Label>
                                                <Input id="contact_email" type="email" value={settings.contact_email}
                                                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                                                    placeholder="email@example.com" className={inputCls} />
                                                <p className="text-xs text-gray-400">{getDescription('contact_email', 'Email kontak utama organisasi')}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="contact_phone" className="text-sm font-medium text-gray-700">Telepon</Label>
                                                <Input id="contact_phone" value={settings.contact_phone}
                                                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                                                    placeholder="(0756) 21046" className={inputCls} />
                                                <p className="text-xs text-gray-400">{getDescription('contact_phone', 'Nomor telepon utama')}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="contact_fax" className="text-sm font-medium text-gray-700">Fax</Label>
                                                <Input id="contact_fax" value={settings.contact_fax}
                                                    onChange={(e) => handleInputChange('contact_fax', e.target.value)}
                                                    placeholder="(0756) 21046" className={inputCls} />
                                                <p className="text-xs text-gray-400">{getDescription('contact_fax', 'Nomor fax')}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="contact_postal_code" className="text-sm font-medium text-gray-700">Kode Pos</Label>
                                                <Input id="contact_postal_code" value={settings.contact_postal_code}
                                                    onChange={(e) => handleInputChange('contact_postal_code', e.target.value)}
                                                    placeholder="25652" className={inputCls} />
                                                <p className="text-xs text-gray-400">{getDescription('contact_postal_code', 'Kode pos kantor')}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="contact_address" className="text-sm font-medium text-gray-700">Alamat</Label>
                                            <Textarea id="contact_address" value={settings.contact_address}
                                                onChange={(e) => handleInputChange('contact_address', e.target.value)}
                                                rows={3} placeholder="Jl. Ilyas Yacub Paiman, Kec. IV Jurai..." className={inputCls} />
                                            <p className="text-xs text-gray-400">{getDescription('contact_address', 'Alamat lengkap kantor')}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="contact_website" className="text-sm font-medium text-gray-700">Website</Label>
                                            <Input id="contact_website" type="url" value={settings.contact_website}
                                                onChange={(e) => handleInputChange('contact_website', e.target.value)}
                                                placeholder="https://example.com" className={inputCls} />
                                            <p className="text-xs text-gray-400">{getDescription('contact_website', 'URL website resmi')}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Backup Settings */}
                            {activeTab === 'backup' && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <Database className="w-5 h-5 text-blue-600" />
                                            <h2 className="text-lg font-semibold text-gray-900">Backup Configuration</h2>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-700">Auto Backup</Label>
                                                <p className="text-xs text-gray-500 mt-0.5">{getDescription('auto_backup', 'Backup otomatis database dan files')}</p>
                                            </div>
                                            <Switch checked={settings.auto_backup}
                                                onCheckedChange={(checked) => handleInputChange('auto_backup', checked)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="backup_frequency" className="text-sm font-medium text-gray-700">Backup Frequency</Label>
                                            <select id="backup_frequency" value={settings.backup_frequency}
                                                onChange={(e) => handleInputChange('backup_frequency', e.target.value)}
                                                className={selectCls}>
                                                <option value="hourly">Setiap Jam</option>
                                                <option value="daily">Harian</option>
                                                <option value="weekly">Mingguan</option>
                                                <option value="monthly">Bulanan</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                                            <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                                <Database className="w-4 h-4" /> Backup Sekarang
                                            </button>
                                            <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                                <RefreshCw className="w-4 h-4" /> Restore Backup
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Appearance Settings */}
                            {activeTab === 'appearance' && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <Palette className="w-5 h-5 text-blue-600" />
                                            <h2 className="text-lg font-semibold text-gray-900">Appearance Settings</h2>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="default_theme" className="text-sm font-medium text-gray-700">Default Theme</Label>
                                            <select id="default_theme" value={settings.default_theme}
                                                onChange={(e) => handleInputChange('default_theme', e.target.value)}
                                                className={selectCls}>
                                                <option value="light">Light</option>
                                                <option value="dark">Dark</option>
                                                <option value="auto">Auto (System)</option>
                                            </select>
                                        </div>

                                        {/* Logo Upload */}
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700">Logo Aplikasi</Label>
                                            <p className="text-xs text-gray-500 mb-3">{getDescription('logo', 'Upload logo aplikasi (PNG, JPG, SVG - Max 2MB)')}</p>
                                            <div className="flex items-start gap-4">
                                                <div className="relative w-32 h-32 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50 flex-shrink-0">
                                                    {logoPreview ? (
                                                        <>
                                                            <img src={logoPreview} alt="Logo Preview" className="max-w-full max-h-full object-contain p-3" />
                                                            <button type="button" onClick={handleRemoveLogo}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md transition-colors">
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <ImageIcon className="w-10 h-10 text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <input ref={logoInputRef} type="file" id="logo_upload" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                                    <button type="button" onClick={() => logoInputRef.current?.click()}
                                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                                        <Upload className="w-4 h-4" /> Upload Logo
                                                    </button>
                                                    <p className="text-xs text-gray-400 mt-2">Rekomendasi: 200x200px, format PNG transparan</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Favicon Upload */}
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700">Favicon</Label>
                                            <p className="text-xs text-gray-500 mb-3">{getDescription('favicon', 'Upload favicon (ICO, PNG - Max 1MB)')}</p>
                                            <div className="flex items-start gap-4">
                                                <div className="relative w-16 h-16 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50 flex-shrink-0">
                                                    {faviconPreview ? (
                                                        <>
                                                            <img src={faviconPreview} alt="Favicon Preview" className="max-w-full max-h-full object-contain p-1" />
                                                            <button type="button" onClick={handleRemoveFavicon}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md transition-colors">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <ImageIcon className="w-7 h-7 text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <input ref={faviconInputRef} type="file" id="favicon_upload" accept="image/*,.ico" onChange={handleFaviconUpload} className="hidden" />
                                                    <button type="button" onClick={() => faviconInputRef.current?.click()}
                                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                                        <Upload className="w-4 h-4" /> Upload Favicon
                                                    </button>
                                                    <p className="text-xs text-gray-400 mt-2">Rekomendasi: 32x32px atau 16x16px, format ICO/PNG</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
