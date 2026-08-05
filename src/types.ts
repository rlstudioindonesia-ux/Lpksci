/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const JAPAN_PREFECTURES = [
  "Hokkaido", "Aomori", "Iwate", "Miyagi", "Akita", "Yamagata", "Fukushima",
  "Ibaraki", "Tochigi", "Gunma", "Saitama", "Chiba", "Tokyo", "Kanagawa",
  "Niigata", "Toyama", "Ishikawa", "Fukui", "Yamanashi", "Nagano", "Gifu",
  "Shizuoka", "Aichi", "Mie", "Shiga", "Kyoto", "Osaka", "Hyogo", "Nara",
  "Wakayama", "Tottori", "Shimane", "Okayama", "Hiroshima", "Yamaguchi",
  "Tokushima", "Kagawa", "Ehime", "Kochi", "Fukuoka", "Saga", "Nagasaki",
  "Kumamoto", "Oita", "Miyazaki", "Kagoshima", "Okinawa", "Lainnya"
];

export const ALL_48_PREFECTURES_COORDINATES: Record<string, [number, number]> = {
  Hokkaido: [43.0621, 141.3544],
  Aomori: [40.8244, 140.7473],
  Iwate: [39.7036, 141.1527],
  Miyagi: [38.2682, 140.8694],
  Akita: [39.7186, 140.1024],
  Yamagata: [38.2554, 140.3396],
  Fukushima: [37.7608, 140.4748],
  Ibaraki: [36.3418, 140.4468],
  Tochigi: [36.5658, 139.8836],
  Gunma: [36.3907, 139.0604],
  Saitama: [35.8574, 139.6489],
  Chiba: [35.6074, 140.1063],
  Tokyo: [35.6762, 139.6503],
  Kanagawa: [35.4478, 139.6425],
  Niigata: [37.9024, 139.0236],
  Toyama: [36.6953, 137.2113],
  Ishikawa: [36.5947, 136.6256],
  Fukui: [36.0652, 136.2216],
  Yamanashi: [35.6639, 138.5683],
  Nagano: [36.6486, 138.1942],
  Gifu: [35.3912, 136.7223],
  Shizuoka: [34.9756, 138.3828],
  Aichi: [35.1802, 136.9066],
  Mie: [34.7303, 136.5086],
  Shiga: [35.0045, 135.8686],
  Kyoto: [35.0116, 135.7681],
  Osaka: [34.6937, 135.5023],
  Hyogo: [34.6913, 135.1830],
  Nara: [34.6851, 135.8327],
  Wakayama: [34.2260, 135.1675],
  Tottori: [35.5036, 134.2383],
  Shimane: [35.4723, 133.0505],
  Okayama: [34.6618, 133.9350],
  Hiroshima: [34.3963, 132.4594],
  Yamaguchi: [34.1860, 131.4705],
  Tokushima: [34.0711, 134.5593],
  Kagawa: [34.3401, 134.0434],
  Ehime: [33.8416, 132.7657],
  Kochi: [33.5597, 133.5311],
  Fukuoka: [33.5904, 130.4017],
  Saga: [33.2494, 130.3009],
  Nagasaki: [32.7448, 129.8737],
  Kumamoto: [32.7905, 130.7416],
  Oita: [33.2382, 131.6126],
  Miyazaki: [31.9111, 131.4239],
  Kagoshima: [31.5602, 130.5580],
  Okinawa: [26.2124, 127.6809],
  Lainnya: [35.6762, 139.6503]
};

export interface RegisteredStudent {
  id: string;
  timestamp?: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  birthDate: string;
  gender?: "Laki-laki" | "Perempuan";
  district?: string; // Kecamatan domisili (Pati)
  school?: string; // Asal sekolah
  education: string;
  graduationYear?: string;
  statusPendaftaran?: string; // "Siswa Baru" | "Alumni"
  program: string; // e.g., "Tokutei Ginou (SSW)", "Magang (Jishusei)", "Sekolah Bahasa (Ryugakusei)"
  japaneseLevel: string; // e.g., "N5", "N4", "N3", "Belum Belajar"
  date: string;
  status: "Pending" | "Berkas Valid" | "Disetujui" | "Ditolak";
  referrer?: string;
  docAkta?: string;
  docFoto?: string;
  docIjazahSD?: string;
  docIjazahSMP?: string;
  docIjazahSMA?: string;
  docKK?: string;
  docKTP?: string;
  docTranskip?: string;
  paymentMethod?: string;
  paymentAmount?: number;
  paymentStatus?: string;
  proofOfPayment?: string;
  docPraMCU?: string;
  docVaksin?: string;
  docCV1?: string;
  docCV2?: string;
  docCV3?: string;
  docCV4?: string;
  docCV5?: string;
  docMoU?: string;
  docKontrak?: string;
  verifiedDocs?: string[];
}

