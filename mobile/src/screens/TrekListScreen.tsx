import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { THEME } from '../theme/colors';
import { TrekCard } from '../components/TrekCard';
import { fetchTreks } from '../store/redux/trekSlice';

export const TrekListScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { treks, loading } = useSelector((state: any) => state.treks);
  const [filter, setFilter] = useState<'all' | 'treks' | 'overnight'>('all');

  useEffect(() => {
    dispatch(fetchTreks() as any);
    const interval = setInterval(() => {
      dispatch(fetchTreks() as any);
    }, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  const filtered = treks.filter((trek: any) => {
    if (filter === 'all') return true;
    if (filter === 'treks') return trek.days > 2;
    if (filter === 'overnight') return trek.days === 2;
    return false;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Walk Nepal Walk</Text>
        <Text style={styles.subtitle}>Trek Schedule & Live Roster</Text>
      </View>

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {['all', 'treks', 'overnight'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterBtn,
              filter === f && styles.filterBtnActive,
            ]}
            onPress={() => setFilter(f as any)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === 'all' ? 'All' : f === 'treks' ? 'Treks' : 'Overnight'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Trek List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TrekCard
            trek={item}
            onRegister={() => handleRegister(item.id)}
            onShare={() => handleShare(item)}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              size="large"
              color={THEME.orange.primary}
              style={styles.loader}
            />
          ) : (
            <Text style={styles.emptyText}>No treks found</Text>
          )
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const handleRegister = (trekId: string) => {
  // Navigate to registration form
};

const handleShare = (trek: any) => {
  // Share deep link to trek
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#D1E8C9',
    borderRadius: 4,
  },
  filterBtnActive: {
    backgroundColor: THEME.green.primary,
    borderColor: THEME.green.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.green.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  loader: {
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: THEME.gray[500],
    marginTop: 40,
  },
});
