import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store';
import { Card, StatCard, SectionHeader, Badge } from '../components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { formatCurrency } from '../utils/format';
import type { MainTabScreenProps } from '../navigation/types';

const QUICK_ACTIONS = [
  { key: 'classify', label: 'Classify Product', icon: '&#128269;', screen: 'Classify' },
  { key: 'calculator', label: 'Calculate Duties', icon: '&#128200;', screen: 'Calculator' },
  { key: 'shipment', label: 'New Shipment', icon: '&#128230;', screen: 'ShipmentCreate' },
  { key: 'audit', label: 'Run Audit', icon: '&#128203;', screen: 'Tools' },
] as const;

export function DashboardScreen({ navigation }: MainTabScreenProps<'Dashboard'>) {
  const { user } = useAuth();
  const { dashboardStats, shipments } = useAppStore();

  const greeting = getGreeting();
  const firstName = user?.displayName?.split(' ')[0] || 'there';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            title="Shipments"
            value={String(dashboardStats.totalShipments)}
            color={colors.primary[600]}
          />
          <StatCard
            title="Total Duties"
            value={formatCurrency(dashboardStats.totalDuties)}
            color={colors.accent[600]}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            title="Pending"
            value={String(dashboardStats.pendingClassifications)}
            color={colors.warning[600]}
          />
          <StatCard
            title="Compliance"
            value={`${dashboardStats.complianceScore}%`}
            color={colors.success[600]}
          />
        </View>

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={[styles.actionCard, shadows.sm]}
              onPress={() => {
                if (action.screen === 'ShipmentCreate') {
                  navigation.getParent()?.navigate('ShipmentCreate');
                } else {
                  navigation.navigate(action.screen as keyof typeof navigation);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Shipments */}
        <SectionHeader
          title="Recent Shipments"
          action="View All"
          onAction={() => navigation.navigate('Profile')}
        />
        {shipments.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>
              No shipments yet. Create your first shipment to get started.
            </Text>
          </Card>
        ) : (
          shipments.slice(0, 3).map((shipment) => (
            <TouchableOpacity
              key={shipment.id}
              onPress={() => navigation.getParent()?.navigate('ShipmentDetail', { shipmentId: shipment.id })}
            >
              <Card style={styles.shipmentCard}>
                <View style={styles.shipmentHeader}>
                  <Text style={styles.shipmentName} numberOfLines={1}>
                    {shipment.product}
                  </Text>
                  <Badge
                    label={shipment.status}
                    variant={
                      shipment.status === 'filed'
                        ? 'success'
                        : shipment.status === 'reviewed'
                        ? 'info'
                        : 'default'
                    }
                  />
                </View>
                <Text style={styles.shipmentMeta}>
                  {shipment.supplierCountry} &middot; {shipment.htsCode || 'Unclassified'} &middot;{' '}
                  {formatCurrency(shipment.totalValue)}
                </Text>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing['5xl'] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  greeting: { ...typography.body, color: colors.neutral[500] },
  name: { ...typography.h1, color: colors.neutral[900] },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.h3, color: colors.white },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  actionCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { ...typography.captionMedium, color: colors.neutral[700], textAlign: 'center' },
  shipmentCard: { marginBottom: spacing.sm },
  shipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  shipmentName: { ...typography.bodyMedium, color: colors.neutral[900], flex: 1, marginRight: spacing.sm },
  shipmentMeta: { ...typography.caption, color: colors.neutral[500] },
  emptyText: { ...typography.body, color: colors.neutral[400], textAlign: 'center' },
});
