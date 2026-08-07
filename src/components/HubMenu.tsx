import React from 'react';
import { MapPin, Swords, Shield, Sparkles, ArrowRight, Activity, Compass, Download, FolderInput, CheckCircle2, Smartphone, Globe, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { exportFullAppBackup, importFullAppBackupFile } from '../utils/backupService';
import { useInventoryStore } from '../store/inventoryStore';

const PokeballIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white" />
    <path d="M2 12H22" stroke="currentColor" strokeWidth="2" />
    <path d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12H2Z" fill="#DC2626" />
    <circle cx="12" cy="12" r="3" fill="white" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="1" fill="#334155" />
  </svg>
);

export const HubMenu: React.FC<{ onSelectTool: (tool: 'route-tracker' | 'damage-calc' | 'raid-generator' | 'inventory') => void }> = ({
  onSelectTool,
}) => {
  const { t } = useLanguage();
  const { inventory } = useInventoryStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EBF3F8] via-[#F4F8FA] to-[#E5EFF5] text-slate-800 flex flex-col font-pogo relative">
      {/* Official Pokémon GO Red Header Bar */}
      <header className="bg-gradient-to-r from-[#C22615] via-[#D62B18] to-[#C22615] border-b-4 border-red-800 text-white shadow-md sticky top-0 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Pokédex Sensor Lens & Title */}
          <div className="flex items-center gap-4">
            {/* Pokédex Sensor Lenses */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-sky-300 border-3 border-white shadow-md flex items-center justify-center relative overflow-hidden shrink-0">
                <div className="w-3 h-3 rounded-full bg-white opacity-90 absolute top-1.5 left-1.5" />
              </div>
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#C22615] border border-red-900 shadow-inner" />
                <span className="w-3 h-3 rounded-full bg-[#FFE550] border border-yellow-700 shadow-inner" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-700 shadow-inner" />
              </div>
            </div>

            <div className="h-6 w-[2px] bg-red-400/60 hidden sm:block" />

            <div>
              <div className="flex items-center gap-2.5">
                <PokeballIcon className="w-6 h-6 text-white" />
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#FFE550] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] font-pogo">
                  {t.hubTitle}
                </h1>
                <span className="text-[11px] font-black uppercase tracking-wider bg-[#FFE550] text-[#0B1B3C] px-2.5 py-0.5 rounded-full shadow-xs border border-yellow-300">
                  GO PRO
                </span>
              </div>
              <p className="text-xs text-red-100 font-bold">{t.hubSubtitle}</p>
            </div>
          </div>

          {/* Right Header Actions: Language Selector */}
          <div className="flex items-center gap-3">
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-10 flex flex-col items-center">
        {/* Hero Banner with Official Slogan */}
        <div className="text-center max-w-3xl mb-10 space-y-3 font-sans">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C22615] text-white text-xs font-black uppercase tracking-wider shadow-sm font-pogo">
            <PokeballIcon className="w-4 h-4 text-[#FFE550]" /> "Get Up and GO!"
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            {t.selectTool}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-bold leading-relaxed max-w-xl mx-auto">
            Herramientas para entrenadores Pokémon GO: Ruteo optimizado de Poképaradas, calculadora de daño real e inventario personalizado.
          </p>
        </div>

        {/* Grid de 4 Tarjetas Blancas Redondeadas estilo Pokémon GO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
          {/* Tool 1: Route Tracker */}
          <div
            onClick={() => onSelectTool('route-tracker')}
            className="pogo-card p-6 sm:p-7 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C22615] to-red-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping" />
                  {t.pogoActive}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-[#C22615] transition-colors flex items-center gap-2 font-pogo">
                  {t.routeTrackerTitle}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mt-2 font-medium">
                  {t.routeTrackerDesc}
                </p>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#C22615]" /> {t.stopsCount}
              </span>
              <button className="px-4.5 py-2.5 rounded-xl bg-[#C22615] hover:bg-red-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 group-hover:shadow-lg">
                <span>{t.openMap}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Tool 2: Damage Calculator */}
          <div
            onClick={() => onSelectTool('damage-calc')}
            className="pogo-card p-6 sm:p-7 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1160C0] to-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                  <Swords className="w-7 h-7 text-white" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#1160C0] text-white shadow-sm">
                  ⚔️ PvP & PvE
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-[#1160C0] transition-colors flex items-center gap-2 font-pogo">
                  {t.damageCalcTitle}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mt-2 font-medium">
                  {t.damageCalcDesc}
                </p>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#1160C0]" /> {t.exactCalc}
              </span>
              <button className="px-4.5 py-2.5 rounded-xl bg-[#1160C0] hover:bg-blue-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 group-hover:shadow-lg">
                <span>{t.calcDamage}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Tool 3: Raid Team Generator */}
          <div
            onClick={() => onSelectTool('raid-generator')}
            className="pogo-card p-6 sm:p-7 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                  🔥 Incursiones
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors flex items-center gap-2 font-pogo">
                  {t.teamBuilderTitle}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mt-2 font-medium">
                  {t.teamBuilderDesc}
                </p>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" /> Top 6 Counters DPS
              </span>
              <button className="px-4.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 group-hover:shadow-lg">
                <span>Generar Equipo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Tool 4: Inventory Manager */}
          <div
            onClick={() => onSelectTool('inventory')}
            className="pogo-card p-6 sm:p-7 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-600 text-white shadow-sm flex items-center gap-1">
                  📦 {inventory.length} Pokémon
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-purple-600 transition-colors flex items-center gap-2 font-pogo">
                  Mi Caja Pokémon
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mt-2 font-medium">
                  Importa tu inventario con escáner de video o CSV PokeGenie para obtener recomendaciones de combate personalizadas.
                </p>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-600" /> Calibración Real
              </span>
              <button className="px-4.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 group-hover:shadow-lg">
                <span>Gestionar Caja</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Cloud & Device Synchronization Banner */}
        <div className="mt-10 max-w-5xl w-full bg-white rounded-3xl p-6 sm:p-7 shadow-lg border-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-black text-[#0B1B3C] flex items-center justify-center sm:justify-start gap-2.5 font-pogo">
              📱 Sincronizador 24/7 (PC ➔ Celular)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl leading-relaxed">
              Respalda y restaura el 100% de tus rutas avanzadas, Poképaradas e inventario de Pokémon en cualquier dispositivo en 1 segundo.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={exportFullAppBackup}
              className="px-4.5 py-2.5 bg-[#FFE550] hover:bg-yellow-300 text-[#0B1B3C] font-black rounded-xl shadow-md transition-all text-xs flex items-center gap-2 border border-yellow-400 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#C22615]" />
              <span>Guardar Todo</span>
            </button>

            <label className="px-4.5 py-2.5 bg-[#1160C0] hover:bg-blue-700 text-white font-black rounded-xl shadow-md transition-all text-xs flex items-center gap-2 border border-blue-600 cursor-pointer">
              <FolderInput className="w-4 h-4 text-[#FFE550]" />
              <span>Cargar Todo</span>
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) importFullAppBackupFile(file);
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </main>

      {/* Pokédex Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs font-medium text-slate-500 flex flex-col sm:flex-row items-center justify-center gap-3">
        <div className="flex items-center gap-2 text-slate-800 font-black">
          <PokeballIcon className="w-4 h-4 text-[#C22615]" />
          <span>{t.hubTitle}</span>
        </div>
        <span className="hidden sm:inline text-slate-300">•</span>
        <span className="text-slate-600 font-bold">{t.footerTagline}</span>
      </footer>
    </div>
  );
};
