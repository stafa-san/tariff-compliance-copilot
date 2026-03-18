import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Shipment, Report } from '../types';

// ─── Generic CRUD ───

export async function getDocument<T>(
  collectionName: string,
  id: string
): Promise<T | null> {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as T;
}

export async function getDocuments<T>(
  collectionName: string
): Promise<T[]> {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T));
}

export async function addDocument(
  collectionName: string,
  data: Record<string, unknown>
): Promise<string> {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateDocument(
  collectionName: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(
  collectionName: string,
  id: string
): Promise<void> {
  await deleteDoc(doc(db, collectionName, id));
}

// ─── Shipments ───

export async function getUserShipments(userId: string): Promise<Shipment[]> {
  const q = query(
    collection(db, 'shipments'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate()
        : new Date(),
      updatedAt: data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate()
        : undefined,
    };
  }) as Shipment[];
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
  const q = query(
    collection(db, 'reports'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate()
        : new Date(),
    };
  }) as Report[];
}

export async function createReport(
  data: Omit<Report, 'id' | 'createdAt'>
): Promise<string> {
  return addDocument('reports', data as Record<string, unknown>);
}
