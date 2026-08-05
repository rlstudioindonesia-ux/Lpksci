import { db } from './src/db/firebase-adapter.js';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

async function main() {
  const customizationSnap = await getDoc(doc(db, 'customization', 'general'));
  if (customizationSnap.exists()) {
    console.log("Customization general:");
    const cust = customizationSnap.data();
    console.log("lmsClasses:", cust.lmsClasses);
  } else {
    console.log("No customization general document found");
  }

  const lmsClassesSnap = await getDocs(collection(db, 'lmsClasses'));
  const lmsClasses = lmsClassesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log("\nlmsClasses collection count:", lmsClasses.length);
  console.log("lmsClasses data:", lmsClasses);

  process.exit(0);
}
main();
