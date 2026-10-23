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

// Tanggal lokal perangkat (YYYY-MM-DD). `new Date().toISOString()` memakai UTC,
// sehingga di WIB (UTC+7) sebelum jam 07.00 pagi "hari ini" terbaca sebagai
// tanggal KEMARIN: absen pagi tercatat di hari sebelumnya dan presensi Sensei
// pagi ditolak sebagai "sudah absen hari ini".
export function toLocalISODate(date: Date | string | number = new Date()): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayLocalISO(): string {
  return toLocalISODate(new Date());
}

// Untuk server (Cloud Run berjalan dalam UTC): tanggal hari ini menurut WIB.
export function todayJakartaISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
