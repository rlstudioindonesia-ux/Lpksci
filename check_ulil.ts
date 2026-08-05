import { db } from './src/db/firebase-adapter.js';
import { collection, getDocs } from 'firebase/firestore';

async function main() {
  const studentsSnap = await getDocs(collection(db, 'activeStudents'));
  const students = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  const matches = students.filter((s: any) => (s.name || "").toLowerCase().includes("jannah") || (s.name || "").toLowerCase().includes("syariun"));
  console.log("Matches in activeStudents:", matches);

  const usersSnap = await getDocs(collection(db, 'users'));
  const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const userMatches = users.filter((u: any) => (u.name || "").toLowerCase().includes("jannah") || (u.name || "").toLowerCase().includes("syariun"));
  console.log("Matches in users:", userMatches);

  process.exit(0);
}
main();