export interface ActiveStudent {
  id: string;
  name: string;
  batch: string;
  class: string; // e.g., "Regular A", "Alumni N3"
  status: "Belajar" | "On Proges Job" | "On Progres JFT/JLPT/SSW" | "Diklat SO" | "Lulus" | "Di Jepang";
  kategoriPendaftaran?: string; // "Siswa Baru" | "Alumni"
  statusPendaftaran?: string; // "Siswa Baru" | "Alumni"
  referrer?: string;
  gender?: "Laki-laki" | "Perempuan";
  district?: string;
  school?: string;
  prefecture?: string; // If 'Di Jepang', which Japanese Prefecture (e.g., Tokyo, Osaka, Hokkaido)
  city?: string;
  company?: string;
  latitude?: number;
  longitude?: number;
  tb?: number; // Tinggi Badan
  bb?: number; // Berat Badan
  age?: number; // Usia
  mathScore?: number;
  fiveSScore?: number;
  ethicsScore?: number;
  japaneseScore?: number;
  attendanceScore?: number;
  interviewCount?: number;
  profilePicture?: string;
  docAkta?: string;
  docFoto?: string;
  docIjazahSD?: string;
  docIjazahSMP?: string;
  docIjazahSMA?: string;
  docKK?: string;
  docKTP?: string;
  docTranskip?: string;
  docPraMCU?: string;
  docVaksin?: string;
  docCV1?: string;
  docCV2?: string;
  docCV3?: string;
  docCV4?: string;
  docCV5?: string;
  docMoU?: string;
  docKontrak?: string;
  sensei?: string;
  senseiId?: string;
  date?: string; // Tgl pendaftaran / penerimaan
  graduationYear?: string;
  progress?: number;
  currentChapter?: number;
  scores?: { [chapterId: string]: number };
  assignedClass?: string;
  
  // Detailed CV / Biodata (Rirekisho) fields
  birthPlace?: string;
  birthDate?: string;
  address?: string;
  phone?: string;
  religion?: string;
  bloodType?: string;
  marriageStatus?: "Menikah" | "Lajang";
  shoeSize?: number;
  waistSize?: number;
  headSize?: number;
  smoking?: "Merokok" | "Tidak";
  drinking?: "Minum" | "Tidak";
  visionRight?: string;
  visionLeft?: string;
  dominantHand?: "Kanan" | "Kiri";
  colorBlind?: "Ada" | "Tidak Ada";
  colorBlindDetails?: string;
  hobby?: string;
  specialTalent?: string; // 特徴
  strength?: string; // Kelebihan / 長所
  weakness?: string; // Kekurangan / 短所
  purposeToJapan?: string; // Tujuan ke Jepang
  savingTarget?: number; // Target Menabung
  savingTargetYen?: number; // Target Menabung (Yen)
  
  // Complex structures represented as JSON or parsed properties
  educationHistory?: {
    fromYear: string;
    fromMonth: string;
    toYear: string;
    toMonth: string;
    schoolName: string;
    major: string;
  }[];
  workHistory?: {
    fromYear: string;
    fromMonth: string;
    toYear: string;
    toMonth: string;
    companyName: string;
    jobType: string;
    jobDetail?: string;
  }[];
  familyInIndonesia?: {
    name: string;
    age: string;
    relation: string;
    job: string;
  }[];
  familyInJapan?: {
    name: string;
    age: string;
    relation: string;
    job: string;
  }[];
  
