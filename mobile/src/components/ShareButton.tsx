// mobile/src/components/ShareButton.tsx
import React, { useState } from 'react';
import {
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { THEME } from '../theme/colors';
import { CloudflareAPI } from '../services/cloudflareAPI';

interface ShareButtonProps {
  trekId: string;
  trekName: string;
  onShare?: () => void;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  trekId,
  trekName,
  onShare,
}) => {
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      // Try to get an invite link from backend
      let shareLink = `https://walk-nepal.app/trek/${trekId}`;

      try {
        const invite = await CloudflareAPI.getInviteLink(trekId);
        if (invite?.code) {
          shareLink = `https://walk-nepal.app/invite/${invite.code}`;
        }
      } catch (error) {
        console.log('Using default share link');
      }

      await Share.share({
        message: `Join me on "${trekName}"! 🏔️\n\n${shareLink}`,
        url: shareLink, // iOS
        title: `Join ${trekName}`,
      });

      onShare?.();
    } catch (error: any) {
      if (error.code !== 'E_CANCELLED') {
        Alert.alert('Share Error', 'Failed to share trek');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleShare}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={THEME.orange.primary} size="small" />
      ) : (
        <Text style={{ fontSize: 16 }}>Share</Text>
      )}
    </TouchableOpacity>
  );
};
