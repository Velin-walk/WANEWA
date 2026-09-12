import React, { useState, useEffect, useCallback } from 'react';
import { Trek, Booking, TeamMember, BookingFormData } from './types';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { TrekListScreen } from './screens/TrekListScreen';
import { MyBookingsScreen } from './screens/MyBookingsScreen';
import { RegistrationModal } from './components/RegistrationModal';
import { InviteModal } from './components/InviteModal';
import { ItineraryModal } from './components/ItineraryModal';
import { TrekFeedbackModal } from './components/TrekFeedbackModal';
import { InfoPagesModal, SubPageType } from './components/InfoPagesModal';
import { FALLBACK_TREKS } from './data/fallbackTreks';
import { CheckCircle2, AlertCircle, Mountain, Heart } from 'lucide-react';
import MapMinersDashboard from './components/mapminers/MapMinersDashboard';
import { apiFetch, normalizeTrek } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'treks' | 'bookings' | 'saved' | 'mapminers'>('treks');
  const [treks, setTreks] = useState<Trek[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingTreks, setLoadingTreks] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [selectedTrekForRegister, setSelectedTrekForRegister] = useState<Trek | null>(null);
  const [selectedTrekForInvite, setSelectedTrekForInvite] = useState<Trek | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [itineraryModalTrek, setItineraryModalTrek] = useState<Trek | null>(null);
  const [itineraryModalType, setItineraryModalType] = useState<'itinerary' | 'faq'>('itinerary');

  const [feedbackModalTrek, setFeedbackModalTrek] = useState<Trek | null>(null);
  const [feedbackModalBooking, setFeedbackModalBooking] = useState<Booking | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showMapMinerContribute, setShowMapMinerContribute] = useState(false);
  const [infoModalPage, setInfoModalPage] = useState<SubPageType | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wnw_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const currentUserEmail = 'velinrai.VR@gmail.com';

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTreks = useCallback(async () => {
    try {
      const res = await apiFetch('/treks');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        const trekItems = Array.isArray(data) ? data : data?.data;
        if (Array.isArray(trekItems) && trekItems.length > 0) {
          setTreks(trekItems.map(normalizeTrek));
        } else {
          setTreks((prev) => (prev.length > 0 ? prev : FALLBACK_TREKS));
        }
      } else {
        console.warn('Could not retrieve JSON response for treks. Content-Type:', contentType, 'Status:', res.status);
        setTreks((prev) => (prev.length > 0 ? prev : FALLBACK_TREKS));
      }
    } catch (err) {
      console.warn('Network issue fetching treks, falling back to local trek data:', err);
      setTreks((prev) => (prev.length > 0 ? prev : FALLBACK_TREKS));
    } finally {
      setLoadingTreks(false);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const res = await apiFetch(`/bookings?email=${encodeURIComponent(currentUserEmail)}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setBookings(data);
      } else {
        console.warn('Could not retrieve JSON response for bookings. Content-Type:', contentType, 'Status:', res.status);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  }, [currentUserEmail]);

  const handleJoinByCode = async (code: string) => {
    const res = await apiFetch(`/invites/join?code=${encodeURIComponent(code)}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid invite code');
    }

    if (data.trek) {
      showToast(`Verified code for ${data.trek.name}!`, 'success');
      setSelectedTrekForRegister(data.trek);
      setCurrentTab('treks');
    }
  };

  useEffect(() => {
    fetchTreks();
    fetchBookings();

    // Check for invite code in URL (e.g. ?invite=WN-XXXX)
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite');
    if (inviteCode) {
      handleJoinByCode(inviteCode).catch((err) => {
        showToast(err.message, 'error');
      });
    }

    // Refresh every 10 seconds for live roster updates
    const interval = setInterval(() => {
      fetchTreks();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchTreks, fetchBookings]);

  const toggleFavorite = (trekId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(trekId)
        ? prev.filter((id) => id !== trekId)
        : [...prev, trekId];
      try {
        localStorage.setItem('wnw_favorites', JSON.stringify(next));
      } catch (e) {
        // ignore storage errors
      }
      return next;
    });
  };

  const handleRegisterSubmit = async (formData: BookingFormData) => {
    const res = await apiFetch('/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        user_email: formData.email || currentUserEmail,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit booking');
    }

    const toastMsg = data.cloudflare_synced
      ? 'Successfully registered & saved to Cloudflare D1!'
      : (data.message || 'Successfully registered for trek!');
    showToast(toastMsg, 'success');
    await fetchTreks();
    await fetchBookings();
    setCurrentTab('bookings');
  };

  const handleCancelBooking = async (bookingId: number) => {
    const res = await apiFetch(`/bookings/${bookingId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to cancel booking');
    }

    showToast('Registration cancelled successfully', 'success');
    await fetchTreks();
    await fetchBookings();
  };

  const handleCreateInvite = async (trekId: string) => {
    const res = await apiFetch(`/treks/${trekId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: currentUserEmail }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate invite');
    return data.code;
  };

  return (
    <div className="min-h-screen bg-[#F3EFEA] md:bg-[#F9F7F5] flex flex-col items-center justify-start w-full">
      {/* Viewport Container: Compact phone container on mobile, full-width responsive on desktop */}
      <div className="w-full max-w-md sm:max-w-xl md:max-w-none bg-[#F9F7F5] min-h-screen flex flex-col relative shadow-sm sm:shadow-md md:shadow-none sm:border-x md:border-none sm:border-[#E5E1DB]">
        {/* Mobile Toast notifications (centered, responsive) */}
        {toast && (
          <div
            id="mobile-toast"
            className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm p-3.5 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-4 duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                : 'bg-rose-50 text-rose-950 border-rose-300'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="flex-1 leading-snug">{toast.message}</span>
          </div>
        )}

        {/* Top Header */}
        <Navbar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          bookingCount={bookings.length}
          savedCount={favorites.length}
          onOpenInvite={() => {
            setSelectedTrekForInvite(treks[0] || null);
            setShowInviteModal(true);
          }}
          onOpenContribute={() => setShowMapMinerContribute(true)}
          onOpenInfoPage={(page) => setInfoModalPage(page)}
          userEmail={currentUserEmail}
        />

        {/* Content Area - Scrollable with safe bottom padding for Mobile Tab Bar, full width desktop */}
        <main className={`flex-1 w-full ${currentTab === 'mapminers' ? 'p-0 max-w-none' : 'max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3 sm:py-6 pb-28 md:pb-12'}`}>
          {currentTab === 'treks' && (
            <TrekListScreen
              treks={treks}
              loading={loadingTreks}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onRegister={(trek) => setSelectedTrekForRegister(trek)}
              onShare={(trek) => {
                setSelectedTrekForInvite(trek);
                setShowInviteModal(true);
              }}
              onViewItinerary={(trek) => {
                setItineraryModalTrek(trek);
                setItineraryModalType('itinerary');
              }}
              onViewFaq={(trek) => {
                setItineraryModalTrek(trek);
                setItineraryModalType('faq');
              }}
              onLeaveFeedback={(trek) => {
                setFeedbackModalTrek(trek);
                setFeedbackModalBooking(null);
                setShowFeedbackModal(true);
              }}
            />
          )}

          {currentTab === 'saved' && (
            <TrekListScreen
              treks={treks}
              loading={loadingTreks}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onRegister={(trek) => setSelectedTrekForRegister(trek)}
              onShare={(trek) => {
                setSelectedTrekForInvite(trek);
                setShowInviteModal(true);
              }}
              onViewItinerary={(trek) => {
                setItineraryModalTrek(trek);
                setItineraryModalType('itinerary');
              }}
              onViewFaq={(trek) => {
                setItineraryModalTrek(trek);
                setItineraryModalType('faq');
              }}
              savedOnly={true}
              onExploreAll={() => setCurrentTab('treks')}
              onLeaveFeedback={(trek) => {
                setFeedbackModalTrek(trek);
                setFeedbackModalBooking(null);
                setShowFeedbackModal(true);
              }}
            />
          )}

          {currentTab === 'bookings' && (
            <MyBookingsScreen
              bookings={bookings}
              loading={loadingBookings}
              onCancelBooking={handleCancelBooking}
              onExploreTreks={() => setCurrentTab('treks')}
              onShare={(booking) => {
                const matchedTrek = treks.find((t) => t.id === booking.trek_id || t.hike_number === booking.hike_number);
                setSelectedTrekForInvite(matchedTrek || null);
                setShowInviteModal(true);
              }}
              onLeaveFeedback={(booking) => {
                setFeedbackModalBooking(booking);
                const matchedTrek = treks.find((t) => t.id === booking.trek_id || t.hike_number === booking.hike_number);
                setFeedbackModalTrek(matchedTrek || null);
                setShowFeedbackModal(true);
              }}
            />
          )}

          {currentTab === 'mapminers' && (
            <MapMinersDashboard
              currentUserEmail={currentUserEmail}
              isContributionOpen={showMapMinerContribute}
              onOpenContribution={() => setShowMapMinerContribute(true)}
              onCloseContribution={() => setShowMapMinerContribute(false)}
            />
          )}

          {/* Micro App Footer inside shell */}
          {currentTab !== 'mapminers' && (
            <div className="mt-8 pt-6 border-t border-[#EFEAE4] text-center text-[11px] text-[#8B8680] space-y-1">
              <div className="flex items-center justify-center gap-1.5 font-bold text-[#1F1F1F]">
                <img src="/logo.png" className="w-4 h-4 object-contain" alt="WNW Logo" referrerPolicy="no-referrer" />
                <span>Walk Nepal Walk Mobile App</span>
              </div>
              <p className="text-[10px] text-[#8B8680] flex items-center justify-center gap-1">
                Himalayan Community Roster Platform • Made for Nepal Hikers
              </p>
            </div>
          )}
        </main>

        {/* Mobile Bottom Tab Navigation */}
        <BottomNav
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          bookingCount={bookings.length}
          savedCount={favorites.length}
          onOpenInfoPage={(page) => setInfoModalPage(page)}
        />

        {/* Booking Registration Modal (Mobile Bottom Sheet) */}
        {Boolean(selectedTrekForRegister) && (
          <RegistrationModal
            trek={selectedTrekForRegister}
            allTreks={treks}
            userEmail={currentUserEmail}
            isOpen={Boolean(selectedTrekForRegister)}
            onClose={() => setSelectedTrekForRegister(null)}
            onSubmit={handleRegisterSubmit}
          />
        )}

        {/* Invite & Share Modal (Mobile Bottom Sheet) */}
        {showInviteModal && (
          <InviteModal
            isOpen={showInviteModal}
            onClose={() => {
              setShowInviteModal(false);
              setSelectedTrekForInvite(null);
            }}
            selectedTrek={selectedTrekForInvite}
            onJoinCode={handleJoinByCode}
            onCreateInvite={handleCreateInvite}
          />
        )}

        {/* Itinerary & FAQ Preview Modal */}
        {Boolean(itineraryModalTrek) && (
          <ItineraryModal
            isOpen={Boolean(itineraryModalTrek)}
            onClose={() => setItineraryModalTrek(null)}
            trek={itineraryModalTrek}
            type={itineraryModalType}
          />
        )}

        {/* Trek Feedback Modal */}
        {showFeedbackModal && (
          <TrekFeedbackModal
            isOpen={showFeedbackModal}
            onClose={() => {
              setShowFeedbackModal(false);
              setFeedbackModalTrek(null);
              setFeedbackModalBooking(null);
            }}
            trek={feedbackModalTrek}
            booking={feedbackModalBooking}
            currentUser={{
              name: feedbackModalBooking?.full_name || 'Velin Rai',
              email: currentUserEmail,
            }}
            onSubmitSuccess={() => {
              showToast('Thank you for your feedback! Review saved.', 'success');
            }}
          />
        )}

        {/* Info Pages Modal (Payment, Tips, Safety, Private Trek, Contact) */}
        {Boolean(infoModalPage) && (
          <InfoPagesModal
            isOpen={Boolean(infoModalPage)}
            onClose={() => setInfoModalPage(null)}
            initialPage={infoModalPage || 'payment'}
          />
        )}
      </div>
    </div>
  );
}
