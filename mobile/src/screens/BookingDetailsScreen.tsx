// mobile/src/screens/BookingDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  SectionList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { THEME } from '../theme/colors';
import { registerForTrek, addTeamMember, removeTeamMember, clearSuccess } from '../store/redux/bookingSlice';
import { fetchTrekDetails } from '../store/redux/trekSlice';

interface FormData {
  full_name: string;
  phone: string;
  whatsapp: string;
  age_group: string;
  gender: 'm' | 'f';
  team_members: Array<{
    full_name: string;
    gender: 'm' | 'f';
    age_group?: string;
  }>;
}

export const BookingDetailsScreen: React.FC = () => {
  const route = useRoute() as any;
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { trekId } = route.params || {};

  const selectedTrek = useSelector((state: any) => state.treks.selectedTrek);
  const { submitting, error, success } = useSelector(
    (state: any) => state.bookings
  );
  const trekLoading = useSelector((state: any) => state.treks.loading);

  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    phone: '',
    whatsapp: '',
    age_group: '',
    gender: 'm',
    team_members: [],
  });

  const [showTeamForm, setShowTeamForm] = useState(false);
  const [newTeamMember, setNewTeamMember] = useState({
    full_name: '',
    gender: 'm' as 'm' | 'f',
    age_group: '',
  });

  useEffect(() => {
    // Fetch trek details if not already loaded
    if (!selectedTrek && trekId) {
      dispatch(fetchTrekDetails(trekId) as any);
    }
  }, [trekId, selectedTrek, dispatch]);

  useEffect(() => {
    // Show success message and navigate back
    if (success) {
      Alert.alert(
        'Success',
        'You have successfully registered for this trek!',
        [
          {
            text: 'View My Bookings',
            onPress: () => {
              dispatch(clearSuccess() as any);
              navigation.navigate('MyBookings' as never);
            },
          },
          {
            text: 'Continue Exploring',
            onPress: () => {
              dispatch(clearSuccess() as any);
              navigation.goBack();
            },
          },
        ]
      );
    }
  }, [success, navigation, dispatch]);

  const handleRegister = async () => {
    // Validation
    if (!formData.full_name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    if (!formData.age_group) {
      Alert.alert('Error', 'Please select your age group');
      return;
    }

    // Dispatch registration
    dispatch(
      registerForTrek({
        trek_id: trekId,
        ...formData,
      }) as any
    );
  };

  const handleAddTeamMember = () => {
    if (!newTeamMember.full_name.trim()) {
      Alert.alert('Error', 'Please enter team member name');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      team_members: [...prev.team_members, newTeamMember],
    }));

    setNewTeamMember({ full_name: '', gender: 'm', age_group: '' });
    setShowTeamForm(false);
  };

  const handleRemoveTeamMember = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      team_members: prev.team_members.filter((_, i) => i !== index),
    }));
  };

  const ageGroups = ['13-20', '21-30', '31-40', '41-50', '50+'];

  if (trekLoading && !selectedTrek) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={THEME.orange.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedTrek) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Trek not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Trek Info */}
        <View style={styles.trekInfo}>
          <Text style={styles.trekName}>{selectedTrek.name}</Text>
          <Text style={styles.trekDate}>
            {new Date(selectedTrek.date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>

        {/* Personal Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Details</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={THEME.gray[400]}
              value={formData.full_name}
              onChangeText={(text) =>
                setFormData({ ...formData, full_name: text })
              }
              editable={!submitting}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="9800000000"
              placeholderTextColor={THEME.gray[400]}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
              editable={!submitting}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>WhatsApp Number</Text>
            <TextInput
              style={styles.input}
              placeholder="9800000000 (optional)"
              placeholderTextColor={THEME.gray[400]}
              value={formData.whatsapp}
              onChangeText={(text) =>
                setFormData({ ...formData, whatsapp: text })
              }
              keyboardType="phone-pad"
              editable={!submitting}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Age Group *</Text>
            <View style={styles.ageGroupContainer}>
              {ageGroups.map((group) => (
                <TouchableOpacity
                  key={group}
                  style={[
                    styles.ageGroupButton,
                    formData.age_group === group &&
                      styles.ageGroupButtonActive,
                  ]}
                  onPress={() =>
                    setFormData({ ...formData, age_group: group })
                  }
                  disabled={submitting}
                >
                  <Text
                    style={[
                      styles.ageGroupText,
                      formData.age_group === group &&
                        styles.ageGroupTextActive,
                    ]}
                  >
                    {group}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              {[
                { value: 'm', label: 'Male' },
                { value: 'f', label: 'Female' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.genderButton,
                    formData.gender === (option.value as 'm' | 'f') &&
                      styles.genderButtonActive,
                  ]}
                  onPress={() =>
                    setFormData({
                      ...formData,
                      gender: option.value as 'm' | 'f',
                    })
                  }
                  disabled={submitting}
                >
                  <Text
                    style={[
                      styles.genderText,
                      formData.gender === (option.value as 'm' | 'f') &&
                        styles.genderTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Team Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Team Members</Text>
            <Text style={styles.sectionSubtitle}>
              {formData.team_members.length}
            </Text>
          </View>

          {formData.team_members.map((member, index) => (
            <View key={index} style={styles.teamMemberCard}>
              <View style={styles.teamMemberInfo}>
                <Text style={styles.teamMemberName}>{member.full_name}</Text>
                <Text style={styles.teamMemberMeta}>
                  {member.gender === 'm' ? 'Male' : 'Female'} •{' '}
                  {member.age_group || 'Age not specified'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveTeamMember(index)}
                disabled={submitting}
              >
                <Text style={styles.removeIcon}>×</Text>
              </TouchableOpacity>
            </View>
          ))}

          {!showTeamForm ? (
            <TouchableOpacity
              style={styles.addTeamButton}
              onPress={() => setShowTeamForm(true)}
              disabled={submitting}
            >
              <Text style={styles.addTeamButtonText}>+ Add Team Member</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.teamFormContainer}>
              <TextInput
                style={styles.input}
                placeholder="Team member name"
                placeholderTextColor={THEME.gray[400]}
                value={newTeamMember.full_name}
                onChangeText={(text) =>
                  setNewTeamMember({ ...newTeamMember, full_name: text })
                }
              />

              <View style={styles.genderContainer}>
                {[
                  { value: 'm', label: 'M' },
                  { value: 'f', label: 'F' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.genderButton,
                      newTeamMember.gender === (option.value as 'm' | 'f') &&
                        styles.genderButtonActive,
                    ]}
                    onPress={() =>
                      setNewTeamMember({
                        ...newTeamMember,
                        gender: option.value as 'm' | 'f',
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.genderText,
                        newTeamMember.gender === (option.value as 'm' | 'f') &&
                          styles.genderTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.teamFormActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowTeamForm(false);
                    setNewTeamMember({
                      full_name: '',
                      gender: 'm',
                      age_group: '',
                    });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddTeamMember}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Register Button */}
        <TouchableOpacity
          style={[styles.registerButton, submitting && styles.registerButtonDisabled]}
          onPress={handleRegister}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>Complete Registration</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
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
  trekInfo: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE5',
  },
  trekName: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.gray[900],
    marginBottom: 4,
  },
  trekDate: {
    fontSize: 13,
    color: THEME.gray[500],
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE5',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.gray[900],
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.green.primary,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.gray[700],
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1E8C9',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME.gray[900],
    fontFamily: 'System',
  },
  ageGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ageGroupButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#D1E8C9',
    borderRadius: 4,
  },
  ageGroupButtonActive: {
    backgroundColor: THEME.green.primary,
    borderColor: THEME.green.primary,
  },
  ageGroupText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.green.primary,
  },
  ageGroupTextActive: {
    color: '#fff',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#D1E8C9',
    borderRadius: 4,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: THEME.green.primary,
    borderColor: THEME.green.primary,
  },
  genderText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.green.primary,
  },
  genderTextActive: {
    color: '#fff',
  },
  teamMemberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: THEME.gray[50],
    borderRadius: 6,
    marginBottom: 8,
  },
  teamMemberInfo: {
    flex: 1,
  },
  teamMemberName: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.gray[900],
    marginBottom: 2,
  },
  teamMemberMeta: {
    fontSize: 12,
    color: THEME.gray[500],
  },
  removeIcon: {
    fontSize: 24,
    color: THEME.status.danger,
    fontWeight: '300',
  },
  addTeamButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D1E8C9',
    borderRadius: 6,
    borderStyle: 'dashed',
  },
  addTeamButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.green.primary,
  },
  teamFormContainer: {
    gap: 12,
  },
  teamFormActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: THEME.gray[200],
    borderRadius: 4,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.gray[700],
  },
  addButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: THEME.green.primary,
    borderRadius: 4,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  errorBox: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: THEME.status.danger,
  },
  errorText: {
    color: THEME.status.danger,
    fontSize: 13,
    fontWeight: '500',
  },
  registerButton: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 14,
    backgroundColor: THEME.green.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: THEME.gray[100],
    borderRadius: 6,
    marginTop: 12,
  },
  backButtonText: {
    color: THEME.gray[900],
    fontWeight: '600',
  },
});
