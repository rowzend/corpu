'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    roleService,
    permissionService,
    type RoleDetail,
    type PermissionModule,
    type PermissionRule,
} from '@/lib/services';
import { showSuccess, showError, showLoading, closeLoading } from '@/lib/sweetalert';
import { handleApiError } from '@/lib/api';
import { ArrowLeft, Save, Loader2, Shield, Key, Check, X, ChevronDown, ChevronRight } from 'lucide-react';

export default function RolePermissionsPage() {
    const params = useParams();
    const router = useRouter();
    const roleId = parseInt(params.id as string);

    const [role, setRole] = useState<RoleDetail | null>(null);
    const [modules, setModules] = useState<PermissionModule[]>([]);
    const [allRules, setAllRules] = useState<PermissionRule[]>([]);
    const [selectedRuleIds, setSelectedRuleIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedModule, setSelectedModule] = useState<number | null>(null);
    const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

    useEffect(() => { loadData(); }, [roleId]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const [roleData, modulesData, rulesData] = await Promise.all([
                roleService.getRoleById(roleId),
                permissionService.getModules(),
                permissionService.getRules(),
            ]);
            setRole(roleData);
            setModules(modulesData);
            setAllRules(rulesData);
            setExpandedModules(new Set(modulesData.map(m => m.id)));
            const currentPermissionIds = new Set(roleData.permissions.map(p => p.rule));
            setSelectedRuleIds(currentPermissionIds);
        } catch (err) {
            const message = handleApiError(err);
            setError(message);
            showError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleRule = (ruleId: number) => {
        setSelectedRuleIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(ruleId)) newSet.delete(ruleId);
            else newSet.add(ruleId);
            return newSet;
        });
    };

    const handleToggleModule = (moduleId: number) => {
        const moduleRules = allRules.filter(r => r.module === moduleId);
        const allSelected = moduleRules.every(r => selectedRuleIds.has(r.id));
        setSelectedRuleIds(prev => {
            const newSet = new Set(prev);
            moduleRules.forEach(rule => {
                if (allSelected) newSet.delete(rule.id);
                else newSet.add(rule.id);
            });
            return newSet;
        });
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            showLoading('Menyimpan permission...');
            await roleService.updateRolePermissions(roleId, Array.from(selectedRuleIds));
            closeLoading();
            showSuccess('Permission berhasil diperbarui');
            router.push('/admin/roles');
        } catch (error) {
            closeLoading();
            showError(handleApiError(error));
        } finally {
            setIsSaving(false);
        }
    };

    const toggleExpanded = (moduleId: number) => {
        setExpandedModules(prev => {
            const newSet = new Set(prev);
            if (newSet.has(moduleId)) newSet.delete(moduleId);
            else newSet.add(moduleId);
            return newSet;
        });
    };

    const getModuleStats = (moduleId: number) => {
        const moduleRules = allRules.filter(r => r.module === moduleId);
        const selectedCount = moduleRules.filter(r => selectedRuleIds.has(r.id)).length;
        return { total: moduleRules.length, selected: selectedCount };
    };

    if (error) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <Shield className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-card-foreground mb-2">Error Loading Permissions</h2>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <button onClick={loadData}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all">
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading permissions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center gap-4">
                    <button onClick={() => router.push(`/admin/roles/${roleId}`)}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-2 transition-colors flex-shrink-0">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-white truncate">Manage Permissions</h1>
                        <p className="text-blue-100 text-sm truncate">Role: {role?.name}</p>
                    </div>
                    <button onClick={handleSave} disabled={isSaving}
                        className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium transition-all text-sm flex-shrink-0">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Modules', value: modules.length, icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Total Rules', value: allRules.length, icon: Key, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Selected', value: selectedRuleIds.size, icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Not Selected', value: allRules.length - selectedRuleIds.size, icon: X, color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} rounded-xl p-4`}>
                        <stat.icon className={`w-5 h-5 ${stat.color} mb-1`} />
                        <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Module Filter */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-card-foreground">Filter by Module</h3>
                    <span className="text-xs text-muted-foreground">
                        {selectedRuleIds.size} of {allRules.length} selected
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setSelectedModule(null)}
                        className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                            selectedModule === null
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-card text-card-foreground border border-border hover:bg-muted'
                        }`}>
                        All Modules ({allRules.length})
                    </button>
                    {modules.map(mod => {
                        const stats = getModuleStats(mod.id);
                        return (
                            <button key={mod.id} onClick={() => setSelectedModule(mod.id)}
                                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                                    selectedModule === mod.id
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-card text-card-foreground border border-border hover:bg-muted'
                                }`}>
                                {mod.name} <span className="opacity-70">({stats.selected}/{stats.total})</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Permissions by Module */}
            <div className="space-y-3">
                {modules
                    .filter(m => selectedModule === null || m.id === selectedModule)
                    .map(module => {
                        const moduleRules = allRules.filter(r => r.module === module.id);
                        if (moduleRules.length === 0) return null;

                        const stats = getModuleStats(module.id);
                        const allSelected = stats.selected === stats.total;
                        const isExpanded = expandedModules.has(module.id);

                        return (
                            <div key={module.id}
                                className="bg-card rounded-xl shadow-sm border border-border overflow-hidden transition-all">
                                {/* Module Header */}
                                <div className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => toggleExpanded(module.id)}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        {isExpanded
                                            ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                            : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        }
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-card-foreground text-sm">{module.name}</h3>
                                            <p className="text-xs text-muted-foreground truncate">{module.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0 ml-3"
                                        onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${
                                                    allSelected ? 'bg-green-500' : stats.selected > 0 ? 'bg-blue-500' : 'bg-muted'
                                                }`}
                                                    style={{ width: `${(stats.selected / stats.total) * 100}%` }} />
                                            </div>
                                            <span className="text-xs text-muted-foreground w-14 text-right">{stats.selected}/{stats.total}</span>
                                        </div>
                                        <button onClick={() => handleToggleModule(module.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                allSelected
                                                    ? 'bg-red-50 text-red-600 dark:text-red-400 hover:bg-red-100'
                                                    : 'bg-blue-50 text-blue-600 dark:text-blue-400 hover:bg-blue-100'
                                            }`}>
                                            {allSelected ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Rules */}
                                {isExpanded && (
                                    <div className="px-5 pb-4 border-t border-border">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-4">
                                            {moduleRules.map(rule => {
                                                const isSelected = selectedRuleIds.has(rule.id);
                                                return (
                                                    <label key={rule.id}
                                                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                                            isSelected
                                                                ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-50'
                                                                : 'border-border bg-card hover:bg-muted hover:bg-muted hover:border-border'
                                                        }`}>
                                                        <div className={`relative w-5 h-5 mt-0.5 flex-shrink-0 rounded-md border-2 transition-all ${
                                                            isSelected
                                                                ? 'bg-blue-600 border-blue-600'
                                                                : 'bg-card border-border'
                                                        }`}>
                                                            {isSelected && (
                                                                <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto pointer-events-none" />
                                                            )}
                                                            <input type="checkbox" checked={isSelected}
                                                                onChange={() => handleToggleRule(rule.id)}
                                                                className="absolute inset-0 opacity-0 cursor-pointer" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-sm font-medium text-card-foreground truncate">
                                                                {rule.function_name}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                                {rule.module_name} &rarr; {rule.control_name}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground font-mono mt-1 bg-muted px-2 py-0.5 rounded inline-block">
                                                                {rule.permission_string}
                                                            </div>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </div>

            {/* Bottom Save */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-5 flex items-center justify-between sticky bottom-4">
                <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-card-foreground">{selectedRuleIds.size}</span> of {allRules.length} permissions selected
                </div>
                <div className="flex gap-2">
                    <button onClick={() => router.push(`/admin/roles/${roleId}`)}
                        className="px-5 py-2.5 border border-border rounded-xl font-medium text-sm text-card-foreground hover:bg-muted hover:bg-muted transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={isSaving}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
