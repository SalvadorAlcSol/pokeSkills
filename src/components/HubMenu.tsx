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
    <div className="min-h-screen bg-[#0B1B3C] text-white flex flex-col font-pogo relative overflow-hidden">
      {/* Background Ambient Glow Spheres */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#1160C0]/20 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#C22615]/20 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />

      {/* Official Pokémon GO Header Bar */}
      <header className="pogo-glass-panel border-b-4 border-[#C22615] text-white shadow-2xl sticky top-0 z-30 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Pokédex Sensor Lens & Title */}
          <div className="flex items-center gap-4">
            {/* Pokédex Sensor Lenses */}
            <div className="flex items-center gap-2">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#97E1E1] to-cyan-400 border-3 border-white shadow-[0_0_15px_rgba(151,225,225,0.6)] flex items-center justify-center relative overflow-hidden shrink-0">
                <div className="w-3.5 h-3.5 rounded-full bg-white opacity-90 absolute top-1.5 left-1.5" />
              </div>
              <div className="flex gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#C22615] border border-red-950 shadow-[0_0_8px_rgba(194,38,21,0.8)]" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#FFE550] border border-yellow-800 shadow-[0_0_8px_rgba(255,229,80,0.8)]" />
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 border border-emerald-950 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </div>
            </div>

            <div className="h-7 w-[2px] bg-white/20 hidden sm:block" />

            <div>
              <div className="flex items-center gap-2.5">
                <PokeballIcon className="w-6 h-6 text-[#C22615] drop-shadow-[0_0_8px_rgba(194,38,21,0.8)]" />
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#FFE550] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-pogo">
                  {t.hubTitle}
                </h1>
                <span className="text-[11px] font-black uppercase tracking-wider bg-[#FFE550] text-[#0B1B3C] px-3 py-0.5 rounded-full shadow-md border border-yellow-300">
                  GO PRO
                </span>
              </div>
              <p className="text-xs text-[#97E1E1] font-bold tracking-wide">{t.hubSubtitle}</p>
            </div>
          </div>

          {/* Right Header Actions: Language Selector */}
          <div className="flex items-center gap-3">
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-12 flex flex-col items-center relative z-10">
        {/* Hero Banner with Official Slogan */}
        <div className="text-center max-w-3xl mb-12 space-y-4 font-sans">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#C22615] to-red-700 text-white text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(194,38,21,0.5)] border border-red-500 font-pogo">
            <PokeballIcon className="w-4 h-4 text-[#FFE550]" /> "Get Up and GO!"
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] leading-tight">
            {t.selectTool}
          </h2>
          <p className="text-sm sm:text-lg text-[#97E1E1] font-medium leading-relaxed max-w-2xl mx-auto">
            Accede a las herramientas de análisis en vivo, ruteo inteligente de Poképaradas y simulación de daño para dominar Pokémon GO.
          </p>
        </div>

        {/* Grid de 4 Tarjetas de Herramientas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
          {/* Tool 1: Route Tracker */}
          <div
            onClick={() => onSelectTool('route-tracker')}
            className="pogo-glass-card rounded-3xl p-6 sm:p-8 cursor-pointer flex flex-col justify-between relative overflow-hidden group border-t-4 border-t-[#C22615]"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C22615] to-red-700 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(194,38,21,0.5)] border border-red-400">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  {t.pogoActive}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white group-hover:text-[#FFE550] transition-colors flex items-center gap-2 font-pogo">
                  {t.routeTrackerTitle}
                </h3>
                <p className="text-sm text-[#97E1E1]/90 leading-relaxed mt-2 font-medium">
                  {t.routeTrackerDesc}
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#FFE550]" /> {t.stopsCount}
              </span>
              <button className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#C22615] to-red-700 hover:from-red-600 hover:to-red-800 text-white font-black text-xs shadow-lg shadow-red-950/50 transition-all flex items-center gap-2 group-hover:shadow-[0_0_20px_rgba(194,38,21,0.6)] border border-red-500">
                <span>{t.openMap}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Tool 2: Damage Calculator */}
          <div
            onClick={() => onSelectTool('damage-calc')}
            className="pogo-glass-card rounded-3xl p-6 sm:p-8 cursor-pointer flex flex-col justify-between relative overflow-hidden group border-t-4 border-t-[#1160C0]"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1160C0] to-blue-700 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(17,96,192,0.5)] border border-blue-400">
                  <Swords className="w-8 h-8 text-white" />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/40 shadow-sm">
                  ⚔️ PvP & PvE
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white group-hover:text-[#FFE550] transition-colors flex items-center gap-2 font-pogo">
                  {t.damageCalcTitle}
                </h3>
                <p className="text-sm text-[#97E1E1]/90 leading-relaxed mt-2 font-medium">
                  {t.damageCalcDesc}
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#97E1E1]" /> {t.exactCalc}
              </span>
              <button className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#1160C0] to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-black text-xs shadow-lg shadow-blue-950/50 transition-all flex items-center gap-2 group-hover:shadow-[0_0_20px_rgba(17,96,192,0.6)] border border-blue-500">
                <span>{t.calcDamage}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Tool 3: Raid Team Generator */}
          <div
            onClick={() => onSelectTool('raid-generator')}
            className="pogo-glass-card rounded-3xl p-6 sm:p-8 cursor-pointer flex flex-col justify-between relative overflow-hidden group border-t-4 border-t-emerald-500"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm flex items-center gap-1.5">
                  🔥 Incursiones
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white group-hover:text-[#FFE550] transition-colors flex items-center gap-2 font-pogo">
                  {t.teamBuilderTitle}
                </h3>
                <p className="text-sm text-[#97E1E1]/90 leading-relaxed mt-2 font-medium">
                  {t.teamBuilderDesc}
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FFE550]" /> Top 6 Counters DPS
              </span>
              <button className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-800 text-white font-black text-xs shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-2 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] border border-emerald-500">
                <span>Generar Equipo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Tool 4: Inventory Manager */}
          <div
            onClick={() => onSelectTool('inventory')}
            className="pogo-glass-card rounded-3xl p-6 sm:p-8 cursor-pointer flex flex-col justify-between relative overflow-hidden group border-t-4 border-t-purple-500"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-700 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-purple-400">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-sm flex items-center gap-1.5">
                  📦 {inventory.length} Pokémon
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white group-hover:text-[#FFE550] transition-colors flex items-center gap-2 font-pogo">
                  Mi Caja Pokémon
                </h3>
                <p className="text-sm text-[#97E1E1]/90 leading-relaxed mt-2 font-medium">
                  Importa tu inventario con escáner de video o CSV PokeGenie para obtener recomendaciones de combate personalizadas.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FFE550]" /> Calibración Real
              </span>
              <button className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-700 hover:from-purple-500 hover:to-fuchsia-800 text-white font-black text-xs shadow-lg shadow-purple-950/50 transition-all flex items-center gap-2 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] border border-purple-500">
                <span>Gestionar Caja</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Cloud & Device Synchronization Banner */}
        <div className="mt-12 max-w-5xl w-full pogo-glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-white/15 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-1.5 text-center sm:text-left relative z-10">
            <h3 className="text-xl font-black text-[#FFE550] flex items-center justify-center sm:justify-start gap-2.5 font-pogo drop-shadow-md">
              📱 Sincronizador 24/7 (PC ➔ Celular)
            </h3>
            <p className="text-xs sm:text-sm text-[#97E1E1] font-medium max-w-xl leading-relaxed">
              Respalda y restaura el 100% de tus rutas avanzadas, Poképaradas e inventario de Pokémon en cualquier dispositivo en 1 segundo.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 relative z-10">
            <button
              onClick={exportFullAppBackup}
              className="px-5 py-3 bg-[#FFE550] hover:bg-yellow-300 text-[#0B1B3C] font-black rounded-2xl shadow-[0_0_20px_rgba(255,229,80,0.4)] transition-all text-xs flex items-center gap-2 border border-yellow-300 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#C22615]" />
              <span>Guardar Todo</span>
            </button>

            <label className="px-5 py-3 bg-[#1160C0] hover:bg-blue-600 text-white font-black rounded-2xl shadow-[0_0_20px_rgba(17,96,192,0.4)] transition-all text-xs flex items-center gap-2 border border-blue-400 cursor-pointer">
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
      <footer className="border-t border-white/10 pogo-glass-panel py-6 text-center text-xs font-medium text-slate-300 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
        <div className="flex items-center gap-2 text-white font-black">
          <PokeballIcon className="w-4 h-4 text-[#C22615]" />
          <span>{t.hubTitle}</span>
        </div>
        <span className="hidden sm:inline text-white/30">•</span>
        <span className="text-[#97E1E1]">{t.footerTagline}</span>
      </footer>
    </div>
  );
};
