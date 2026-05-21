import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'start-elvan',
  appId: '1:949893466307:web:7d487e8a772dbf111f7a76',
  storageBucket: 'start-elvan.firebasestorage.app',
  apiKey: 'AIzaSyApA2iA1UKDD4SkcjIVjmqCLXpJA5Weg_g',
  authDomain: 'start-elvan.firebaseapp.com',
  messagingSenderId: '949893466307',
  measurementId: 'G-PHT0G2XM9W',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Only connect to local emulator during development
if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, 'localhost', 8088);
}

export { db };
export default app;
