import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store';
import { createShipment } from '../services/firestore';
import { Button, Input, Select, Card } from '../components/ui';
import { colors, spacing, typography } from '../theme';
import { COUNTRIES } from '../utils/constants';
import type { RootStackScreenProps } from '../navigation/types';

const countryOptions = COUNTRIES.map((c) => ({ label: c.name, value: c.code }));
const shippingOptions = [
  { label: 'Ocean', value: 'ocean' },
  { label: 'Air', value: 'air' },
  { label: 'Truck', value: 'truck' },
  { label: 'Rail', value: 'rail' },
];

export function ShipmentCreateScreen({ navigation }: RootStackScreenProps<'ShipmentCreate'>) {
  const { user } = useAuth();
  const addShipment = useAppStore((s) => s.addShipment);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [product, setProduct] = useState('');
  const [htsCode, setHtsCode] = useState('');
  const [supplier, setSupplier] = useState('');
  const [supplierCountry, setSupplierCountry] = useState('CN');
  const [quantity, setQuantity] = useState('');
  const [unitValue, setUnitValue] = useState('');
  const [shippingMethod, setShippingMethod] = useState('ocean');

  const handleSubmit = async () => {
    if (!product.trim() || !quantity || !unitValue) {
      Alert.alert('Missing Fields', 'Please fill in product, quantity, and unit value.');
      return;
    }

    setIsSubmitting(true);
    try {
      const qty = parseInt(quantity, 10);
      const uv = parseFloat(unitValue);
      const shipmentData = {
        userId: user?.uid || '',
        name: product.trim(),
        status: 'draft' as const,
        product: product.trim(),
        htsCode: htsCode.trim(),
        supplier: supplier.trim(),
        supplierCountry,
        quantity: qty,
        unitValue: uv,
        totalValue: qty * uv,
        shippingMethod: shippingMethod as 'ocean' | 'air' | 'truck' | 'rail',
      };

      const id = await createShipment(shipmentData);
      addShipment({ ...shipmentData, id, createdAt: new Date() });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to create shipment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>New Shipment</Text>

          <Card style={styles.formCard}>
            <Input
              label="Product Description *"
              placeholder="e.g., Men's cotton hooded sweatshirt"
              value={product}
              onChangeText={setProduct}
            />
            <Input
              label="HTS Code"
              placeholder="e.g., 6110.20.2079 (optional)"
              value={htsCode}
              onChangeText={setHtsCode}
            />
            <Input
              label="Supplier Name"
              placeholder="e.g., Guangzhou Elite Apparel"
              value={supplier}
              onChangeText={setSupplier}
            />
            <Select
              label="Supplier Country"
              options={countryOptions}
              value={supplierCountry}
              onValueChange={setSupplierCountry}
            />
            <View style={styles.row}>
              <Input
                label="Quantity *"
                placeholder="500"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
                containerStyle={styles.halfInput}
              />
              <Input
                label="Unit Value (USD) *"
                placeholder="18.00"
                value={unitValue}
                onChangeText={setUnitValue}
                keyboardType="decimal-pad"
                containerStyle={styles.halfInput}
              />
            </View>
            <Select
              label="Shipping Method"
              options={shippingOptions}
              value={shippingMethod}
              onValueChange={setShippingMethod}
            />

            {quantity && unitValue && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Value</Text>
                <Text style={styles.totalValue}>
                  ${(parseInt(quantity, 10) * parseFloat(unitValue) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            )}

            <Button
              title="Create Shipment"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={!product.trim() || !quantity || !unitValue}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing['5xl'] },
  title: { ...typography.h1, color: colors.neutral[900], marginBottom: spacing.xl },
  formCard: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  halfInput: { flex: 1 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  totalLabel: { ...typography.bodyMedium, color: colors.neutral[700] },
  totalValue: { ...typography.h3, color: colors.primary[700] },
});