  emergencyContactName?: string;
  emergencyContactAddress?: string;
  emergencyContactPhone?: string;
  familyMonthlyIncome?: number;
  familyMonthlyIncomeRp?: number;
  lpkEntryDate?: string;
  studyDuration?: string;
  email?: string;

  // Fields for students who have obtained a job (Monitoring after getting JOB)
  jobTestimonial?: string;      // 1. TESTIMONI SISWA
  jobSoMitra?: string;          // 2. NAMA SO MITRA SCI
  jobCompanyJapan?: string;     // 3. NAMA PERUSAHAAN JEPANG
  jobField?: string;            // 4. NAMA BIDANG JOB LULUS
  jobKumiai?: string;           // 5. NAMA KUMIAI
  jobLocation?: string;         // 6. LOKASI PERUSAHAAN
  jobMcu2Date?: string;         // 7. TANGGAL MCU KE-2
  jobPassportDate?: string;     // 8. TANGGAL PASPORT
  jobCoeDate?: string;          // 9. TANGGAL COE
  jobVisaDate?: string;          // 10. TANGGAL VISA
  jobDepartureDate?: string;    // 11. TANGGAL KEBERANGKATAN
  jobCoeFile?: string;          // 12. UPLOAD COE DARI SO
  jobFeedback?: string;         // 13. KRITIK DAN SARAN mengenai system pembelajaran
  jobRoadmap?: string;          // 14. Roadmap siswa
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  status: "Hadir" | "Izin" | "Sakit" | "Alpa";
  subject: "Bahasa Jepang" | "SSW" | "SOP & Fisika";
  notes?: string;
  class?: string;
  sensei?: string;
  type?: "Masuk" | "Pulang";
  location?: string | null;
  photo?: string | null;
  year?: string;
  role?: string;
}

export interface PaymentRecord {
  id: string;
  studentName: string;
  category: string;
  amount: number;
  date: string;
  status: "Lunas" | "Cicilan" | "Belum Bayar" | "Pending" | "Dihapus" | "Dibatalkan";
  paymentMethod?: string;
  proofOfPayment?: string;
  notes?: string;
  senderBank?: string;
  senderAccountName?: string;
  isSigned?: boolean;
  signatureDate?: string;
  isDeleted?: boolean;
  isClearedAll?: boolean;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  code: string;
  amount: number;
  condition: "Baik" | "Rusak" | "Perlu Servis";
  location: string; // e.g., "Kantor", "Asrama Putra", "Kelas A"
}

export interface TaxRecord {
  id: string;
  monthString: string; // e.g. "Januari 2026", "Februari 2026"
  totalRevenue: number;
  totalExpenses: number;
  taxRate: number; // e.g. 0.11 (11%)
  taxAmount: number;
  status: "Draft" | "Final/Dilaporkan";
  sptFile?: string; // base64 string or file info for "Bukti SPT"
  financialReportFile?: string; // base64 string or file info for "Laporan Keuangan Pajak"
  notes?: string;
}

export interface CashLedgerRecord {
  id: string;
  code: string; // P1, P2... P9
  date: string; // TANGGAL
  description: string; // URAIAN
  inAmount: number; // IN
  outAmount: number; // OUT
}

export interface SalaryRecord {
  id: string;
  staffName: string;
  role: string;
  amount: number;
  monthString: string; // e.g. "Juni 2026", "2026-06"
  paymentDate: string;
  status: "Lunas" | "Pending";
  notes?: string;
  proofOfPayment?: string;
}

export interface TeacherLeave {
  id: string;
  teacherName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "Pending" | "Disetujui" | "Ditolak";
  requestDate: string;
}

export interface TeacherContract {
  id: string;
  teacherName: string;
  content: string; // The text or URL of the contract
  status: "Menunggu TTD" | "Disetujui";
  signedDate?: string;
}

export interface TeacherReport {
  id: string;
  teacherName: string;
  type: "BPJS" | "SPT" | "Agenda";
  fileUrl?: string;
  content?: string;
  submittedDate: string;
}

