import React from 'react';
import { useLanguage, Language } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`flex items-center gap-1 bg-yellow-300 text-red-950 p-1 rounded-full border border-yellow-400 shadow-sm font-extrabold text-xs ${className}`}>
      <Globe className="w-3.5 h-3.5 ml-1.5 text-red-800 shrink-0" />
      <button
        type="button"
        onClick={() => setLanguage('es')}
        className={`px-2 py-0.5 rounded-full transition-all text-[11px] uppercase ${
          language === 'es'
            ? 'bg-red-600 text-white shadow-sm font-black'
            : 'text-red-900 hover:text-red-950 font-bold'
        }`}
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-0.5 rounded-full transition-all text-[11px] uppercase ${
          language === 'en'
            ? 'bg-red-600 text-white shadow-sm font-black'
            : 'text-red-900 hover:text-red-950 font-bold'
        }`}
      >
        EN
      </button>
    </div>
  );
};
