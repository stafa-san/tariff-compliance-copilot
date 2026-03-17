import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Shipment, Report } from '../types';

// ─── Generic CRUD ───

export async function getDocument<T>(
  collectionName: string,
  id: string
): Promise<T | null> {
  const doc = await firestore().collection(collectionName).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as T;
}

export async function getDocuments<T>(
  collectionName: string,
  ...constraints: FirebaseFirestoreTypes.QueryFilterConstraint[]
): Promise<T[]> {
  let query: FirebaseFirestoreTypes.Query = firestore().collection(collectionName);

  // Apply constraints are handled via chaining in the calling code
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
}

export async function addDocument(
  collectionName: string,
  data: Record<string, unknown>
): Promise<string> {
  const docRef = await firestore().collection(collectionName).add({
    ...data,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

export async function updateDocument(
  collectionName: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  await firestore().collection(collectionName).doc(id).update({
    ...data,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
}

export async function deleteDocument(
  collectionName: string,
  id: string
): Promise<void> {
  await firestore().collection(collectionName).doc(id).delete();
}

// ─── Shipments ───

export async function getUserShipments(userId: string): Promise<Shipment[]> {
  const snapshot = await firestore()
    .collection('shipments')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Shipment[];
}

export async function createShipment(
  data: Omit<Shipment, 'id' | 'createdAt'>
): Promise<string> {
  return addDocument('shipments', data as Record<string, unknown>);
}

export async function deleteShipment(id: string): Promise<void> {
  return deleteDocument('shipments', id);
}

// ─── Reports ───

export async function getUserReports(userId: string): Promise<Report[]> {
  const snapshot = await firestore()
    .collection('reports')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Report[];
}

export async function createReport(
  data: Omit<Report, 'id' | 'createdAt'>
): Promise<string> {
  return addDocument('reports', data as Record<string, unknown>);
}
