import React from 'react';
import { MapPin, Swords, Shield, Sparkles, ArrowRight, Activity, Compass, Download, FolderInput, CheckCircle2, Smartphone, Globe, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { exportFullAppBackup, importFullAppBackupFile } from '../utils/backupService';

const PokeballIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white" />
    <path d="M2 12H22" stroke="currentColor" strokeWidth="2" />
    <path d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12H2Z" fill="#DC2626" />
    <circle cx="12" cy="12" r="3" fill="white" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="1" fill="#334155" />
  </svg>
);

const ICON_PROPOSALS = [
  {
    id: 'prop-1',
    title: 'Propuesta 1: Pokédex Radar & Pokéball Classic',
    subtitle: 'Clásica & Oficial',
    tag: 'OFICIAL POKÉDEX',
    tagBg: 'bg-red-600 text-white',
    desc: 'Esfera roja brillante estilo Pokédex con lente LED sensor en azul cristal y anillos concéntricos de radar GPS Pokémon GO.',
    src: '/icons/proposal-1.svg',
  },
  {
    id: 'prop-2',
    title: 'Propuesta 2: Raid Master & Mega Crystal',
    subtitle: 'Incursiones & Leyenda',
    tag: 'INCURSIONES & MEGAS',
    tagBg: 'bg-purple-600 text-white',
    desc: 'Escudo épico con gradiente rojo/morado legendario, cristal de Megaevolución radiante y destellos de espadas de combate.',
    src: '/icons/proposal-2.svg',
  },
  {
    id: 'prop-3',
    title: 'Propuesta 3: Route Compass & PokéStop GPS',
    subtitle: 'Rutas & Geolocalización',
    tag: 'RUTAS & NIDOS',
    tagBg: 'bg-blue-600 text-white',
    desc: 'Base Superball azul marino con brújula Poképarada giratoria, pin de ubicación GPS y trazado de ruta de entrenador.',
    src: '/icons/proposal-3.svg',
  },
];

