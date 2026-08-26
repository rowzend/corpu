'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
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
import { handleApiError } from '@/lib/api';
import { getSettings, batchUpdateSettings, type AppSetting } from '@/lib/api/settings';
import { getAdminHeroImages, createHeroImage, updateHeroImage, deleteHeroImage, type HeroImageItem } from '@/lib/api/hero';
import { useTheme } from '@/components/providers/ThemeProvider';

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
    hero_title1: string;
    hero_title2: string;
    hero_title3: string;
    hero_subtitle: string;
}

interface SettingMetadata {
    description: string;
    category: string;
}

export default function SettingsPage() {
    const t = useTranslations('admin.settings');
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
        contact_website: '',
        hero_title1: 'Pesisir Selatan',
        hero_title2: 'Corporate University',
        hero_title3: '',
        hero_subtitle: 'Digital learning platform for capacity building of professional, competent, and high-integrity State Civil Apparatus.'
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

    // Hero state
    const [heroImages, setHeroImages] = useState<HeroImageItem[]>([]);
    const [heroModalOpen, setHeroModalOpen] = useState(false);
    const [editingHero, setEditingHero] = useState<HeroImageItem | null>(null);
    const [heroForm, setHeroForm] = useState({ name: '', description: '', order: 0, is_active: true });
    const [heroFile, setHeroFile] = useState<File | null>(null);
    const [heroLoading, setHeroLoading] = useState(false);
    const heroFileRef = useRef<HTMLInputElement>(null);
    const { setTheme } = useTheme();

    useEffect(() => {
        const saved = localStorage.getItem('theme') || 'light';
        setSettings(prev => ({ ...prev, default_theme: saved }));
        loadSettings();
        loadHeroImages();
    }, []);

    const loadHeroImages = async () => {
        try {
            const images = await getAdminHeroImages();
            setHeroImages(images);
        } catch { /* silent */ }
    };

    const openHeroModal = (hero: HeroImageItem | null = null) => {
        if (hero) {
            setEditingHero(hero);
            setHeroForm({ name: hero.name, description: hero.description || '', order: hero.order, is_active: hero.is_active });
        } else {
            setEditingHero(null);
            setHeroForm({ name: '', description: '', order: heroImages.length, is_active: true });
        }
        setHeroFile(null);
        if (heroFileRef.current) heroFileRef.current.value = '';
        setHeroModalOpen(true);
    };

    const handleHeroSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!heroForm.name.trim()) { showError(t('hero_name_required')); return; }
        if (!editingHero && !heroFile) { showError(t('hero_image_required')); return; }

        setHeroLoading(true);
        try {
            const fd = new FormData();
            fd.append('name', heroForm.name);
            fd.append('description', heroForm.description);
            fd.append('order', heroForm.order.toString());
            fd.append('is_active', heroForm.is_active.toString());
            if (heroFile) fd.append('image', heroFile);

            if (editingHero) {
                await updateHeroImage(editingHero.id, fd);
                showToast(t('hero_update_success'), 'success');
            } else {
                await createHeroImage(fd);
                showToast(t('hero_create_success'), 'success');
            }
            setHeroModalOpen(false);
            loadHeroImages();
        } catch (error: any) {
            showError(handleApiError(error));
        } finally {
            setHeroLoading(false);
        }
    };

    const handleDeleteHero = async (id: number) => {
        if (!confirm(t('hero_delete_confirm'))) return;
        try {
            await deleteHeroImage(id);
            showToast(t('hero_delete_success'), 'success');
            loadHeroImages();
        } catch (error: any) {
            showError(handleApiError(error));
        }
    };

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
            showError(handleApiError(error));
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const settingsToUpdate: Record<string, any> = {};
            Object.entries(settings).forEach(([key, value]) => {
                if (availableSettings.has(key) || key.startsWith('hero_title') || key === 'hero_subtitle') {
                    settingsToUpdate[key] = value;
                }
            });

            if (Object.keys(settingsToUpdate).length === 0) {
                showError(t('save_error'));
                return;
            }

            const result = await batchUpdateSettings(settingsToUpdate);
            if (result.failed && result.failed.length > 0) {
                console.error('Failed settings:', result.failed);
                showToast(result.message, 'warning');
            } else {
                showToast(t('save_success'), 'success');
            }
            await loadSettings();
        } catch (error: any) {
            showError(handleApiError(error));
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
        if (!file.type.startsWith('image/')) { showError(t('file_must_be_image')); return; }
        if (file.size > 2 * 1024 * 1024) { showError(t('file_max_2mb')); return; }
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
        if (!file.type.startsWith('image/')) { showError(t('file_must_be_image')); return; }
        if (file.size > 1 * 1024 * 1024) { showError(t('file_max_1mb')); return; }
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
        { id: 'general', label: t('tabs_general'), icon: Settings },
        { id: 'security', label: t('tabs_security'), icon: Shield },
        { id: 'notifications', label: t('tabs_notifications'), icon: Bell },
        { id: 'email', label: t('tabs_email'), icon: Mail },
        { id: 'contact', label: t('tabs_contact'), icon: Phone },
        { id: 'backup', label: t('tabs_backup'), icon: Database },
        { id: 'appearance', label: t('tabs_appearance'), icon: Palette }
    ];

    const selectCls = "w-full px-3 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-muted text-sm";
    const inputCls = "border-border focus:border-blue-500 focus:ring-blue-500";

    return (
        <div className="space-y-6">
            {initialLoading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="text-center">
                        <RefreshCw className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                        <p className="text-muted-foreground">{t('loading')}</p>
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
                                        <h1 className="text-2xl font-bold text-white">{t('page_title')}</h1>
                                        <p className="text-slate-300 text-sm">
                                            {t('page_desc')}
                                            {availableSettings.size > 0 && (
                                                <span className="ml-2 text-blue-300">({availableSettings.size} {t('available_count')})</span>
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
                                        {t('reload')}
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading || availableSettings.size === 0}
                                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Save className="w-4 h-4" />
                                        {loading ? t('saving') : t('save')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {availableSettings.size === 0 && (
                        <div className="bg-amber-50 border border-amber-200 dark:border-amber-700 rounded-xl p-5">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-amber-600 font-bold text-sm">!</span>
                                </div>
                                <div>
                                    <p className="font-medium text-amber-800 text-sm">
                                        {t('no_settings_title')}
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
                            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden sticky top-6">
                                <div className="px-5 py-4 border-b border-border">
                                    <h2 className="font-semibold text-card-foreground text-sm">{t('category_title')}</h2>
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
                                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 dark:text-blue-400 shadow-sm'
                                                        : 'text-muted-foreground hover:bg-muted hover:bg-muted hover:text-card-foreground'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-muted-foreground'}`} />
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
                                <div className="bg-card rounded-xl shadow-sm border border-border">
                                    <div className="px-6 py-4 border-b border-border">
                                        <div className="flex items-center gap-2">
                                        <Settings className="w-5 h-5 text-blue-600" />
                                        <h2 className="text-lg font-semibold text-card-foreground">{t('section_general')}</h2>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                    <Label htmlFor="app_name" className="text-sm font-medium text-foreground">{t('label_app_name')}</Label>
                                                <Input id="app_name" value={settings.app_name}
                                                    onChange={(e) => handleInputChange('app_name', e.target.value)}
                                                    className={inputCls} />
                                            </div>
                                            <div className="space-y-2">
                                                    <Label htmlFor="app_version" className="text-sm font-medium text-foreground">{t('label_app_version')}</Label>
                                                <Input id="app_version" value={settings.app_version}
                                                    onChange={(e) => handleInputChange('app_version', e.target.value)}
                                                    className={inputCls} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="app_description" className="text-sm font-medium text-foreground">{t('label_app_description')}</Label>
                                            <Textarea id="app_description" value={settings.app_description}
                                                onChange={(e) => handleInputChange('app_description', e.target.value)}
                                                rows={3} className={inputCls} />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                                            <div>
                                                <Label className="text-sm font-medium text-foreground">{t('label_maintenance_mode')}</Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">{getDescription('maintenance_mode', t('label_maintenance_mode'))}</p>
                                            </div>
                                            <Switch checked={settings.maintenance_mode}
                                                onCheckedChange={(checked) => handleInputChange('maintenance_mode', checked)} />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                                            <div>
                                                <Label className="text-sm font-medium text-foreground">{t('label_registration_enabled')}</Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">{getDescription('registration_enabled', t('label_registration_enabled'))}</p>
                                            </div>
                                            <Switch checked={settings.registration_enabled}
                                                onCheckedChange={(checked) => handleInputChange('registration_enabled', checked)} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Security Settings */}
                            {activeTab === 'security' && (
                                <div className="bg-card rounded-xl shadow-sm border border-border">
                                    <div className="px-6 py-4 border-b border-border">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-blue-600" />
                                            <h2 className="text-lg font-semibold text-card-foreground">{t('section_security')}</h2>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="session_timeout" className="text-sm font-medium text-foreground">{t('label_session_timeout')}</Label>
                                                <Input id="session_timeout" type="number" value={settings.session_timeout}
                                                    onChange={(e) => handleInputChange('session_timeout', parseInt(e.target.value))}
                                                    className={inputCls} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="max_login_attempts" className="text-sm font-medium text-foreground">{t('label_max_login_attempts')}</Label>
                                                <Input id="max_login_attempts" type="number" value={settings.max_login_attempts}
                                                    onChange={(e) => handleInputChange('max_login_attempts', parseInt(e.target.value))}
                                                    className={inputCls} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                                <Label htmlFor="password_min_length" className="text-sm font-medium text-foreground">{t('label_password_min_length')}</Label>
                                            <Input id="password_min_length" type="number" value={settings.password_min_length}
                                                onChange={(e) => handleInputChange('password_min_length', parseInt(e.target.value))}
                                                className={inputCls} />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                                            <div>
                                                <Label className="text-sm font-medium text-foreground">{t('label_require_password_change')}</Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">{getDescription('require_password_change', t('label_require_password_change'))}</p>
                                            </div>
                                            <Switch checked={settings.require_password_change}
                                                onCheckedChange={(checked) => handleInputChange('require_password_change', checked)} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notification Settings */}
                            {activeTab === 'notifications' && (
                                <div className="bg-card rounded-xl shadow-sm border border-border">
                                    <div className="px-6 py-4 border-b border-border">
                                        <div className="flex items-center gap-2">
                                            <Bell className="w-5 h-5 text-blue-600" />
                                            <h2 className="text-lg font-semibold text-card-foreground">{t('section_notifications')}</h2>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                                            <div>
                                                <Label className="text-sm font-medium text-foreground">{t('label_email_notifications')}</Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">{getDescription('email_notifications', t('label_email_notifications'))}</p>
                                            </div>
                                            <Switch checked={settings.email_notifications}
                                                onCheckedChange={(checked) => handleInputChange('email_notifications', checked)} />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                                            <div>
                                                <Label className="text-sm font-medium text-foreground">{t('label_sms_notifications')}</Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">{getDescription('sms_notifications', t('label_sms_notifications'))}</p>
                                            </div>
                                            <Switch checked={settings.sms_notifications}
                                                onCheckedChange={(checked) => handleInputChange('sms_notifications', checked)} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Email Settings */}
                            {activeTab === 'email' && (
                                <div className="bg-card rounded-xl shadow-sm border border-border">
                                    <div className="px-6 py-4 border-b border-border">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-5 h-5 text-blue-600" />
                                            <h2 className="text-lg font-semibold text-card-foreground">{t('section_email')}</h2>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="smtp_host" className="text-sm font-medium text-foreground">{t('label_smtp_host')}</Label>
                                                <Input id="smtp_host" value={settings.smtp_host}
                                                    onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                                                    className={inputCls} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="smtp_port" className="text-sm font-medium text-foreground">{t('label_smtp_port')}</Label>
                                                <Input id="smtp_port" type="number" value={settings.smtp_port}
                                                    onChange={(e) => handleInputChange('smtp_port', parseInt(e.target.value))}
                                                    className={inputCls} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="smtp_username" className="text-sm font-medium text-foreground">{t('label_smtp_username')}</Label>
                                                <Input id="smtp_username" value={settings.smtp_username}
                                                    onChange={(e) => handleInputChange('smtp_username', e.target.value)}
                                                    className={inputCls} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="smtp_password" className="text-sm font-medium text-foreground">{t('label_smtp_password')}</Label>
                                                <Input id="smtp_password" type="password" value={settings.smtp_password}
                                                    onChange={(e) => handleInputChange('smtp_password', e.target.value)}
                                                    className={inputCls} />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                                            <div>
                                                <Label className="text-sm font-medium text-foreground">{t('label_use_tls')}</Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">{getDescription('smtp_use_tls', t('label_use_tls'))}</p>
                                            </div>
                                            <Switch checked={settings.smtp_use_tls}
                                                onCheckedChange={(checked) => handleInputChange('smtp_use_tls', checked)} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Contact Settings */}
                            {activeTab === 'contact' && (
                                <div className="bg-card rounded-xl shadow-sm border border-border">
                                    <div className="px-6 py-4 border-b border-border">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-5 h-5 text-blue-600" />
                                            <h2 className="text-lg font-semibold text-card-foreground">{t('section_contact')}</h2>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="contact_email" className="text-sm font-medium text-foreground">{t('label_contact_email')}</Label>
                                                <Input id="contact_email" type="email" value={settings.contact_email}
                                                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                                                    placeholder="email@example.com" className={inputCls} />
                                                <p className="text-xs text-muted-foreground">{getDescription('contact_email', 'Email kontak utama organisasi')}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="contact_phone" className="text-sm font-medium text-foreground">{t('label_contact_phone')}</Label>
                                                <Input id="contact_phone" value={settings.contact_phone}
                                                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                                                    placeholder="(0756) 21046" className={inputCls} />
                                                <p className="text-xs text-muted-foreground">{getDescription('contact_phone', 'Nomor telepon utama')}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="contact_fax" className="text-sm font-medium text-foreground">{t('label_contact_fax')}</Label>
                                                <Input id="contact_fax" value={settings.contact_fax}
                                                    onChange={(e) => handleInputChange('contact_fax', e.target.value)}
                                                    placeholder="(0756) 21046" className={inputCls} />
                                                <p className="text-xs text-muted-foreground">{getDescription('contact_fax', 'Nomor fax')}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="contact_postal_code" className="text-sm font-medium text-foreground">{t('label_contact_postal_code')}</Label>
                                                <Input id="contact_postal_code" value={settings.contact_postal_code}
                                                    onChange={(e) => handleInputChange('contact_postal_code', e.target.value)}
                                                    placeholder="25652" className={inputCls} />
                                                <p className="text-xs text-muted-foreground">{getDescription('contact_postal_code', 'Kode pos kantor')}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                                <Label htmlFor="contact_address" className="text-sm font-medium text-foreground">{t('label_contact_address')}</Label>
                                            <Textarea id="contact_address" value={settings.contact_address}
                                                onChange={(e) => handleInputChange('contact_address', e.target.value)}
                                                rows={3} placeholder="Jl. Ilyas Yacub Paiman, Kec. IV Jurai..." className={inputCls} />
                                            <p className="text-xs text-muted-foreground">{getDescription('contact_address', 'Alamat lengkap kantor')}</p>
                                        </div>
                                        <div className="space-y-2">
                                                <Label htmlFor="contact_website" className="text-sm font-medium text-foreground">{t('label_contact_website')}</Label>
                                            <Input id="contact_website" type="url" value={settings.contact_website}
                                                onChange={(e) => handleInputChange('contact_website', e.target.value)}
                                                placeholder="https://example.com" className={inputCls} />
                                            <p className="text-xs text-muted-foreground">{getDescription('contact_website', 'URL website resmi')}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Backup Settings */}
                            {activeTab === 'backup' && (
                                <div className="bg-card rounded-xl shadow-sm border border-border">
                                    <div className="px-6 py-4 border-b border-border">
                                        <div className="flex items-center gap-2">
                                            <Database className="w-5 h-5 text-blue-600" />
                                            <h2 className="text-lg font-semibold text-card-foreground">{t('section_backup')}</h2>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                                            <div>
                                                <Label className="text-sm font-medium text-foreground">{t('label_auto_backup')}</Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">{getDescription('auto_backup', t('label_auto_backup'))}</p>
                                            </div>
                                            <Switch checked={settings.auto_backup}
                                                onCheckedChange={(checked) => handleInputChange('auto_backup', checked)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="backup_frequency" className="text-sm font-medium text-foreground">{t('label_backup_frequency')}</Label>
                                            <select id="backup_frequency" value={settings.backup_frequency}
                                                onChange={(e) => handleInputChange('backup_frequency', e.target.value)}
                                                className={selectCls}>
                                                <option value="hourly">{t('frequency_hourly')}</option>
                                                <option value="daily">{t('frequency_daily')}</option>
                                                <option value="weekly">{t('frequency_weekly')}</option>
                                                <option value="monthly">{t('frequency_monthly')}</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-3 pt-4 border-t border-border">
                                            <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-card-foreground bg-card border border-border rounded-xl hover:bg-muted hover:bg-muted transition-colors">
                                                <Database className="w-4 h-4" /> {t('backup_now')}
                                            </button>
                                            <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-card-foreground bg-card border border-border rounded-xl hover:bg-muted hover:bg-muted transition-colors">
                                                <RefreshCw className="w-4 h-4" /> {t('restore_backup')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Appearance Settings */}
                            {activeTab === 'appearance' && (
                                <div className="bg-card rounded-xl shadow-sm border border-border">
                                    <div className="px-6 py-4 border-b border-border">
                                        <div className="flex items-center gap-2">
                                            <Palette className="w-5 h-5 text-blue-600" />
                                            <h2 className="text-lg font-semibold text-card-foreground">{t('section_appearance')}</h2>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="default_theme" className="text-sm font-medium text-foreground">{t('label_default_theme')}</Label>
                                            <select id="default_theme" value={settings.default_theme}
                                                onChange={(e) => {
                                                    handleInputChange('default_theme', e.target.value);
                                                    setTheme(e.target.value as 'light' | 'dark' | 'system');
                                                    localStorage.setItem('theme', e.target.value);
                                                }}
                                                className={selectCls}>
                                                <option value="light">{t('theme_light')}</option>
                                                <option value="dark">{t('theme_dark')}</option>
                                                <option value="system">{t('theme_system')}</option>
                                            </select>
                                        </div>

                                        {/* Logo Upload */}
                                        <div>
                                            <Label className="text-sm font-medium text-foreground">{t('label_logo')}</Label>
                                            <p className="text-xs text-muted-foreground mb-3">{getDescription('logo', t('label_logo'))}</p>
                                            <div className="flex items-start gap-4">
                                                <div className="relative w-32 h-32 border-2 border-dashed border-border rounded-xl flex items-center justify-center bg-muted flex-shrink-0">
                                                    {logoPreview ? (
                                                        <>
                                                            <img src={logoPreview} alt="Logo Preview" className="max-w-full max-h-full object-contain p-3" />
                                                            <button type="button" onClick={handleRemoveLogo}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md transition-colors">
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <ImageIcon className="w-10 h-10 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <input ref={logoInputRef} type="file" id="logo_upload" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                                    <button type="button" onClick={() => logoInputRef.current?.click()}
                                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-card-foreground bg-card border border-border rounded-xl hover:bg-muted hover:bg-muted transition-colors">
                                                        <Upload className="w-4 h-4" /> {t('upload_logo')}
                                                    </button>
                                                    <p className="text-xs text-muted-foreground mt-2">{t('logo_recommendation')}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Favicon Upload */}
                                        <div>
                                            <Label className="text-sm font-medium text-foreground">{t('label_favicon')}</Label>
                                            <p className="text-xs text-muted-foreground mb-3">{getDescription('favicon', t('label_favicon'))}</p>
                                            <div className="flex items-start gap-4">
                                                <div className="relative w-16 h-16 border-2 border-dashed border-border rounded-xl flex items-center justify-center bg-muted flex-shrink-0">
                                                    {faviconPreview ? (
                                                        <>
                                                            <img src={faviconPreview} alt="Favicon Preview" className="max-w-full max-h-full object-contain p-1" />
                                                            <button type="button" onClick={handleRemoveFavicon}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md transition-colors">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <ImageIcon className="w-7 h-7 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <input ref={faviconInputRef} type="file" id="favicon_upload" accept="image/*,.ico" onChange={handleFaviconUpload} className="hidden" />
                                                    <button type="button" onClick={() => faviconInputRef.current?.click()}
                                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-card-foreground bg-card border border-border rounded-xl hover:bg-muted hover:bg-muted transition-colors">
                                                        <Upload className="w-4 h-4" /> {t('upload_favicon')}
                                                    </button>
                                                    <p className="text-xs text-muted-foreground mt-2">{t('favicon_recommendation')}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hero Images Management */}
                                        <div className="pt-6 border-t border-border">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h3 className="text-base font-semibold text-card-foreground">{t('hero_section_title')}</h3>
                                                    <p className="text-xs text-muted-foreground">{t('hero_section_desc')}</p>
                                                </div>
                                                <button onClick={() => openHeroModal()}
                                                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm">
                                                    <Upload className="w-4 h-4" /> {t('hero_add')}
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {heroImages.map(img => (
                                                    <div key={img.id} className="relative group bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
                                                        <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                                                            {img.image_url ? (
                                                                <img src={img.image_url} alt={img.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-2xl">
                                                                    {img.name.charAt(0)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="p-3">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <h4 className="font-semibold text-sm text-card-foreground truncate">{img.name}</h4>
                                                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${img.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                                                                    {img.is_active ? t('hero_active') : t('hero_inactive')}
                                                                </span>
                                                            </div>
                                                            {img.description && <p className="text-xs text-muted-foreground truncate">{img.description}</p>}
                                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                                                                <span className="text-[11px] text-muted-foreground">{t('hero_order')}: {img.order}</span>
                                                                <div className="flex gap-1">
                                                                    <button onClick={() => openHeroModal(img)}
                                                                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">{t('hero_edit')}</button>
                                                                    <button onClick={() => handleDeleteHero(img.id)}
                                                                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 font-medium px-2 py-1 rounded-md hover:bg-red-50 transition-colors">{t('hero_delete')}</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {heroImages.length === 0 && (
                                                    <div className="col-span-full py-12 text-center text-muted-foreground">
                                                        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-muted flex items-center justify-center">
                                                            <Upload className="w-6 h-6 text-muted-foreground" />
                                                        </div>
                                                        <p className="text-sm font-medium">{t('hero_section_title')} {t('hero_delete')}</p>
                                                        <p className="text-xs mt-1">{t('hero_add')}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Hero Text Settings */}
                                        <div className="pt-6 border-t border-border">
                                            <h3 className="text-base font-semibold text-card-foreground mb-1">Hero Title & Subtitle</h3>
                                            <p className="text-xs text-muted-foreground mb-4">Judul dan deskripsi yang tampil di hero section landing page.</p>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-foreground">Hero Title (Baris 1)</Label>
                                                    <Input value={settings.hero_title1} onChange={e => setSettings(s => ({ ...s, hero_title1: e.target.value }))}
                                                        placeholder="Pesisir Selatan" className={inputCls} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-foreground">Hero Title (Baris 2 — highlighted)</Label>
                                                    <Input value={settings.hero_title2} onChange={e => setSettings(s => ({ ...s, hero_title2: e.target.value }))}
                                                        placeholder="Corporate University" className={inputCls} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-foreground">Hero Title (Baris 3 — optional)</Label>
                                                    <Input value={settings.hero_title3} onChange={e => setSettings(s => ({ ...s, hero_title3: e.target.value }))}
                                                        placeholder="(opsional)" className={inputCls} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-foreground">Hero Subtitle</Label>
                                                    <Textarea value={settings.hero_subtitle} onChange={e => setSettings(s => ({ ...s, hero_subtitle: e.target.value }))}
                                                        placeholder="Digital learning platform..." rows={3} className={inputCls} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hero Modal */}
                                        {heroModalOpen && (
                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setHeroModalOpen(false)}>
                                                <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                                                    <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                                                        <h3 className="text-lg font-semibold text-card-foreground">{editingHero ? t('hero_edit') : t('hero_add')}</h3>
                                                        <button onClick={() => setHeroModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-muted hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-muted-foreground transition-colors">
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                    <form onSubmit={handleHeroSubmit} className="p-6 space-y-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium text-foreground">{t('hero_name')}</Label>
                                                            <Input value={heroForm.name} onChange={e => setHeroForm(f => ({ ...f, name: e.target.value }))}
                                                                placeholder={t('hero_name')} className={inputCls} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium text-foreground">{t('hero_description')}</Label>
                                                            <Textarea value={heroForm.description} onChange={e => setHeroForm(f => ({ ...f, description: e.target.value }))}
                                                                placeholder={t('hero_description')} rows={2} className={inputCls} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium text-foreground">{t('hero_image')}</Label>
                                                            <div className="flex items-start gap-3">
                                                                <div className="relative w-20 h-20 border-2 border-dashed border-border rounded-xl flex items-center justify-center bg-muted flex-shrink-0 overflow-hidden">
                                                                    {heroFile ? (
                                                                        <img src={URL.createObjectURL(heroFile)} alt="Preview" className="w-full h-full object-cover" />
                                                                    ) : editingHero?.image_url ? (
                                                                        <img src={editingHero.image_url} alt={editingHero.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <ImageIcon className="w-7 h-7 text-muted-foreground" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <input ref={heroFileRef} type="file" accept="image/*" onChange={e => setHeroFile(e.target.files?.[0] || null)} className="hidden" />
                                                                    <button type="button" onClick={() => heroFileRef.current?.click()}
                                                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-card-foreground bg-card border border-border rounded-xl hover:bg-muted hover:bg-muted transition-colors">
                                                                        <Upload className="w-4 h-4" /> {t('hero_image')}
                                                                    </button>
                                                                    <p className="text-xs text-muted-foreground mt-1.5">{t('hero_description')}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-sm font-medium text-foreground">{t('hero_order')}</Label>
                                                                <Input type="number" value={heroForm.order} onChange={e => setHeroForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                                                                    className={inputCls} />
                                                            </div>
                                                            <div className="space-y-2 pt-1">
                                                                <Label className="text-sm font-medium text-foreground">{t('hero_active')}</Label>
                                                                <div className="flex items-center justify-between p-3 bg-muted rounded-xl mt-1">
                                                                    <span className="text-sm text-muted-foreground">{t('hero_active')}</span>
                                                                    <Switch checked={heroForm.is_active}
                                                                        onCheckedChange={checked => setHeroForm(f => ({ ...f, is_active: checked }))} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end gap-2 pt-2">
                                                            <button type="button" onClick={() => setHeroModalOpen(false)}
                                                                className="px-4 py-2 text-sm font-medium text-card-foreground bg-card border border-border rounded-xl hover:bg-muted hover:bg-muted transition-colors">{t('hero_delete')}</button>
                                                            <button type="submit" disabled={heroLoading}
                                                                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-50">
                                                                <Save className="w-4 h-4" /> {heroLoading ? t('saving') : t('save')}
                                                            </button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        )}
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
