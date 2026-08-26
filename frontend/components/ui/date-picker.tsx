'use client';

import { useState, useRef, useEffect } from 'react';
import { CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
    value: string | null;          // Format 'YYYY-MM-DD'
    onChange: (value: string | null) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function pad(n: number): string {
    return n < 10 ? `0${n}` : String(n);
}

function parseISO(value: string | null): Date | null {
    if (!value) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!m) return null;
    const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(date.getTime()) ? null : date;
}

export function formatDisplay(value: string | null): string {
    const date = parseISO(value);
    if (!date) return '';
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
}

export function DatePicker({
    value,
    onChange,
    placeholder = 'Pilih tanggal...',
    className = '',
    disabled = false,
}: DatePickerProps) {
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState<Date>(parseISO(value) || new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    const display = formatDisplay(value);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const changeMonth = (delta: number) => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

    const cells: (string | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push(`${viewDate.getFullYear()}-${pad(viewDate.getMonth() + 1)}-${pad(d)}`);
    }

    const handleSelect = (key: string) => {
        onChange(key);
        setOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(prev => !prev)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border text-sm transition-all ${
                    open
                        ? 'ring-2 ring-teal-500 border-teal-500'
                        : 'hover:border-teal-400'
                } ${disabled ? 'bg-muted cursor-not-allowed' : 'bg-card cursor-pointer'} ${
                    display ? 'text-foreground' : 'text-muted-foreground'
                }`}
            >
                <CalendarIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 text-left truncate">{display || placeholder}</span>
                {display && !disabled && (
                    <span
                        onClick={handleClear}
                        className="p-0.5 rounded hover:bg-muted text-muted-foreground"
                        title="Hapus tanggal"
                    >
                        <X className="w-3.5 h-3.5" />
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-72 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40">
                        <button
                            type="button"
                            onClick={() => changeMonth(-1)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-semibold text-foreground">
                            {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
                        </span>
                        <button
                            type="button"
                            onClick={() => changeMonth(1)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Day names */}
                    <div className="grid grid-cols-7 gap-1 px-3 pt-2">
                        {DAY_NAMES.map(d => (
                            <span key={d} className="text-center text-[10px] font-medium uppercase text-muted-foreground">
                                {d}
                            </span>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 gap-1 p-3">
                        {cells.map((key, i) => {
                            if (!key) return <span key={`empty-${i}`} />;
                            const selected = key === value;
                            const isToday = key === todayKey;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleSelect(key)}
                                    className={`h-8 w-8 mx-auto rounded-lg text-sm flex items-center justify-center transition-colors ${
                                        selected
                                            ? 'bg-teal-500 text-white font-semibold'
                                            : isToday
                                                ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 font-medium'
                                                : 'text-foreground hover:bg-muted'
                                    }`}
                                >
                                    {Number(key.slice(8, 10))}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