const IconSelectorSection: React.FC = () => {
  const [selectedId, setSelectedId] = React.useState<string>(() => {
    return localStorage.getItem('poketools_app_icon') || 'prop-1';
  });

  const handleSelectIcon = (prop: typeof ICON_PROPOSALS[0]) => {
    setSelectedId(prop.id);
    localStorage.setItem('poketools_app_icon', prop.id);
    
    // Update live link tags in document head
    let linkIcon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (linkIcon) {
      linkIcon.href = prop.src;
    }
    let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (appleIcon) {
      appleIcon.href = prop.src;
    }
  };

  React.useEffect(() => {
    const savedProp = ICON_PROPOSALS.find((p) => p.id === selectedId) || ICON_PROPOSALS[0];
    let linkIcon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (linkIcon) linkIcon.href = savedProp.src;
    let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (appleIcon) appleIcon.href = savedProp.src;
  }, [selectedId]);

  const selectedProp = ICON_PROPOSALS.find(p => p.id === selectedId) || ICON_PROPOSALS[0];

  return (
    <div className="mt-8 max-w-4xl w-full bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-md space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-200 pb-4">
        <div>
          <span className="text-[11px] font-black uppercase text-red-600 tracking-wider bg-red-100 border border-red-300 px-3 py-0.5 rounded-full inline-block mb-1">
            🎨 Identidad PWA & Aplicación Móvil
          </span>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            Elige el Ícono Oficial de PokéTools (3 Propuestas)
          </h3>
          <p className="text-xs text-slate-600 font-medium">
            Selecciona la propuesta visual que deseas usar en la pestaña de tu navegador y cuando instales la App en tu Celular.
          </p>
        </div>
      </div>

      {/* Grid of 3 Proposals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ICON_PROPOSALS.map((prop) => {
          const isSelected = prop.id === selectedId;
          return (
            <div
              key={prop.id}
              onClick={() => handleSelectIcon(prop)}
              className={`group cursor-pointer rounded-2xl border-2 p-4 transition-all flex flex-col justify-between relative shadow-xs ${
                isSelected
                  ? 'border-red-600 bg-red-50/50 ring-2 ring-red-500/20 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-400'
              }`}
            >
              {isSelected && (
                <span className="absolute -top-2.5 right-3 bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-xs flex items-center gap-1">
                  <Check className="w-3 h-3" /> ¡ACTIVO!
                </span>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${prop.tagBg}`}>
                    {prop.tag}
                  </span>
                </div>

                <div className="w-24 h-24 mx-auto mb-3 relative group-hover:scale-105 transition-transform drop-shadow-md">
                  <img src={prop.src} alt={prop.title} className="w-full h-full object-contain rounded-2xl" />
                </div>

                <h4 className="font-extrabold text-sm text-slate-900 mb-1 text-center">
                  {prop.subtitle}
                </h4>
                <p className="text-[11px] text-slate-600 font-medium leading-tight text-center mb-4">
                  {prop.desc}
                </p>
              </div>

              <button
                className={`w-full py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                }`}
              >
                {isSelected ? '✓ Aplicado a la App' : 'Usar esta Propuesta'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Device & Browser Live Preview Box */}
      <div className="bg-slate-100 border border-slate-300 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white p-2 border-2 border-slate-300 shadow-md shrink-0 flex items-center justify-center">
            <img src={selectedProp.src} alt="Selected Icon" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Vista Previa en Pestaña & Pantalla de Inicio Móvil
            </h4>
            <p className="text-xs text-slate-700 font-bold">
              {selectedProp.title}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Al tocar "Agregar a la Pantalla de Inicio" en tu celular (iOS / Android), este será el ícono nativo con resolución 512x512 y favicons SVG en tiempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 bg-white border border-slate-300 rounded-xl p-3 shadow-xs">
          <div className="flex flex-col items-center gap-1">
            <Globe className="w-5 h-5 text-blue-600" />
            <span className="text-[10px] font-black text-slate-700">Navegador</span>
          </div>
          <div className="w-[1px] h-8 bg-slate-300" />
          <div className="flex flex-col items-center gap-1">
            <Smartphone className="w-5 h-5 text-purple-600" />
            <span className="text-[10px] font-black text-slate-700">Celular App</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HubMenu: React.FC<{ onSelectTool: (tool: 'route-tracker' | 'damage-calc' | 'raid-generator' | 'inventory') => void }> = ({
  onSelectTool,
}) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-800 flex flex-col font-sans relative">
      {/* Pokédex Header Bar */}
      <header className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 border-b-4 border-red-700 text-white shadow-md sticky top-0 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Pokédex Lens & Title */}
          <div className="flex items-center gap-4">
            {/* Pokédex Sensor Lenses */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-sky-400 border-3 border-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] flex items-center justify-center relative overflow-hidden">
                <div className="w-3 h-3 rounded-full bg-white opacity-80 absolute top-1.5 left-1.5" />
              </div>
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400 border border-red-700 shadow-inner" />
                <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-700 shadow-inner" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-700 shadow-inner" />
              </div>
            </div>

            <div className="h-6 w-[2px] bg-red-400/60 hidden sm:block" />

            <div>
              <div className="flex items-center gap-2">
                <PokeballIcon className="w-6 h-6" />
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                  {t.hubTitle}
                </h1>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-yellow-400 text-red-900 px-2 py-0.5 rounded-full shadow-sm">
                  v2.0 PRO
                </span>
              </div>
              <p className="text-xs text-red-100 font-medium">{t.hubSubtitle}</p>
            </div>
          </div>

          {/* Right Header Actions: Tools Badge & Language Selector */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-red-900 bg-yellow-300/90 border border-yellow-400 px-3.5 py-1.5 rounded-full shadow-sm">
              <Sparkles className="w-4 h-4 text-red-600" />
              <span>{t.toolsReady}</span>
            </div>

            {/* Language Selector Top-Right */}
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-10 flex flex-col items-center">
        {/* Hero Banner */}
        <div className="text-center max-w-2xl mb-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase tracking-wider shadow-sm">
            <PokeballIcon className="w-4 h-4" /> {t.hubTagline}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {t.selectTool}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
            {t.routeTrackerDesc}
          </p>
        </div>

        {/* Grid de Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Tool 1: Route Tracker */}
          <div
            onClick={() => onSelectTool('route-tracker')}
            className="group relative bg-white border-2 border-slate-200 hover:border-red-500 rounded-3xl p-6 cursor-pointer transition-all duration-300 shadow-md hover:shadow-xl flex flex-col justify-between overflow-hidden transform hover:-translate-y-1"
          >
            <div className="h-3.5 bg-gradient-to-r from-red-600 to-red-500 -mx-6 -mt-6 mb-6 border-b border-red-700" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-600 text-white shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping" />
                  {t.pogoActive}
                </span>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-red-600 transition-colors flex items-center gap-2">
                {t.routeTrackerTitle}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {t.routeTrackerDesc}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-red-500" /> {t.stopsCount}
              </span>
              <button className="px-4 py-2 rounded-xl bg-red-600 group-hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5">
                <span>{t.openMap}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Tool 2: Damage Calculator */}
          <div
            onClick={() => onSelectTool('damage-calc')}
            className="group relative bg-white border-2 border-slate-200 hover:border-blue-600 rounded-3xl p-6 cursor-pointer transition-all duration-300 shadow-md hover:shadow-xl flex flex-col justify-between overflow-hidden transform hover:-translate-y-1"
          >
            <div className="h-3.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 -mx-6 -mt-6 mb-6 border-b border-blue-700" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                  <Swords className="w-7 h-7 text-white" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-600 text-white shadow-sm">
                  ⚔️ {t.damageCalcTitle}
                </span>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                {t.damageCalcTitle}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {t.damageCalcDesc}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-600" /> {t.exactCalc}
              </span>
              <button className="px-4 py-2 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5">
                <span>{t.calcDamage}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Tool 3: Raid Team Generator (Active) */}
          <div
            onClick={() => onSelectTool('raid-generator')}
            className="group relative bg-white border-2 border-slate-200 hover:border-emerald-600 rounded-3xl p-6 cursor-pointer transition-all duration-300 shadow-md hover:shadow-xl flex flex-col justify-between overflow-hidden transform hover:-translate-y-1"
          >
            <div className="h-3.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 -mx-6 -mt-6 mb-6 border-b border-emerald-700" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                  🔥 {t.teamBuilderTitle}
                </span>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors flex items-center gap-2">
                {t.teamBuilderTitle}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {t.teamBuilderDesc}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" /> Top 6 Counters DPS
              </span>
              <button className="px-4 py-2 rounded-xl bg-emerald-600 group-hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5">
                <span>Generar Equipo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Tool 4: Inventory Manager */}
          <div
            onClick={() => onSelectTool('inventory')}
            className="group relative bg-white border-2 border-slate-200 hover:border-purple-600 rounded-3xl p-6 cursor-pointer transition-all duration-300 shadow-md hover:shadow-xl flex flex-col justify-between overflow-hidden transform hover:-translate-y-1"
          >
            <div className="h-3.5 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 -mx-6 -mt-6 mb-6 border-b border-purple-700" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-purple-600 text-white shadow-sm flex items-center gap-1">
                  📦 Caja Pokémon
                </span>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-purple-600 transition-colors flex items-center gap-2">
                Mi Caja Pokémon
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Importa tus Pokémon desde PokeGenie para obtener recomendaciones de incursiones personalizadas y cálculos de daño reales.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-600" /> Personalizado
              </span>
              <button className="px-4 py-2 rounded-xl bg-purple-600 group-hover:bg-purple-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5">
                <span>Gestionar Caja</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Cloud & Device Synchronization Banner */}
        <div className="mt-8 max-w-4xl w-full bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-black text-yellow-300 flex items-center justify-center sm:justify-start gap-2">
              📱 Sincronizador 24/7 (PC ➔ Celular)
            </h3>
            <p className="text-xs text-blue-100 font-medium max-w-xl">
              Exporta el 100% de tus datos (Rutas avanzadas, Poképaradas, Avance e Inventario de Pokémon) para restaurarlos en tu celular con 1 solo clic.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={exportFullAppBackup}
              className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl shadow-md transition-all text-xs flex items-center gap-2 border border-yellow-500"
            >
              <Download className="w-4 h-4 text-red-700" />
              <span>Guardar Todo</span>
            </button>

            <label className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-md transition-all text-xs flex items-center gap-2 border border-blue-400 cursor-pointer">
              <FolderInput className="w-4 h-4 text-yellow-300" />
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

        {/* PWA Icon Proposals Gallery & Live Browser/Mobile Previewer */}
        <IconSelectorSection />

      </main>

      {/* Pokédex Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs font-medium text-slate-500 flex flex-col sm:flex-row items-center justify-center gap-2">
        <div className="flex items-center gap-1.5 text-slate-700 font-bold">
          <PokeballIcon className="w-4 h-4" />
          <span>{t.hubTitle}</span>
        </div>
        <span className="hidden sm:inline text-slate-300">•</span>
        <span>{t.footerTagline}</span>
      </footer>
    </div>
  );
};
