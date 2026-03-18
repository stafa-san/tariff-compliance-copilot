import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store';
import { getUserShipments } from '../services/firestore';
import { Card, Button, Badge, EmptyState } from '../components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { formatCurrency } from '../utils/format';
import type { MainTabScreenProps } from '../navigation/types';

export function ProfileScreen({ navigation }: MainTabScreenProps<'Profile'>) {
  const { user, logout } = useAuth();
  const { shipments, setShipments } = useAppStore();
  const [isLoadingShipments, setIsLoadingShipments] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadShipments();
    }
  }, [user?.uid]);

  const loadShipments = async () => {
    if (!user?.uid) return;
    setIsLoadingShipments(true);
    try {
      const data = await getUserShipments(user.uid);
      setShipments(data);
    } catch {
      // Silently fail, local data still available
    } finally {
      setIsLoadingShipments(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.displayName || 'User'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </Animated.View>

        {/* Shipments Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shipments ({shipments.length})</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.getParent()?.navigate('ShipmentCreate')}
            >
              <Ionicons name="add" size={16} color={colors.primary[600]} />
              <Text style={styles.addButtonText}>New</Text>
            </TouchableOpacity>
          </View>

          {shipments.length === 0 ? (
            <EmptyState
              title="No Shipments Yet"
              description="Track your imports by creating a new shipment"
              actionLabel="Create Shipment"
              onAction={() => navigation.getParent()?.navigate('ShipmentCreate')}
            />
          ) : (
            shipments.map((shipment) => (
              <TouchableOpacity
                key={shipment.id}
                onPress={() =>
                  navigation.getParent()?.navigate('ShipmentDetail', { shipmentId: shipment.id })
                }
                activeOpacity={0.7}
              >
                <Card style={styles.shipmentCard}>
                  <View style={styles.shipmentRow}>
                    <View style={styles.shipmentInfo}>
                      <Text style={styles.shipmentProduct} numberOfLines={1}>
                        {shipment.product}
                      </Text>
                      <Text style={styles.shipmentMeta}>
                        {shipment.supplierCountry} · {shipment.htsCode || 'Unclassified'}
                      </Text>
                      <Text style={styles.shipmentValue}>
                        {formatCurrency(shipment.totalValue)} · {shipment.quantity} pcs
                      </Text>
                    </View>
                    <Badge
                      label={shipment.status}
                      variant={
                        shipment.status === 'filed'
                          ? 'success'
                          : shipment.status === 'reviewed'
                          ? 'info'
                          : shipment.status === 'classified'
                          ? 'warning'
                          : 'default'
                      }
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </Animated.View>

        {/* Account Actions */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Card>
            <MenuItem icon="shield-outline" label="Privacy Policy" onPress={() => {}} />
            <MenuItem icon="document-text-outline" label="Terms of Service" onPress={() => {}} />
            <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => {}} last />
          </Card>
          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, last && styles.menuItemLast]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={20} color={colors.neutral[500]} />
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.neutral[400]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing['5xl'] },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.h1, color: colors.white },
  profileInfo: { flex: 1 },
  profileName: { ...typography.h2, color: colors.neutral[900] },
  profileEmail: { ...typography.body, color: colors.neutral[500], marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.h3, color: colors.neutral[900] },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
  },
  addButtonText: { ...typography.captionMedium, color: colors.primary[600] },
  shipmentCard: { marginBottom: spacing.sm },
  shipmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  shipmentInfo: { flex: 1, marginRight: spacing.md },
  shipmentProduct: { ...typography.bodyMedium, color: colors.neutral[900], marginBottom: 2 },
  shipmentMeta: { ...typography.caption, color: colors.neutral[500], marginBottom: 2 },
  shipmentValue: { ...typography.caption, color: colors.neutral[400] },
  accountSection: { marginTop: spacing['2xl'] },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[100],
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuLabel: { ...typography.body, color: colors.neutral[700] },
  logoutButton: { marginTop: spacing.xl },
});
