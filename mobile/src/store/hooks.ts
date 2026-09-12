// mobile/src/store/hooks.ts
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './redux/store';

/**
 * Export pre-typed hooks for use throughout the app
 * Use these instead of plain `useDispatch` and `useSelector`
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Custom hook: useAuth
 * Access authentication state and methods
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();

  return {
    dispatch,
  };
};

/**
 * Custom hook: useTreks
 * Access trek list and filtering
 */
export const useTreks = () => {
  const dispatch = useAppDispatch();
  const treks = useAppSelector((state) => state.treks.treks);
  const selectedTrek = useAppSelector((state) => state.treks.selectedTrek);
  const loading = useAppSelector((state) => state.treks.loading);
  const error = useAppSelector((state) => state.treks.error);
  const favorites = useAppSelector((state) => state.treks.favorites);

  return {
    treks,
    selectedTrek,
    loading,
    error,
    favorites,
    dispatch,
  };
};

/**
 * Custom hook: useBookings
 * Access user's bookings and booking state
 */
export const useBookings = () => {
  const dispatch = useAppDispatch();
  const bookings = useAppSelector((state) => state.bookings.bookings);
  const currentBooking = useAppSelector((state) => state.bookings.currentBooking);
  const loading = useAppSelector((state) => state.bookings.loading);
  const submitting = useAppSelector((state) => state.bookings.submitting);
  const error = useAppSelector((state) => state.bookings.error);
  const success = useAppSelector((state) => state.bookings.success);

  return {
    bookings,
    currentBooking,
    loading,
    submitting,
    error,
    success,
    dispatch,
  };
};

/**
 * Custom hook: useParticipants
 * Access real-time participant updates
 */
export const useParticipants = (trekId?: string) => {
  const dispatch = useAppDispatch();
  const participants = useAppSelector((state) => state.participants.participants);
  const updates = useAppSelector((state) => state.participants.updates);

  return {
    participants: trekId ? participants[trekId] : participants,
    updates: trekId ? updates.filter((u) => u.trek_id === trekId) : updates,
    allParticipants: participants,
    dispatch,
  };
};

/**
 * Custom hook: useTrekFilters
 * Helper for filtering treks by various criteria
 */
export const useTrekFilters = () => {
  const { treks } = useTreks();

  const filterByDifficulty = (difficulty: string) => {
    return treks.filter((t) => t.difficulty?.toLowerCase() === difficulty.toLowerCase());
  };

  const filterByDays = (minDays: number, maxDays?: number) => {
    return treks.filter((t) => {
      const days = parseInt(t.days);
      return maxDays ? days >= minDays && days <= maxDays : days === minDays;
    });
  };

  const filterByDate = (startDate: Date, endDate?: Date) => {
    return treks.filter((t) => {
      const trekDate = new Date(t.date);
      return endDate
        ? trekDate >= startDate && trekDate <= endDate
        : trekDate >= startDate;
    });
  };

  const sortByDate = () => {
    return [...treks].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  };

  const sortByDifficulty = () => {
    const difficultyOrder = { easy: 1, moderate: 2, difficult: 3 };
    return [...treks].sort((a, b) => {
      const aLevel = difficultyOrder[a.difficulty?.toLowerCase() as keyof typeof difficultyOrder] || 0;
      const bLevel = difficultyOrder[b.difficulty?.toLowerCase() as keyof typeof difficultyOrder] || 0;
      return aLevel - bLevel;
    });
  };

  return {
    filterByDifficulty,
    filterByDays,
    filterByDate,
    sortByDate,
    sortByDifficulty,
  };
};
