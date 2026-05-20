import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'start-elvan-local',
  apiKey: 'fake-api-key-for-emulator',
  authDomain: 'localhost',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to local emulator
connectFirestoreEmulator(db, 'localhost', 8088);

export { db };
export default app;
