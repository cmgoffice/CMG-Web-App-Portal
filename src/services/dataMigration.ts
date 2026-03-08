import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from '../firebase';
import { PATHS } from './dbPaths';

/**
 * Migrate ข้อมูลจาก path เก่า ไปยัง path ใหม่ (/CMG-web-portal/root/...)
 * 
 * OLD paths:
 * - /users -> /CMG-web-portal/root/users
 * - /activityLogs -> /CMG-web-portal/root/activityLogs  
 * - /projects -> /CMG-web-portal/root/projects
 * - /appMeta -> /CMG-web-portal/root/appMeta
 */

export async function migrateAllData(): Promise<void> {
  console.log('🔄 Starting data migration...');
  const db = getDb();

  try {
    // 1. Migrate users
    console.log('📂 Migrating users...');
    const usersSnap = await getDocs(collection(db, 'users'));
    if (!usersSnap.empty) {
      const batch = writeBatch(db);
      usersSnap.docs.forEach((userDoc) => {
        const newRef = doc(db, PATHS.users, userDoc.id);
        batch.set(newRef, userDoc.data());
      });
      await batch.commit();
      console.log(`✅ Migrated ${usersSnap.docs.length} users`);
    } else {
      console.log('ℹ️  No users to migrate');
    }

    // 2. Migrate activityLogs
    console.log('📂 Migrating activityLogs...');
    const logsSnap = await getDocs(query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc')));
    if (!logsSnap.empty) {
      const batch = writeBatch(db);
      logsSnap.docs.forEach((logDoc) => {
        const newRef = doc(db, PATHS.activityLogs, logDoc.id);
        batch.set(newRef, logDoc.data());
      });
      await batch.commit();
      console.log(`✅ Migrated ${logsSnap.docs.length} activity logs`);
    } else {
      console.log('ℹ️  No activity logs to migrate');
    }

    // 3. Migrate projects
    console.log('📂 Migrating projects...');
    const projectsSnap = await getDocs(collection(db, 'projects'));
    if (!projectsSnap.empty) {
      const batch = writeBatch(db);
      projectsSnap.docs.forEach((projectDoc) => {
        const newRef = doc(db, PATHS.projects, projectDoc.id);
        batch.set(newRef, projectDoc.data());
      });
      await batch.commit();
      console.log(`✅ Migrated ${projectsSnap.docs.length} projects`);
    } else {
      console.log('ℹ️  No projects to migrate');
    }

    // 4. Migrate appMeta/config
    console.log('📂 Migrating appMeta...');
    const metaSnap = await getDocs(collection(db, 'appMeta'));
    if (!metaSnap.empty) {
      const batch = writeBatch(db);
      metaSnap.docs.forEach((metaDoc) => {
        const newRef = doc(db, PATHS.appMeta, metaDoc.id);
        batch.set(newRef, metaDoc.data());
      });
      await batch.commit();
      console.log(`✅ Migrated ${metaSnap.docs.length} appMeta documents`);
    } else {
      console.log('ℹ️  No appMeta to migrate');
    }

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

export async function checkOldDataExists(): Promise<boolean> {
  const db = getDb();
  const collections = ['users', 'activityLogs', 'projects', 'appMeta'];
  
  for (const collName of collections) {
    const snap = await getDocs(collection(db, collName));
    if (!snap.empty) {
      console.log(`📋 Found ${snap.docs.length} documents in old collection: ${collName}`);
      return true;
    }
  }
  return false;
}

export async function deleteOldCollections(): Promise<void> {
  console.log('🗑️  Deleting old collections...');
  const db = getDb();
  const collections = ['users', 'activityLogs', 'projects', 'appMeta'];

  for (const collName of collections) {
    const snap = await getDocs(collection(db, collName));
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`🗑️  Deleted ${snap.docs.length} documents from ${collName}`);
    }
  }
  console.log('✅ Old collections cleanup completed');
}
