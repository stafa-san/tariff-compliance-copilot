import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Shipment,
  Report,
  ClassificationResult,
  DutyCalculation,
  DashboardStats,
} from '../types';

interface AppState {
  // ─── Dashboard ───
  dashboardStats: DashboardStats;
  setDashboardStats: (stats: DashboardStats) => void;

  // ─── Shipments ───
  shipments: Shipment[];
  setShipments: (shipments: Shipment[]) => void;
  addShipment: (shipment: Shipment) => void;
  removeShipment: (id: string) => void;

  // ─── Reports ───
  reports: Report[];
  setReports: (reports: Report[]) => void;

  // ─── Classification History ───
  recentClassifications: ClassificationResult[];
  addClassification: (result: ClassificationResult) => void;
  clearClassifications: () => void;

  // ─── Calculator History ───
  recentCalculations: DutyCalculation[];
  addCalculation: (result: DutyCalculation) => void;
  clearCalculations: () => void;

  // ─── UI State ───
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Dashboard
      dashboardStats: {
        totalShipments: 0,
        pendingClassifications: 0,
        totalDuties: 0,
        complianceScore: 0,
      },
      setDashboardStats: (stats) => set({ dashboardStats: stats }),

      // Shipments
      shipments: [],
      setShipments: (shipments) => set({ shipments }),
      addShipment: (shipment) =>
        set((state) => ({ shipments: [shipment, ...state.shipments] })),
      removeShipment: (id) =>
        set((state) => ({
          shipments: state.shipments.filter((s) => s.id !== id),
        })),

      // Reports
      reports: [],
      setReports: (reports) => set({ reports }),

      // Classification History
      recentClassifications: [],
      addClassification: (result) =>
        set((state) => ({
          recentClassifications: [result, ...state.recentClassifications].slice(0, 20),
        })),
      clearClassifications: () => set({ recentClassifications: [] }),

      // Calculator History
      recentCalculations: [],
      addCalculation: (result) =>
        set((state) => ({
          recentCalculations: [result, ...state.recentCalculations].slice(0, 20),
        })),
      clearCalculations: () => set({ recentCalculations: [] }),

      // UI State
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (value) => set({ hasCompletedOnboarding: value }),
    }),
    {
      name: 'tariff-copilot-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        recentClassifications: state.recentClassifications,
        recentCalculations: state.recentCalculations,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);