export interface UserAccount {
  username: string;
  name: string;
  email: string;
  password?: string;
  role: "Admin" | "VVIP" | "Siswa" | "Pengajar" | "Alumni" | "Admin Super" | "Admin Biasa";
  status?: "Active" | "Suspended";
  studentId?: string; // If Siswa, points to ActiveStudent
  profilePicture?: string;
  assignedClass?: string; // Plotted class (from Management Kelas)
  japaneseLevel?: string; // Optional Japanese level for teachers/users
  bankAccount?: string; // e.g. "Bank BCA - 123456789"
  faceRegistered?: boolean;
  faceBiometricData?: string;
  lastActive?: string;
  docCV?: string;
  docIjazah?: string;
  docSertifikat?: string;
  docKTP?: string;
  kecakapanSensei?: string;
  verifiedDocs?: string[];
}

export interface LMSLesson {
  id: string;
  subject: "Bahasa Jepang" | "SSW" | "Metode";
  chapterNumber?: number;
  title: string;
  japaneseTitle?: string;
  difficulty?: string;
  contentType: "slide" | "video" | "buku" | "text_only" | "audio";
  content: string;
  videoUrl?: string; // YouTube / Video embed or file URL
  slidesUrl?: string; // Google Slides embed or PDF presentation URL
  bookUrl?: string; // PDF textbook / book download or reader link
  audioData?: string; // Base64 recorded audio data
  isLocked?: boolean; // Whether the lesson is locked by Sensei/Admin
  targetClass?: string; // Target class for the lesson
  deadline?: string; // ISO date or custom string for deadline / tenggang waktu
  durationMinutes?: number; // pengerjaan time limit in minutes
}

export interface LMSQuiz {
  id: string;
  subject: "Bahasa Jepang" | "SSW";
  questionType?: "pilihan_ganda" | "essay";
  question: string;
  options?: string[]; // for pilihan ganda
  correctAnswerIndex?: number; // for pilihan ganda
  chapterNumber?: number; // associated chapter
  deadline?: string; // ISO date or custom string for deadline / tenggang waktu
  durationMinutes?: number; // pengerjaan time limit in minutes
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
}

export interface ChapterAssessment {
  details?: any;
  id: string;
  studentId: string;
  studentName: string;
  chapterNumber: number; // 1 s/d 25
  title: string;
  status: "Belum Belajar" | "Selesai Belajar" | "Telah Dinilai" | "Menunggu Penilaian" | "Sudah Dinilai";
  subject?: "Bahasa Jepang" | "SSW";
  score?: number; // 0 to 100
  scoreKotoba?: number;
  scoreBumpo?: number;
  scoreKaiwa?: number;
  scoreKanji?: number;
  grade?: "A" | "B" | "C" | "D" | "E";
  notes?: string;
  assessedBy?: string;
  assessedDate?: string;
  isUnlocked?: boolean;
  lessonId?: string;
  submissionUrl?: string;
  submissionDate?: string;
}

export interface JobOrder {
  id: string; // e.g. "JOB-001"
  noReg: string; // no reg
  jobType?: string; // Jenis Order Job
  partnerName: string; // PT Mitra e.g. "PT Fuji Tokutei Agency"
  occupation: string; // bidang kerja
  location: string; // lokasi kerja di Jepang
  salary: string; // gaji (Gaji Pokok)
  overtime: string; // lembur (isian ADA / TIDAK)
  allowance: string; // tunjangan
  contractDuration: string; // lama kontrak
  tbRequirement?: string; // Tinggi Badan
  bbRequirement?: string; // Berat Badan
  interviewExecution?: string; // Pelaksanaan Interview (Online/Offline)
  interviewDate?: string; // Tanggal dan Bulan Interview
  scheduleRegistration?: string; // Jadwal Pendaftaran
  scheduleDocumentSelection?: string; // Jadwal Seleksi Dokumen
  scheduleAnnouncement?: string; // Jadwal Pengumuman
  scheduleMcu?: string; // Jadwal MCU
  status: "Aktif" | "Tutup";
  recommendations?: string[]; // array of recommended active student IDs
  interestedStudents?: string[]; // student IDs of those who are interested
  approvedApplicants?: string[]; // student IDs of those approved by Admin
  applicantDocuments?: { [studentId: string]: any }; // Documents for next stage requirements
  gender?: string; // GENDER (LAKI-LAKI / PEREMPUAN)
  ageRequirement?: string; // USIA (contoh: 18 - 30 tahun)
  recruitCount?: string; // SISWA YANG DIREKRUT (contoh: 6 siswa)
  jobDescription?: string; // DESKRIPSI PEKERJAAN
  minJapaneseScore?: string; // MIN. NILAI BAHASA JEPANG (contoh: BAB 15)
  minAttendanceScore?: string; // MIN. NILAI ABSENSI (contoh: 80)
  minFiveSScore?: string; // MIN. NILAI 5S (contoh: 80)
  minMathScore?: string; // MIN. NILAI MTK (contoh: 90)
  minEthicsScore?: string; // MIN. NILAI ETIKA (contoh: 80)
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // e.g. "2026-06-15"
  desc: string;
  targets: string[]; // e.g. ["Siswa", "Pengajar", "Admin", "VVIP"]
  type?: "Kegiatan" | "Jadwal Belajar" | "Libur";
  studyTime?: string; // e.g. "08:00 - 10:30"
  reminderTime?: string; // e.g. "07:30"
  targetClass?: string; // e.g. "Semua Kelas" or specific class name
  time?: string;
  url?: string;
  location?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  fileUrl?: string;
  fileType?: "image" | "document" | "video" | "other";
  fileName?: string;
}

