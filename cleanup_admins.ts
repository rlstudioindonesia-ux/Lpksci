import { db, loadStateFromFirestore } from "./src/db/firebase-adapter.ts";
import { doc, deleteDoc } from "firebase/firestore";

async function main() {
  console.log("Loading database state for admin cleanup...");
  const state = await loadStateFromFirestore({
    registeredStudents: [],
    activeStudents: [],
    users: [],
    customization: {}
  });

  // Find users who have Admin roles
  const adminUsers = state.users.filter((u: any) => 
    ["Admin", "Admin Super", "Admin Biasa", "VVIP"].includes(u.role)
  );

  console.log(`Found ${adminUsers.length} admin users:`);
  console.log(JSON.stringify(adminUsers.map(u => ({ username: u.username, name: u.name, role: u.role, studentId: u.studentId })), null, 2));

  const adminStudentIds = adminUsers.map((u: any) => u.studentId).filter(Boolean);
  const adminNames = adminUsers.map((u: any) => u.name?.toLowerCase());

  const studentsToDelete = state.activeStudents.filter((s: any) => 
    adminStudentIds.includes(s.id) || 
    adminNames.includes(s.name?.toLowerCase()) ||
    s.name?.toLowerCase().includes("admin")
  );

  console.log(`Found ${studentsToDelete.length} admins in activeStudents to clean up:`);
  console.log(JSON.stringify(studentsToDelete, null, 2));

  if (!db) {
    console.error("Database connection not established. Make sure Firestore is configured.");
    return;
  }

  for (const student of studentsToDelete) {
    console.log(`Deleting ${student.name} (ID: ${student.id}) from activeStudents...`);
    try {
      await deleteDoc(doc(db, "activeStudents", student.id));
      console.log(`✅ Deleted ${student.name}`);
    } catch (err) {
      console.error(`❌ Failed to delete ${student.name}:`, err);
    }
  }

  console.log("Cleanup finished!");
}

main().catch(console.error);
