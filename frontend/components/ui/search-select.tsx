'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface SearchSelectProps {
  options: Option[];
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  emptyText = 'Tidak ada data',
  className = '',
  disabled = false,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(o => o.value === value);

  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

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

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-xl border transition-all ${
          open
            ? 'border-indigo-500 ring-2 ring-indigo-500/20'
            : 'border-gray-200 hover:border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'} ${
          !selectedOption ? 'text-gray-400' : 'text-gray-900'
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {selectedOption && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari..."
              className="w-full text-sm bg-transparent border-none outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-indigo-50 ${
                    value === option.value
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <p className="px-3 py-6 text-sm text-gray-400 text-center">{emptyText}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
