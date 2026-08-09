// Menghitung usia (tahun) dari tanggal lahir, dibulatkan ke bawah berdasarkan tanggal hari ini.
export function calculateAge(birthDate?: string | null): number | undefined {
  if (!birthDate) return undefined;
  const dob = new Date(birthDate);
  if (isNaN(dob.getTime())) return undefined;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 && age < 120 ? age : undefined;
}
