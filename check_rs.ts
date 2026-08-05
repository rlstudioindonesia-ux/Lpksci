import { db } from './src/db/firebase-adapter.js';
import { getDoc, doc } from 'firebase/firestore';

async function main() {
  const rsRef = doc(db, 'registeredStudents', 'SIS-013');
  const rsDoc = await getDoc(rsRef);
  if (rsDoc.exists()) {
    console.log("RegStudent data (SIS-013):", rsDoc.data());
  } else {
    console.log("RegStudent SIS-013 not found!");
  }
  process.exit(0);
}
main();
