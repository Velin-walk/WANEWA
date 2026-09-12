// mobile/src/store/redux/store.ts
import { configureStore } from '@reduxjs/toolkit';
import trekReducer from './trekSlice';
import bookingReducer from './bookingSlice';
import participantReducer from './participantSlice';

export const store = configureStore({
  reducer: {
    treks: trekReducer,
    bookings: bookingReducer,
    participants: participantReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in these action types
        ignoredActions: ['treks/fetchTreks/fulfilled', 'bookings/fetchUserBookings/fulfilled'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
