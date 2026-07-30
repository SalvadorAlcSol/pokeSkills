import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserPokemon } from '../types/UserInventory';
import { v4 as uuidv4 } from 'uuid';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface InventoryState {
  inventory: UserPokemon[];
  isSyncing: boolean;
  addPokemon: (pokemon: Omit<UserPokemon, 'id' | 'addedAt'>) => void;
  updatePokemon: (id: string, updates: Partial<UserPokemon>) => void;
  removePokemon: (id: string) => void;
  importPokemons: (pokemons: Omit<UserPokemon, 'id' | 'addedAt'>[]) => void;
  clearInventory: () => void;
  syncFromCloud: () => Promise<void>;
  syncToCloud: () => Promise<void>;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      inventory: [],
      isSyncing: false,
      
      addPokemon: (pokemon) => {
        const newItem: UserPokemon = {
          ...pokemon,
          id: uuidv4(),
          addedAt: Date.now(),
        };

        set((state) => ({
          inventory: [...state.inventory, newItem]
        }));

        if (isSupabaseConfigured && supabase) {
          supabase
            .from('pokemon_inventory')
            .insert([{ id: newItem.id, data: newItem, updated_at: new Date() }])
            .then(({ error }) => {
              if (error) console.warn('Supabase sync insert info:', error.message);
            });
        }
      },

      updatePokemon: (id, updates) => {
        set((state) => {
          const updatedInventory = state.inventory.map(p => 
            p.id === id ? { ...p, ...updates } : p
          );
          const updatedItem = updatedInventory.find(p => p.id === id);

          if (isSupabaseConfigured && supabase && updatedItem) {
            supabase
              .from('pokemon_inventory')
              .upsert([{ id: updatedItem.id, data: updatedItem, updated_at: new Date() }])
              .then(({ error }) => {
                if (error) console.warn('Supabase sync update info:', error.message);
              });
          }

          return { inventory: updatedInventory };
        });
      },

      removePokemon: (id) => {
        set((state) => ({
          inventory: state.inventory.filter(p => p.id !== id)
        }));

        if (isSupabaseConfigured && supabase) {
          supabase
            .from('pokemon_inventory')
            .delete()
            .eq('id', id)
            .then(({ error }) => {
              if (error) console.warn('Supabase sync delete info:', error.message);
            });
        }
      },

      importPokemons: (pokemons) => {
        const newPokemons = pokemons.map(p => ({
          ...p,
          id: uuidv4(),
          addedAt: Date.now(),
        }));

        set((state) => ({
          inventory: [...state.inventory, ...newPokemons]
        }));

        if (isSupabaseConfigured && supabase && newPokemons.length > 0) {
          const rows = newPokemons.map(p => ({ id: p.id, data: p, updated_at: new Date() }));
          supabase
            .from('pokemon_inventory')
            .upsert(rows)
            .then(({ error }) => {
              if (error) console.warn('Supabase sync import info:', error.message);
            });
        }
      },

      clearInventory: () => {
        set({ inventory: [] });
        if (isSupabaseConfigured && supabase) {
          supabase.from('pokemon_inventory').delete().neq('id', '0').then(({ error }) => {
            if (error) console.warn('Supabase clear info:', error.message);
          });
        }
      },

      syncFromCloud: async () => {
        if (!isSupabaseConfigured || !supabase) return;
        set({ isSyncing: true });
        try {
          const { data, error } = await supabase.from('pokemon_inventory').select('*');
          if (!error && data && data.length > 0) {
            const cloudItems: UserPokemon[] = data.map((row: any) => row.data);
            set({ inventory: cloudItems });
          }
        } catch (e) {
          console.warn('Error fetching cloud inventory:', e);
        } finally {
          set({ isSyncing: false });
        }
      },

      syncToCloud: async () => {
        if (!isSupabaseConfigured || !supabase) return;
        const currentItems = get().inventory;
        if (currentItems.length === 0) return;
        set({ isSyncing: true });
        try {
          const rows = currentItems.map(p => ({ id: p.id, data: p, updated_at: new Date() }));
          await supabase.from('pokemon_inventory').upsert(rows);
        } catch (e) {
          console.warn('Error pushing to cloud inventory:', e);
        } finally {
          set({ isSyncing: false });
        }
      }
    }),
    {
      name: 'pokeroutes-inventory-storage',
    }
  )
);
