// mobile/src/store/redux/bookingSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CloudflareAPI } from '../../services/cloudflareAPI';
import { localDB } from '../../services/localDB';

interface TeamMember {
  full_name: string;
  gender: 'm' | 'f';
  age_group?: string;
  phone?: string;
}

interface Booking {
  id?: number;
  trek_id: string;
  full_name: string;
  phone: string;
  whatsapp: string;
  age_group: string;
  gender: 'm' | 'f';
  joined_at?: string;
  trek_name?: string;
  trek_date?: string;
  trek_difficulty?: string;
  team_members?: TeamMember[];
}

interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  success: boolean;
}

const initialState: BookingState = {
  bookings: [],
  currentBooking: null,
  loading: false,
  submitting: false,
  error: null,
  success: false,
};

/**
 * Async thunk: Fetch user's bookings
 */
export const fetchUserBookings = createAsyncThunk(
  'bookings/fetchUserBookings',
  async (_, { rejectWithValue }) => {
    try {
      const bookings = await CloudflareAPI.getUserBookings();
      
      // Cache locally
      for (const booking of bookings) {
        await localDB.saveBooking(booking);
      }

      return bookings;
    } catch (error: any) {
      // Fallback to cached bookings
      try {
        const cached = await localDB.getUserBookings();
        if (cached.length > 0) {
          console.log('Using cached bookings');
          return cached;
        }
      } catch (cacheError) {
        console.error('Cache retrieval error:', cacheError);
      }

      return rejectWithValue(error.message || 'Failed to fetch bookings');
    }
  }
);

/**
 * Async thunk: Register for a trek
 */
export const registerForTrek = createAsyncThunk(
  'bookings/registerForTrek',
  async (
    bookingData: {
      trek_id: string;
      full_name: string;
      phone: string;
      whatsapp: string;
      age_group: string;
      gender: 'm' | 'f';
      team_members?: TeamMember[];
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await CloudflareAPI.registerForTrek(bookingData.trek_id, bookingData);

      // Create local booking record
      const localBooking: Booking = {
        trek_id: bookingData.trek_id,
        full_name: bookingData.full_name,
        phone: bookingData.phone,
        whatsapp: bookingData.whatsapp,
        age_group: bookingData.age_group,
        gender: bookingData.gender,
        joined_at: new Date().toISOString(),
        team_members: bookingData.team_members,
      };

      await localDB.saveBooking(localBooking);

      return {
        ...localBooking,
        id: result.booking_id,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to register for trek');
    }
  }
);

/**
 * Async thunk: Cancel a booking
 */
export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async (bookingId: number, { rejectWithValue }) => {
    try {
      await CloudflareAPI.cancelBooking(bookingId);
      return bookingId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel booking');
    }
  }
);

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setCurrentBooking: (state, action: PayloadAction<Booking | null>) => {
      state.currentBooking = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    addTeamMember: (state, action: PayloadAction<TeamMember>) => {
      if (state.currentBooking) {
        if (!state.currentBooking.team_members) {
          state.currentBooking.team_members = [];
        }
        state.currentBooking.team_members.push(action.payload);
      }
    },
    removeTeamMember: (state, action: PayloadAction<number>) => {
      if (state.currentBooking?.team_members) {
        state.currentBooking.team_members.splice(action.payload, 1);
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch User Bookings
    builder
      .addCase(fetchUserBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchUserBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Register For Trek
    builder
      .addCase(registerForTrek.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.success = false;
      })
      .addCase(registerForTrek.fulfilled, (state, action) => {
        state.submitting = false;
        state.success = true;
        state.bookings.push(action.payload);
        state.currentBooking = null;
      })
      .addCase(registerForTrek.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // Cancel Booking
    builder
      .addCase(cancelBooking.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.submitting = false;
        state.bookings = state.bookings.filter((b) => b.id !== action.payload);
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentBooking,
  clearError,
  clearSuccess,
  addTeamMember,
  removeTeamMember,
} = bookingSlice.actions;
export default bookingSlice.reducer;
