/**
 * Backup and Migration Service for Pokeroutes
 * Exports and imports 100% of app data:
 * - Active Routes & Pokestop Sequences
 * - Current Route Progress & Settings
 * - Full Pokemon Box Inventory
 * - Language & Preferences
 */

import { useInventoryStore } from '../store/inventoryStore';

export interface FullAppBackup {
  version: string;
  timestamp: number;
  inventory?: any[];
  routeState?: {
    activeSequence?: any[];
    currentIndex?: number;
    isOptimized?: boolean;
    settings?: any;
  };
  language?: string;
}

export function exportFullAppBackup(): void {
  try {
    const rawInventory = localStorage.getItem('pokeroutes-inventory-storage');
    let inventory = [];
    if (rawInventory) {
      const parsedInv = JSON.parse(rawInventory);
      inventory = parsedInv.state?.inventory || parsedInv.inventory || [];
    }

    const savedSeq = localStorage.getItem('pogo_active_sequence');
    const savedIdx = localStorage.getItem('pogo_current_index');
    const savedOpt = localStorage.getItem('pogo_is_optimized');
    const savedSet = localStorage.getItem('pogo_settings');
    const savedLang = localStorage.getItem('pokeroutes_lang') || 'es';

    const backup: FullAppBackup = {
      version: '2.0',
      timestamp: Date.now(),
      inventory,
      routeState: {
        activeSequence: savedSeq ? JSON.parse(savedSeq) : undefined,
        currentIndex: savedIdx !== null ? Number(savedIdx) : undefined,
        isOptimized: savedOpt !== null ? JSON.parse(savedOpt) : undefined,
        settings: savedSet ? JSON.parse(savedSet) : undefined,
      },
      language: savedLang,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pokeroutes_FULL_backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error('Error al exportar la copia de seguridad completa:', err);
    alert('Ocurrió un error al generar la copia de seguridad.');
  }
}

export function importFullAppBackupFile(
  file: File,
  onSuccess?: (stats: { pokemons: number; hasRoute: boolean }) => void
): void {
  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const content = event.target?.result as string;
      const parsed = JSON.parse(content);

      let importedPokemonsList: any[] = [];
      let hasRoute = false;

      // Handle Full Backup Format
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        if (parsed.inventory && Array.isArray(parsed.inventory)) {
          importedPokemonsList = parsed.inventory;
        }

        if (parsed.routeState) {
          const { activeSequence, currentIndex, isOptimized, settings } = parsed.routeState;
          if (activeSequence) {
            localStorage.setItem('pogo_active_sequence', JSON.stringify(activeSequence));
            hasRoute = true;
          }
          if (currentIndex !== undefined) {
            localStorage.setItem('pogo_current_index', String(currentIndex));
          }
          if (isOptimized !== undefined) {
            localStorage.setItem('pogo_is_optimized', JSON.stringify(isOptimized));
          }
          if (settings) {
            localStorage.setItem('pogo_settings', JSON.stringify(settings));
          }
        }

        if (parsed.language) {
          localStorage.setItem('pokeroutes_lang', parsed.language);
        }
      } else if (Array.isArray(parsed)) {
        importedPokemonsList = parsed;
      }

      if (importedPokemonsList.length > 0) {
        // Save to LocalStorage Zustand format
        const invStoreKey = 'pokeroutes-inventory-storage';
        const invData = { state: { inventory: importedPokemonsList }, version: 0 };
        localStorage.setItem(invStoreKey, JSON.stringify(invData));

        // Update active Zustand store state in memory
        useInventoryStore.setState({ inventory: importedPokemonsList });

        // Auto sync all imported items up to Supabase Cloud!
        await useInventoryStore.getState().syncToCloud();
      }

      // Reload or notify success
      if (onSuccess) {
        onSuccess({ pokemons: importedPokemonsList.length, hasRoute });
      } else {
        alert(`¡Copia de seguridad restaurada con éxito!\n- ${importedPokemonsList.length} Pokémon recuperados y sincronizados en la nube.\n- Rutas y progreso restaurados.`);
        window.location.reload();
      }
    } catch (err) {
      console.error('Error importando copia de seguridad:', err);
      alert('El archivo seleccionado no tiene un formato de respaldo válido.');
    }
  };
  reader.readAsText(file);
}
