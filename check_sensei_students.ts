import { db } from './src/db/firebase-adapter.js';
import { collection, getDocs } from 'firebase/firestore';

async function main() {
  const studentsSnap = await getDocs(collection(db, 'activeStudents'));
  const students = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  console.log("Total students:", students.length);
  students.forEach((s: any) => {
    console.log(`Student: ${s.name} (ID: ${s.id}) Class: "${s.class}" Sensei: "${s.sensei}"`);
  });

  process.exit(0);
}
main();
