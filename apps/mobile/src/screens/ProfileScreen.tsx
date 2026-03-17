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
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store';
import { getUserShipments } from '../services/firestore';
import { Card, Button, Badge, SectionHeader, EmptyState } from '../components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { formatCurrency, formatDate } from '../utils/format';
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
        <View style={styles.profileHeader}>
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
        </View>

        {/* Shipments Section */}
        <SectionHeader
          title={`Shipments (${shipments.length})`}
          action="+ New"
          onAction={() => navigation.getParent()?.navigate('ShipmentCreate')}
        />

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
                      {shipment.supplierCountry} &middot; {shipment.htsCode || 'Unclassified'}
                    </Text>
                    <Text style={styles.shipmentValue}>
                      {formatCurrency(shipment.totalValue)} &middot; {shipment.quantity} pcs
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

        {/* Account Actions */}
        <View style={styles.accountSection}>
          <SectionHeader title="Account" />
          <Card>
            <MenuItem label="Privacy Policy" onPress={() => navigation.getParent()?.navigate('PrivacyPolicy')} />
            <MenuItem label="Terms of Service" onPress={() => navigation.getParent()?.navigate('TermsOfService')} />
          </Card>
          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuChevron}>{'\u203A'}</Text>
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
  menuLabel: { ...typography.body, color: colors.neutral[700] },
  menuChevron: { fontSize: 20, color: colors.neutral[400] },
  logoutButton: { marginTop: spacing.xl },
});
