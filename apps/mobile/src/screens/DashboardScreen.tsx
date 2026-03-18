import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store';
import { Card, Badge } from '../components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { formatCurrency } from '../utils/format';
import type { MainTabScreenProps } from '../navigation/types';

interface QuickAction {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: string;
  color: string;
  bg: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { key: 'classify', label: 'Classify', icon: 'search-outline', screen: 'Classify', color: colors.primary[600], bg: colors.primary[50] },
  { key: 'calculator', label: 'Calculate', icon: 'calculator-outline', screen: 'Calculator', color: colors.accent[600], bg: colors.accent[50] },
  { key: 'shipment', label: 'Shipment', icon: 'boat-outline', screen: 'ShipmentCreate', color: colors.success[600], bg: colors.success[50] },
  { key: 'audit', label: 'Audit', icon: 'shield-checkmark-outline', screen: 'Audit', color: colors.warning[600], bg: colors.warning[50] },
];

interface StatItem {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export function DashboardScreen({ navigation }: MainTabScreenProps<'Dashboard'>) {
  const { user } = useAuth();
  const { dashboardStats, shipments } = useAppStore();

  const greeting = getGreeting();
  const firstName = user?.displayName?.split(' ')[0] || 'there';

  const stats: StatItem[] = [
    { label: 'Shipments', value: String(dashboardStats.totalShipments), icon: 'cube-outline', color: colors.primary[600] },
    { label: 'Total Duties', value: formatCurrency(dashboardStats.totalDuties), icon: 'cash-outline', color: colors.accent[600] },
    { label: 'Pending', value: String(dashboardStats.pendingClassifications), icon: 'time-outline', color: colors.warning[600] },
    { label: 'Compliance', value: `${dashboardStats.complianceScore}%`, icon: 'checkmark-circle-outline', color: colors.success[600] },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <Text style={styles.avatarText}>
              {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={[styles.statCard, shadows.sm]}>
              <View style={styles.statHeader}>
                <Ionicons name={stat.icon} size={18} color={stat.color} />
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.key}
                style={styles.actionCard}
                onPress={() => {
                  if (action.screen === 'ShipmentCreate' || action.screen === 'Audit') {
                    navigation.getParent()?.navigate(action.screen as any);
                  } else {
                    navigation.navigate(action.screen as any);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: action.bg }]}>
                  <Ionicons name={action.icon} size={22} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Recent Shipments */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Shipments</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {shipments.length === 0 ? (
            <View style={[styles.emptyCard, shadows.sm]}>
              <Ionicons name="cube-outline" size={32} color={colors.neutral[300]} />
              <Text style={styles.emptyTitle}>No shipments yet</Text>
              <Text style={styles.emptyText}>
                Create your first shipment to get started
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.getParent()?.navigate('ShipmentCreate')}
              >
                <Ionicons name="add" size={16} color={colors.primary[600]} />
                <Text style={styles.emptyButtonText}>New Shipment</Text>
              </TouchableOpacity>
            </View>
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
                    {shipment.supplierCountry} · {shipment.htsCode || 'Unclassified'} · {formatCurrency(shipment.totalValue)}
                  </Text>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </Animated.View>
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

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  statCard: {
    width: '48.5%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  statLabel: { ...typography.caption, color: colors.neutral[500] },
  statValue: { ...typography.h2, letterSpacing: -0.3 },

  // Actions
  sectionTitle: {
    ...typography.h3,
    color: colors.neutral[900],
    marginBottom: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing['2xl'],
  },
  actionCard: {
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { ...typography.captionMedium, color: colors.neutral[700] },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAll: { ...typography.bodyMedium, color: colors.primary[600] },

  // Empty state
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.bodyMedium, color: colors.neutral[700] },
  emptyText: { ...typography.caption, color: colors.neutral[400], textAlign: 'center' },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
  },
  emptyButtonText: { ...typography.captionMedium, color: colors.primary[600] },

  // Shipments
  shipmentCard: { marginBottom: spacing.sm },
  shipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  shipmentName: { ...typography.bodyMedium, color: colors.neutral[900], flex: 1, marginRight: spacing.sm },
  shipmentMeta: { ...typography.caption, color: colors.neutral[500] },
});
