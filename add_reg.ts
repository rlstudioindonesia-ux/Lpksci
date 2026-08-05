import { db, syncEntityToFirestore } from './src/db/firebase-adapter.js';

async function main() {
  const newRegStudent = {
    id: "SIS-013",
    name: "Rangga Dino",
    email: "rlstudioindonesia@gmail.com",
    phone: "081234567899",
    birthDate: "2000-01-01",
    education: "SMK Multimedia",
    program: "Tokutei Ginou (SSW)",
    japaneseLevel: "Pemula (N5)",
    date: "2026-06-25",
    status: "Diterima",
    district: "Jakarta",
    gender: "Laki-laki",
    school: "SMKN 1 Jakarta",
    statusPendaftaran: "Reguler"
  };

  syncEntityToFirestore("registeredStudents", newRegStudent.id, newRegStudent);
  
  console.log("Added reg student to Firestore");
  setTimeout(() => process.exit(0), 2000);
}

main();