export interface SystemState {
  registeredStudents: RegisteredStudent[];
  activeStudents: ActiveStudent[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  salaries?: SalaryRecord[];
  cashLedger?: CashLedgerRecord[];
  inventory: InventoryItem[];
  taxes: TaxRecord[];
  users: UserAccount[];
  unfilteredUsers?: UserAccount[];
  events?: CalendarEvent[];
  lmsLessons?: LMSLesson[];
  lmsQuizzes?: LMSQuiz[];
  lmsClasses?: any[];
  chapterAssessments?: ChapterAssessment[];
  jobOrders?: JobOrder[];
  messages?: ChatMessage[];
  teacherLeaves?: TeacherLeave[];
  teacherContracts?: TeacherContract[];
  teacherReports?: TeacherReport[];
  logs?: any[];
  slideshows?: any[];
  galleries?: any[];
  costConfig?: {
    registration: number;
    dp: number;
    fullPayment: number;
    managementFee: number;
  };
  customization?: {
    logoText: string;
    logoIcon: string;
    themeColor: string;
    logoUrl?: string;
    faviconUrl?: string;
    officeLocation?: {
      latitude: number;
      longitude: number;
      radius: number;
      enforce: boolean;
    };
    paymentAccounts?: { bankName: string; accountNumber: string; holderName: string }[];
    runningText?: string;
    slides: {
      id: number;
      tag: string;
      title: string;
      description: string;
      image: string;
      accent: string;
      glowColor: string;
      statValue: string;
      statText: string;
      actionText: string;
    }[];
    gallery?: {
      id: number;
      title: string;
      image: string;
      tag: string;
    }[];
    landingConfig?: {
      heroTitle?: string;
      heroSubtitle?: string;
      ecosystemTitle: string;
      ecosystemSubtitle: string;
      perks: { id: number; title: string; desc: string; color: string }[];
      alumniTitle: string;
      alumniSubtitle: string;
      testimonials: { id: number; name: string; role: string; content: string }[];
      programsTitle: string;
      programsSubtitle: string;
      programs: { id: number; title: string; desc: string; tag: string }[];
      biayaTitle?: string;
      biayaSubtitle?: string;
      alumniPackageTitle?: string;
      alumniPackageSubtitle?: string;
      alumniClasses?: any[];
      opportunityImages?: { id: number; url: string; label: string }[];
    };
    lmsClasses?: { 
      id: string; 
      name: string; 
      isActive: boolean; 
      type: "reguler" | "alumni"; 
      method?: string; // e.g., "Offline", "Online", "Hybrid"
      period?: string; // e.g., "Juni 2026", "September 2026"
      activeChapterNum?: number;
      chapters?: { number: number; title: string; japaneseTitle: string; description: string; isActive?: boolean }[];
      mathChapters?: { number: number; title: string; japaneseTitle: string; description: string; isActive?: boolean }[];
    }[];
    inventoryAreas?: string[];
  };
}
