import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { trekWS } from '../services/webSocketClient';
import { THEME } from '../theme/colors';

interface Participant {
  name: string;
  gender: 'm' | 'f';
}

export const ParticipantStack: React.FC<{ trekId: string }> = ({
  trekId,
}) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [count, setCount] = useState({ total: 0, male: 0, female: 0 });

  useEffect(() => {
    trekWS.connect(trekId);

    trekWS.on('initial', (data) => {
      setCount(data.participants);
    });

    trekWS.on('participant_joined', (data) => {
      setCount(data.count);
      setParticipants((prev) => [
        ...prev,
        { name: data.new_person, gender: data.gender },
      ]);
    });

    return () => trekWS.disconnect();
  }, [trekId]);

  const avatars = participants.slice(0, 12); // Show max 12
  const overflow = Math.max(0, participants.length - 12);

  return (
    <View style={styles.container}>
      <View style={styles.avatarStack}>
        {avatars.map((p, i) => (
          <View
            key={i}
            style={[
              styles.avatar,
              {
                backgroundColor:
                  p.gender === 'f' ? '#FCE7F3' : '#E0F2FE',
                marginLeft: i === 0 ? 0 : -8,
                zIndex: 12 - i,
              },
            ]}
          >
            <Text
              style={[
                styles.initial,
                { color: p.gender === 'f' ? '#BE185D' : '#0369A1' },
              ]}
            >
              {p.name[0].toUpperCase()}
            </Text>
          </View>
        ))}
        {overflow > 0 && (
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: THEME.gray[200],
                marginLeft: -8,
                zIndex: 0,
              },
            ]}
          >
            <Text style={[styles.initial, { color: THEME.gray[700] }]}>
              +{overflow}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.stats}>
        M {count.male} • F {count.female} • Total {count.total}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    fontSize: 11,
    fontWeight: '600',
  },
  stats: {
    fontSize: 9,
    fontWeight: '500',
    color: THEME.gray[500],
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
