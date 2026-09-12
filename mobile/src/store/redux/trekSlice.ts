// mobile/src/store/redux/trekSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CloudflareAPI } from '../../services/cloudflareAPI';
import { localDB } from '../../services/localDB';

interface Trek {
  id: string;
  name: string;
  date: string;
  days: string;
  difficulty: string;
  leader?: string;
  capacity: number;
  itinerary?: string;
  participants?: number;
  participants_by_gender?: {
    male: number;
    female: number;
  };
}

interface TrekState {
  treks: Trek[];
  selectedTrek: Trek | null;
  loading: boolean;
  error: string | null;
  lastFetched: number;
  favorites: string[];
}

const initialState: TrekState = {
  treks: [],
  selectedTrek: null,
  loading: false,
  error: null,
  lastFetched: 0,
  favorites: [],
};

/**
 * Async thunk: Fetch all treks
 */
export const fetchTreks = createAsyncThunk(
  'treks/fetchTreks',
  async (_, { rejectWithValue }) => {
    try {
      // Try to fetch from API
      const treks = await CloudflareAPI.getTreks();

      // Cache locally
      await localDB.cacheTreks(treks);

      return treks;
    } catch (error: any) {
      // Fallback to cached treks if API fails
      try {
        const cached = await localDB.getCachedTreks();
        if (cached.length > 0) {
          console.log('Using cached treks');
          return cached;
        }
      } catch (cacheError) {
        console.error('Cache retrieval error:', cacheError);
      }

      return rejectWithValue(error.message || 'Failed to fetch treks');
    }
  }
);

/**
 * Async thunk: Fetch trek details
 */
export const fetchTrekDetails = createAsyncThunk(
  'treks/fetchTrekDetails',
  async (trekId: string, { rejectWithValue }) => {
    try {
      const trek = await CloudflareAPI.getTrekDetails(trekId);
      return trek;
    } catch (error: any) {
      // Try cached version
      try {
        const cached = await localDB.getCachedTrek(trekId);
        if (cached) {
          console.log('Using cached trek details');
          return cached;
        }
      } catch {
        // Ignore cache error
      }

      return rejectWithValue(error.message || 'Failed to fetch trek details');
    }
  }
);

/**
 * Async thunk: Load favorites from local storage
 */
export const loadFavorites = createAsyncThunk(
  'treks/loadFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const favorites = await localDB.getFavorites();
      return favorites;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const trekSlice = createSlice({
  name: 'treks',
  initialState,
  reducers: {
    selectTrek: (state, action: PayloadAction<Trek | null>) => {
      state.selectedTrek = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    addFavorite: (state, action: PayloadAction<string>) => {
      if (!state.favorites.includes(action.payload)) {
        state.favorites.push(action.payload);
      }
    },
    removeFavorite: (state, action: PayloadAction<string>) => {
      state.favorites = state.favorites.filter((id) => id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    // Fetch Treks
    builder
      .addCase(fetchTreks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTreks.fulfilled, (state, action) => {
        state.loading = false;
        state.treks = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchTreks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Trek Details
    builder
      .addCase(fetchTrekDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrekDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTrek = action.payload;

        // Update in treks list if it exists
        const index = state.treks.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.treks[index] = action.payload;
        }
      })
      .addCase(fetchTrekDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Load Favorites
    builder
      .addCase(loadFavorites.fulfilled, (state, action) => {
        state.favorites = action.payload;
      })
      .addCase(loadFavorites.rejected, (state) => {
        state.favorites = [];
      });
  },
});

export const { selectTrek, clearError, addFavorite, removeFavorite } = trekSlice.actions;
export default trekSlice.reducer;
