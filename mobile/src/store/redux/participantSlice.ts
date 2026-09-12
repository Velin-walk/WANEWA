// mobile/src/store/redux/participantSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ParticipantCount {
  total: number;
  male: number;
  female: number;
}

interface ParticipantUpdate {
  trek_id: string;
  count: ParticipantCount;
  new_person?: string;
  timestamp: number;
}

interface ParticipantState {
  participants: {
    [key: string]: ParticipantCount; // trekId -> counts
  };
  updates: ParticipantUpdate[]; // Recent updates for animation
  loading: boolean;
  error: string | null;
}

const initialState: ParticipantState = {
  participants: {},
  updates: [],
  loading: false,
  error: null,
};

const participantSlice = createSlice({
  name: 'participants',
  initialState,
  reducers: {
    /**
     * Set participant count for a trek
     */
    setParticipantCount: (
      state,
      action: PayloadAction<{ trek_id: string; count: ParticipantCount }>
    ) => {
      state.participants[action.payload.trek_id] = action.payload.count;
    },

    /**
     * Update participant count when someone joins
     */
    addParticipant: (
      state,
      action: PayloadAction<{
        trek_id: string;
        gender: 'm' | 'f';
        name?: string;
      }>
    ) => {
      const { trek_id, gender, name } = action.payload;

      if (!state.participants[trek_id]) {
        state.participants[trek_id] = { total: 0, male: 0, female: 0 };
      }

      const count = state.participants[trek_id];
      count.total++;
      if (gender === 'm') count.male++;
      if (gender === 'f') count.female++;

      // Track update for UI animation
      state.updates.push({
        trek_id,
        count,
        new_person: name,
        timestamp: Date.now(),
      });

      // Keep only last 20 updates
      if (state.updates.length > 20) {
        state.updates.shift();
      }
    },

    /**
     * Bulk update participants (from API)
     */
    setBulkParticipants: (
      state,
      action: PayloadAction<{
        [key: string]: ParticipantCount;
      }>
    ) => {
      state.participants = action.payload;
    },

    /**
     * Clear updates queue
     */
    clearUpdates: (state) => {
      state.updates = [];
    },

    /**
     * Clear all data
     */
    reset: (state) => {
      state.participants = {};
      state.updates = [];
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setParticipantCount,
  addParticipant,
  setBulkParticipants,
  clearUpdates,
  reset,
} = participantSlice.actions;

// Selectors
export const selectParticipantCount = (state: any, trekId: string) => {
  return (
    state.participants.participants[trekId] || {
      total: 0,
      male: 0,
      female: 0,
    }
  );
};

export const selectRecentUpdates = (state: any) => state.participants.updates;

export default participantSlice.reducer;
