'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, X, Loader2 } from 'lucide-react';
import { renderHtml } from '@/lib/utils';

interface SearchSelectOption {
  value: string | number;
  label: string;
}

interface RemoteSearchSelectProps {
  fetchFn: () => Promise<SearchSelectOption[]>;
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  disabledLabel?: string;
  className?: string;
}

export function RemoteSearchSelect({
  fetchFn,
  value,
  onChange,
  placeholder = 'Pilih...',
  emptyText = 'Tidak ada data',
  searchPlaceholder = 'Cari...',
  disabled = false,
  disabledLabel = '',
  className = '',
}: RemoteSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [allOptions, setAllOptions] = useState<SearchSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = allOptions.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = allOptions.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
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

  // Fetch all data once on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchFn().then(results => {
      if (!cancelled) {
        setAllOptions(results);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [fetchFn]);

  function handleSelect(optionValue: string | number) {
    onChange(optionValue);
    setOpen(false);
    setSearch('');
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    setSearch('');
  }

  const displayText = selectedOption
    ? selectedOption.label
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
        <span className="truncate" dangerouslySetInnerHTML={renderHtml(displayText)} />
        <div className="flex items-center gap-1 flex-shrink-0">
          {loading && (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          )}
          {selectedOption && !disabled && (
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
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
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
                  <span dangerouslySetInnerHTML={renderHtml(option.label)} />
                </button>
              ))
            ) : (
              <p className="px-3 py-6 text-sm text-muted-foreground text-center">
                {search ? emptyText : 'Tidak ada data'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
