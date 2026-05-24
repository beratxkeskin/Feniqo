import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Lock, Users, Check } from 'lucide-react';
import type { Workspace } from '../../db/types';

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (workspaceId: string | null) => void;
  isEn: boolean;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  workspaces,
  activeWorkspace,
  setActiveWorkspace,
  isEn,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (workspaceId: string | null) => {
    setActiveWorkspace(workspaceId);
    setIsOpen(false);
  };

  const currentLabel = activeWorkspace 
    ? activeWorkspace.name 
    : (isEn ? 'Personal Workspace' : 'Kişisel Alan');

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-800 rounded-2xl text-xs font-bold transition-all duration-200 shadow-sm focus:outline-none"
      >
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-sm shrink-0">
            {activeWorkspace ? (
              <Users className="w-3.5 h-3.5 text-brand-500" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-amber-500" />
            )}
          </div>
          <span className="truncate pr-1 tracking-tight">
            {currentLabel}
          </span>
        </div>
        <ChevronDown 
          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-300 shrink-0 ${
            isOpen ? 'rotate-180 text-brand-500' : ''
          }`}
        />
      </button>

      {/* Floating Menu overlay */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 border border-slate-200/75 dark:border-slate-800/80 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="p-1 space-y-0.5 max-h-[220px] overflow-y-auto">
            {/* Option: Personal Workspace */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 ${
                !activeWorkspace
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <Lock className={`w-3.5 h-3.5 ${!activeWorkspace ? 'text-brand-500' : 'text-amber-500'}`} />
                <span className="truncate">{isEn ? 'Personal Workspace' : 'Kişisel Alan'}</span>
              </div>
              {!activeWorkspace && <Check className="w-3.5 h-3.5 shrink-0" />}
            </button>

            {/* Options: Shared Workspaces */}
            {workspaces.map((ws) => {
              const isSelected = activeWorkspace?.id === ws.id;
              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => handleSelect(ws.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 ${
                    isSelected
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <Users className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-500' : 'text-slate-400'}`} />
                    <span className="truncate">{ws.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
