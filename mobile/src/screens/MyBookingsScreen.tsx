// mobile/src/screens/MyBookingsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { THEME } from '../theme/colors';
import { fetchUserBookings, cancelBooking } from '../store/redux/bookingSlice';

interface Booking {
  id: number;
  trek_id: string;
  trek_name: string;
  trek_date: string;
  trek_difficulty: string;
  full_name: string;
  phone: string;
  age_group: string;
  gender: 'm' | 'f';
  joined_at: string;
}

export const MyBookingsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { bookings, loading, submitting } = useSelector(
    (state: any) => state.bookings
  );
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchUserBookings() as any);
    }, [dispatch])
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return THEME.status.success;
      case 'moderate':
        return THEME.orange.primary;
      case 'difficult':
        return THEME.status.danger;
      default:
        return THEME.gray[500];
    }
  };

  const handleCancel = (bookingId: number, trekName: string) => {
    Alert.alert(
      'Cancel Registration',
      `Are you sure you want to cancel your registration for "${trekName}"?`,
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            dispatch(cancelBooking(bookingId) as any);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const isExpanded = expandedId === item.id;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardTitleSection}>
            <Text style={styles.trekName} numberOfLines={2}>
              {item.trek_name}
            </Text>
            <Text style={styles.trekDate}>{formatDate(item.trek_date)}</Text>
          </View>

          <View style={styles.cardRight}>
            <View
              style={[
                styles.difficultyBadge,
                {
                  backgroundColor: getDifficultyColor(item.trek_difficulty) + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.difficultyText,
                  { color: getDifficultyColor(item.trek_difficulty) },
                ]}
              >
                {item.trek_difficulty}
              </Text>
            </View>
            <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
          </View>
        </TouchableOpacity>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.cardDetails}>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Registered As</Text>
              <Text style={styles.detailValue}>{item.full_name}</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{item.phone}</Text>
              </View>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Gender</Text>
                <Text style={styles.detailValue}>
                  {item.gender === 'm' ? 'Male' : 'Female'}
                </Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Age Group</Text>
              <Text style={styles.detailValue}>{item.age_group}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Registered On</Text>
              <Text style={styles.detailValue}>
                {formatDate(item.joined_at)}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.shareBtn}
                disabled={submitting}
              >
                <Text style={styles.shareBtnText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() =>
                  handleCancel(item.id, item.trek_name)
                }
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={THEME.status.danger} />
                ) : (
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={THEME.orange.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <Text style={styles.subtitle}>Active & Upcoming Registrations</Text>
      </View>

      {bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏔️</Text>
          <Text style={styles.emptyTitle}>No Bookings Yet</Text>
          <Text style={styles.emptyDescription}>
            Explore available treks and register for your next adventure!
          </Text>
          <TouchableOpacity style={styles.explorerButton}>
            <Text style={styles.explorerButtonText}>Explore Treks</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderBookingCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE5',
  },
  title: {
    fontSize: 24,
    fontWeight: '300',
    color: THEME.gray[900],
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 12,
    color: THEME.gray[500],
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.gray[900],
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: THEME.gray[600],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  explorerButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: THEME.green.primary,
    borderRadius: 6,
  },
  explorerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0EBE5',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  trekName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.gray[900],
    marginBottom: 4,
  },
  trekDate: {
    fontSize: 12,
    color: THEME.gray[500],
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  expandIcon: {
    fontSize: 12,
    color: THEME.gray[500],
    width: 16,
    textAlign: 'center',
  },
  cardDetails: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.gray[50],
    borderTopWidth: 1,
    borderTopColor: '#F0EBE5',
  },
  detailSection: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 24,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.gray[900],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTopWidth: 1,
    paddingTopColor: '#F0EBE5',
  },
  shareBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: THEME.gray[200],
    borderRadius: 6,
    alignItems: 'center',
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.gray[700],
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: THEME.status.danger,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.status.danger,
  },
});
