import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// const firebaseConfig = {
//   projectId: 'start-elvan-local',
//   apiKey: 'fake-api-key-for-emulator',
//   authDomain: 'localhost',
// };
const firebaseConfig = {
  apiKey: "AIzaSyApA2iA1UKDD4SkcjIVjmqCLXpJA5Weg_g",
  authDomain: "start-elvan.firebaseapp.com",
  projectId: "start-elvan",
  storageBucket: "start-elvan.firebasestorage.app",
  messagingSenderId: "949893466307",
  appId: "1:949893466307:web:7d487e8a772dbf111f7a76",
  measurementId: "G-PHT0G2XM9W"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to local emulator
if (false) {
  connectFirestoreEmulator(db, 'localhost', 8088);
}

export { db };
export default app;
