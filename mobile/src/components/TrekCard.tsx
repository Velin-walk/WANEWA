// mobile/src/components/TrekCard.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { THEME } from '../theme/colors';
import { addFavorite, removeFavorite, selectTrek } from '../store/redux/trekSlice';
import { ParticipantStack } from './ParticipantStack';
import { localDB } from '../services/localDB';

interface Trek {
  id: string;
  name: string;
  date: string;
  days: string;
  difficulty: string;
  leader?: string;
  capacity: number;
  participants?: number;
  participants_by_gender?: {
    male: number;
    female: number;
  };
}

interface TrekCardProps {
  trek: Trek;
  onRegister?: (trekId: string) => void;
  onShare?: (trek: Trek) => void;
}

export const TrekCard: React.FC<TrekCardProps> = ({
  trek,
  onRegister,
  onShare,
}) => {
  const dispatch = useDispatch();
  const favorites = useSelector((state: any) => state.treks.favorites);
  const isFavorited = favorites.includes(trek.id);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

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

  const handleFavoriteToggle = async () => {
    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await localDB.removeFavorite(trek.id);
        dispatch(removeFavorite(trek.id));
      } else {
        await localDB.addFavorite(trek.id);
        dispatch(addFavorite(trek.id));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleCardPress = () => {
    dispatch(selectTrek(trek) as any);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={0.9}
    >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.trekName} numberOfLines={1}>
            {trek.name}
          </Text>
          <Text style={styles.trekDate}>{formatDate(trek.date)}</Text>
        </View>

        {/* Favorite Button */}
        <TouchableOpacity
          style={styles.favoriteBtn}
          onPress={handleFavoriteToggle}
          disabled={favoriteLoading}
        >
          <Text style={styles.favoriteIcon}>
            {isFavorited ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Trek Info Row */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Days</Text>
          <Text style={styles.infoValue}>{trek.days}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Difficulty</Text>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(trek.difficulty) + '20' },
            ]}
          >
            <Text
              style={[
                styles.difficultyText,
                { color: getDifficultyColor(trek.difficulty) },
              ]}
            >
              {trek.difficulty}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Capacity</Text>
          <Text style={styles.infoValue}>
            {trek.participants || 0}/{trek.capacity}
          </Text>
        </View>
      </View>

      {/* Participant Stack */}
      <ParticipantStack trekId={trek.id} />

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => onShare?.(trek)}
        >
          <Text style={styles.shareBtnText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => onRegister?.(trek.id)}
        >
          <Text style={styles.registerBtnText}>Register</Text>
        </TouchableOpacity>
      </View>

      {/* Leader info if available */}
      {trek.leader && (
        <View style={styles.leaderInfo}>
          <Text style={styles.leaderLabel}>Leader:</Text>
          <Text style={styles.leaderName}>{trek.leader}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0EBE5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  trekName: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.gray[900],
    marginBottom: 4,
  },
  trekDate: {
    fontSize: 13,
    color: THEME.gray[500],
  },
  favoriteBtn: {
    padding: 8,
    marginRight: -8,
  },
  favoriteIcon: {
    fontSize: 20,
    color: THEME.orange.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.gray[900],
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E1DB',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  shareBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
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
  registerBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: THEME.green.primary,
    borderRadius: 6,
    alignItems: 'center',
  },
  registerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  leaderInfo: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE5',
  },
  leaderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.gray[500],
    marginRight: 4,
  },
  leaderName: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.gray[900],
  },
});
