import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { MapMarker, fetchParkingSpots, fetchRepairStations } from '@/lib/markers';
import { useAuthStore } from './authStore';

interface FavouritesState {
  favourites: MapMarker[];
  loading: boolean;
  error: string | null;
  loadFavourites: () => Promise<void>;
  addFavourite: (marker: MapMarker) => Promise<void>;
  removeFavourite: (markerId: string) => Promise<void>;
  isFavourite: (markerId: string) => boolean;
  clearFavourites: () => void;
  fetchMarkersByIds: (ids: string[]) => Promise<MapMarker[]>;
}

export const useFavouritesStore = create<FavouritesState>((set, get) => {
  // Listen to auth state changes to reload favourites when user metadata updates
  let unsubscribe: (() => void) | null = null;
  
  const setupAuthListener = () => {
    if (unsubscribe) return; // Already listening
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'USER_UPDATED' && session?.user) {
          // Reload favourites when user metadata is updated
          const favouriteIds = session.user.user_metadata?.favourite_markers || [];
          
          // Don't set loading state here to avoid infinite loading
          // This is triggered by our own updates, not user actions
          
          // Fetch full marker data for the IDs
          if (favouriteIds.length > 0) {
            try {
              const markers = await get().fetchMarkersByIds(favouriteIds);
              set({ favourites: markers, loading: false });
            } catch (error) {
              console.error('Error fetching favourite markers:', error);
              set({ loading: false, error: 'Failed to load favourites' });
            }
          } else {
            set({ favourites: [], loading: false });
          }
        } else if (event === 'SIGNED_OUT') {
          // Clear favourites on logout
          set({ favourites: [], loading: false, error: null });
        }
      }
    );
    
    unsubscribe = () => subscription.unsubscribe();
  };
  
  // Setup listener on store creation
  setupAuthListener();

  return {
    favourites: [],
    loading: false,
    error: null,

    fetchMarkersByIds: async (ids: string[]): Promise<MapMarker[]> => {
      try {
        // Fetch all parking spots and repair stations
        const [parkingSpots, repairStations] = await Promise.all([
          fetchParkingSpots(),
          fetchRepairStations()
        ]);
        
        // Combine all markers
        const allMarkers = [...parkingSpots, ...repairStations];
        
        // Filter to only include markers with matching IDs
        const favouriteMarkers = allMarkers.filter(marker => ids.includes(marker.id));
        
        // Sort favourites in the same order as the IDs array
        const sortedFavourites = ids
          .map(id => favouriteMarkers.find(marker => marker.id === id))
          .filter(Boolean) as MapMarker[];
        
        return sortedFavourites;
      } catch (error) {
        console.error('Error fetching markers by IDs:', error);
        return [];
      }
    },

    loadFavourites: async () => {
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ favourites: [], loading: false, error: 'User not authenticated' });
        return;
      }

      const currentState = get();
      
      // Don't reload if already loading to prevent multiple simultaneous calls
      if (currentState.loading) {
        return;
      }

      set({ loading: true, error: null });
      
      try {
        // Get favourite IDs from user metadata
        const favouriteIds = user.user_metadata?.favourite_markers || [];
        
        // Check if the IDs are the same as current favourites to avoid unnecessary fetching
        const currentIds = currentState.favourites.map(fav => fav.id);
        const idsChanged = favouriteIds.length !== currentIds.length || 
                          favouriteIds.some((id: string, index: number) => id !== currentIds[index]);
        
        if (!idsChanged && currentState.favourites.length > 0) {
          // No changes, just clear loading state
          set({ loading: false });
          return;
        }
        
        if (favouriteIds.length > 0) {
          // Fetch full marker data for the IDs
          const favouriteMarkers = await get().fetchMarkersByIds(favouriteIds);
          set({ favourites: favouriteMarkers, loading: false });
        } else {
          set({ favourites: [], loading: false });
        }
      } catch (error) {
        console.error('Error loading favourites:', error);
        set({ 
          error: 'Failed to load favourites', 
          loading: false,
          favourites: []
        });
      }
    },

    addFavourite: async (marker: MapMarker) => {
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ error: 'User not authenticated' });
        return;
      }

      const currentFavourites = get().favourites;
      const alreadyFavourite = currentFavourites.some(fav => fav.id === marker.id);
      
      if (alreadyFavourite) {
        return; // Already a favourite
      }

      const newFavourites = [...currentFavourites, marker];
      
      // Optimistically update UI
      set({ 
        favourites: newFavourites, 
        error: null 
      });

      try {
        // Extract IDs from the new favourites for saving to user metadata
        const newFavouriteIds = newFavourites.map(fav => fav.id);
        
        const { error } = await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            favourite_markers: newFavouriteIds // Store only IDs
          }
        });

        if (error) throw error;
        
        // Refresh auth store to get updated user metadata
        const { refreshSession } = useAuthStore.getState();
        await refreshSession();
      } catch (error) {
        console.error('Error adding favourite:', error);
        // Revert optimistic update
        set({ 
          favourites: currentFavourites,
          error: 'Failed to save favourite'
        });
      }
    },

    removeFavourite: async (markerId: string) => {
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ error: 'User not authenticated' });
        return;
      }

      const currentFavourites = get().favourites;
      const newFavourites = currentFavourites.filter(fav => fav.id !== markerId);
      
      // Optimistically update UI
      set({ 
        favourites: newFavourites, 
        error: null 
      });

      try {
        // Extract IDs from the new favourites for saving to user metadata
        const newFavouriteIds = newFavourites.map(fav => fav.id);
        
        const { error } = await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            favourite_markers: newFavouriteIds // Store only IDs
          }
        });

        if (error) throw error;
        
        // Refresh auth store to get updated user metadata
        const { refreshSession } = useAuthStore.getState();
        await refreshSession();
      } catch (error) {
        console.error('Error removing favourite:', error);
        // Revert optimistic update
        set({ 
          favourites: currentFavourites,
          error: 'Failed to remove favourite'
        });
      }
    },

    isFavourite: (markerId: string) => {
      const { favourites } = get();
      return favourites.some(fav => fav.id === markerId);
    },

    clearFavourites: () => {
      set({ favourites: [], error: null });
    }
  };
}); 