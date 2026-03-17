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
  limit,
  type DocumentData,
  type QueryConstraint,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

export const getDocument = async <T extends DocumentData>(
  collectionName: string,
  id: string
) => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as T & { id: string };
};

export const getDocuments = async <T extends DocumentData>(
  collectionName: string,
  ...constraints: QueryConstraint[]
) => {
  const q = query(collection(db, collectionName), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as T & { id: string }
  );
};

export const addDocument = async (
  collectionName: string,
  data: DocumentData
) => {
  return addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const updateDocument = async (
  collectionName: string,
  id: string,
  data: Partial<DocumentData>
) => {
  const docRef = doc(db, collectionName, id);
  return updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteDocument = async (collectionName: string, id: string) => {
  const docRef = doc(db, collectionName, id);
  return deleteDoc(docRef);
};

export { where, orderBy, limit, serverTimestamp };
