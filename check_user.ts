import { db } from './src/db/firebase-adapter.js';
import { getDoc, doc } from 'firebase/firestore';

async function main() {
  const userRef = doc(db, 'users', 'rlstudioindonesia@gmail.com');
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    console.log("User data:", userDoc.data());
  } else {
    console.log("User not found");
  }
  process.exit(0);
}
main();
