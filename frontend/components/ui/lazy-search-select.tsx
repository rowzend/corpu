'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, X, Loader2 } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface LazySearchSelectProps {
  fetchFn: (query: string) => Promise<Option[]>;
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  minChars?: number;
  disabled?: boolean;
  disabledLabel?: string;
  defaultLabel?: string;
  className?: string;
}

export function LazySearchSelect({
  fetchFn,
  value,
  onChange,
  placeholder = 'Pilih...',
  emptyText = 'Tidak ada data',
  searchPlaceholder = 'Ketik minimal 3 karakter...',
  minChars = 3,
  disabled = false,
  disabledLabel = '',
  defaultLabel = '',
  className = '',
}: LazySearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
        setOptions([]);
        setFetched(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!value) {
      setSelectedLabel('');
    } else {
      const match = options.find(o => o.value === value);
      if (match) setSelectedLabel(match.label);
      else if (defaultLabel) setSelectedLabel(defaultLabel);
    }
  }, [value, options, defaultLabel]);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < minChars) {
      setOptions([]);
      setFetched(false);
      return;
    }
    setLoading(true);
    setFetched(false);
    try {
      const results = await fetchFn(q);
      setOptions(results);
      setFetched(true);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, minChars]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, open, doSearch]);

  function handleSelect(optionValue: string | number) {
    const option = options.find(o => o.value === optionValue);
    if (option) setSelectedLabel(option.label);
    onChange(optionValue);
    setOpen(false);
    setSearch('');
    setOptions([]);
    setFetched(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    setSearch('');
    setOptions([]);
    setFetched(false);
    setSelectedLabel('');
  }

  const displayText = selectedOption
    ? selectedOption.label
    : value && selectedLabel
      ? selectedLabel
      : disabled && disabledLabel
        ? disabledLabel
        : placeholder;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) setOpen(!open); }}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm rounded-lg border-2 transition-all ${
          open
            ? 'border-indigo-500 ring-2 ring-indigo-500/20'
            : 'border-border hover:border-border'
        } ${disabled ? 'bg-muted cursor-not-allowed' : 'bg-card cursor-pointer'} ${
          !selectedOption ? 'text-muted-foreground' : 'text-foreground'
        }`}
      >
        <span className="truncate">{displayText}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {loading && (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          )}
          {(selectedOption || (value && selectedLabel)) && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {loading ? (
              <p className="px-3 py-6 text-sm text-muted-foreground text-center">Memuat...</p>
            ) : search.length < minChars ? (
              <p className="px-3 py-6 text-sm text-muted-foreground text-center">
                Ketik minimal {minChars} karakter untuk mencari
              </p>
            ) : fetched && options.length === 0 ? (
              <p className="px-3 py-6 text-sm text-muted-foreground text-center">{emptyText}</p>
            ) : (
              options.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-indigo-50 ${
                    value === option.value
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-foreground'
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
