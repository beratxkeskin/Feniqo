import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string; // Optional color bubble (useful for categories)
  meta?: string;  // Optional sub-label or currency symbol
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode; // Optional prefix icon for the main input
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Seçiniz...',
  icon: PrefixIcon,
  className = '',
  disabled = false,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find the currently selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Filter options based on search query
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (opt.meta && opt.meta.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Show search bar only if there are more than 5 options to keep simple selects clean
  const showSearch = options.length > 5;

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Hidden input to support standard HTML form validation */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        />
      )}

      {/* Select Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setIsOpen(!isOpen);
          if (isOpen) setSearchQuery('');
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-white/70 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-800/80 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? 'ring-2 ring-brand-500/50 border-brand-500' : ''
        }`}
      >
        <div className="flex items-center space-x-2.5 overflow-hidden">
          {/* Prefix Icon */}
          {PrefixIcon && <span className="text-slate-400 dark:text-slate-500 shrink-0">{PrefixIcon}</span>}

          {/* Current Selection */}
          {selectedOption ? (
            <div className="flex items-center space-x-2 overflow-hidden">
              {/* Color indicator bubble */}
              {selectedOption.color && (
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-black/10 dark:border-white/10"
                  style={{ backgroundColor: selectedOption.color }}
                />
              )}
              {/* Option Icon */}
              {selectedOption.icon && (
                <span className="text-slate-400 dark:text-slate-500 shrink-0">{selectedOption.icon}</span>
              )}
              <span className="truncate text-slate-700 dark:text-slate-200">
                {selectedOption.label}
              </span>
              {selectedOption.meta && (
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium shrink-0">
                  ({selectedOption.meta})
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 truncate font-normal">
              {placeholder}
            </span>
          )}
        </div>

        {/* Dropdown Chevron */}
        <ChevronDown
          className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-300 shrink-0 ${
            isOpen ? 'rotate-180 text-brand-500' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Overlay */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 border border-slate-200/75 dark:border-slate-800/80 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200 max-h-[300px] flex flex-col">
          {/* Dynamic Search Box */}
          {showSearch && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center space-x-2 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 ml-1.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ara..."
                className="w-full bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0 py-1"
              />
            </div>
          )}

          {/* Option List Scroll Area */}
          <div className="p-1 space-y-0.5 overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-all duration-150 ${
                      isSelected
                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      {/* Color indicator bubble */}
                      {opt.color && (
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border border-black/10 dark:border-white/10 shadow-sm"
                          style={{ backgroundColor: opt.color }}
                        />
                      )}
                      {/* Option Icon */}
                      {opt.icon && (
                        <span className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-brand-500' : 'text-slate-400'}`}>
                          {opt.icon}
                        </span>
                      )}
                      <span className="truncate">{opt.label}</span>
                      {opt.meta && (
                        <span className="text-[10px] opacity-75 font-medium shrink-0">
                          ({opt.meta})
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-brand-500" />}
                  </button>
                );
              })
            ) : (
              <div className="py-6 px-4 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                Sonuç bulunamadı
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
