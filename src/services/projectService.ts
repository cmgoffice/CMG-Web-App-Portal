import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
  UpdateData,
} from 'firebase/firestore';
import { getDb } from '../firebase';
import type { Project } from '../types/project';

const PROJECTS_COLL = 'projects';

export async function getProjects(): Promise<Project[]> {
  const db = getDb();
  const q = query(collection(db, PROJECTS_COLL), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
}

export function subscribeProjects(callback: (projects: Project[]) => void): Unsubscribe {
  const db = getDb();
  const q = query(collection(db, PROJECTS_COLL), orderBy('name'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project)));
  });
}

export async function createProject(name: string, description?: string): Promise<Project> {
  const db = getDb();
  const ref = await addDoc(collection(db, PROJECTS_COLL), {
    name,
    description: description ?? '',
    isActive: true,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, name, description: description ?? '', isActive: true, createdAt: new Date() };
}

export async function updateProject(id: string, updates: Partial<Omit<Project, 'id'>>): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, PROJECTS_COLL, id), updates as UpdateData<Project>);
}

export async function deleteProject(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, PROJECTS_COLL, id));
}

/** Seed โปรเจกต์ตัวอย่างหากยังไม่มี */
export async function seedProjectsIfEmpty(): Promise<void> {
  const existing = await getProjects();
  if (existing.length > 0) return;

  const sampleProjects = [
    'โครงการก่อสร้าง A - กรุงเทพฯ',
    'โครงการก่อสร้าง B - เชียงใหม่',
    'โครงการก่อสร้าง C - ภูเก็ต',
    'โครงการพัฒนาอสังหาริมทรัพย์ D',
    'โครงการโครงสร้างพื้นฐาน E',
  ];
  for (const name of sampleProjects) {
    await createProject(name);
  }
}
