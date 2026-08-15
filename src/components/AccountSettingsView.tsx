/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  User,
  Shield,
  Mail,
  Key,
  Users,
  UserPlus,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  GraduationCap,
  Award,
  BookOpen,
  ShieldAlert,
  BadgeCheck,
  Zap,
  Lock,
  Camera,
  Image as ImageIcon,
  Upload,
  Compass,
  Menu,
  ChevronLeft, ChevronRight,
  FileText,
  Eye,
  EyeOff,
  Loader2,
  Info,
} from "lucide-react";
import { uploadFileToFirebase, getEmbeddablePdfUrl, getSafePhotoUrl, createSvgAvatar } from "../lib/storageHelper";
import { UserAccount, SystemState } from "../types";
import { ConfirmForm } from "./ConfirmForm";
import { ConfirmButton } from "./ConfirmButton";
import StudentCvView from "./StudentCvView";

interface AccountSettingsViewProps {
  currentUser: UserAccount | null;
  systemState: SystemState;
  onUpdateState: (
    dataType: string,
    action: string,
    payload: any,
  ) => Promise<boolean>;
  onLoginSuccess?: (user: UserAccount) => void;
  onOpenLogin?: () => void;
  initialTab?: "profil" | "manajemen" | "cv" | "doc_sensei";
}

export default function AccountSettingsView({
  currentUser,
  systemState,
  onUpdateState,
  onLoginSuccess,
  onOpenLogin,
  initialTab,
}: AccountSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<"profil" | "manajemen" | "cv" | "doc_sensei">(initialTab || "profil");
  const [viewingDoc, setViewingDoc] = useState<{ title: string; url: string } | null>(null);
  const [selectedSenseiForDocCheck, setSelectedSenseiForDocCheck] = useState<UserAccount | null>(null);

  React.useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  const [isMenuMinimized, setIsMenuMinimized] = useState(false);

  // Local states for updating own profile
  const myActiveStudent = systemState.activeStudents?.find(
    (s) => s.id === currentUser?.studentId || s.name === currentUser?.name
  );
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [password, setPassword] = useState("••••••••");
  const [profilePicture, setProfilePicture] = useState(
    currentUser?.profilePicture || "",
  );
  const [myJapaneseLevel, setMyJapaneseLevel] = useState(currentUser?.japaneseLevel || "");
  const [myKecakapanSensei, setMyKecakapanSensei] = useState(currentUser?.kecakapanSensei || "");
  const [isSavedSelf, setIsSavedSelf] = useState(false);
  const [selfError, setSelfError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setProfilePicture(currentUser.profilePicture || "");
      setMyJapaneseLevel(currentUser.japaneseLevel || "");
      setMyKecakapanSensei(currentUser.kecakapanSensei || "");
    }
  }, [currentUser]);


  // Local states for managing other accounts (Admin/VVIP Desk)
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<any>("Siswa");
  const [editStatus, setEditStatus] = useState<"Active" | "Suspended">(
    "Active",
  );
  const [editStudentId, setEditStudentId] = useState("");
  const [editProfilePicture, setEditProfilePicture] = useState("");
  const [editAssignedClass, setEditAssignedClass] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editJapaneseLevel, setEditJapaneseLevel] = useState("");
  const [editKecakapanSensei, setEditKecakapanSensei] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // States for creating a new account (Admin/VVIP Desk)
  const [manajemenSubTab, setManajemenSubTab] = useState<"daftar" | "registrasi">("registrasi");
  const [newUsername, setNewUsername] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<
    "Admin" | "VVIP" | "Siswa" | "Pengajar" | "Alumni"
  >("Siswa");
  const [newStudentId, setNewStudentId] = useState("");
  const [newProfilePicture, setNewProfilePicture] = useState("");
  const [newAssignedClass, setNewAssignedClass] = useState("");
  const [newJapaneseLevel, setNewJapaneseLevel] = useState("");
  const [newKecakapanSensei, setNewKecakapanSensei] = useState("");
  const [isAdminMessage, setIsAdminMessage] = useState("");
  const [isErrorAdd, setIsErrorAdd] = useState("");

  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("Semua");
  const [userPage, setUserPage] = useState(1);

  // States for student editing their registration data
  const [isEditingReg, setIsEditingReg] = useState(false);
  const [regData, setRegData] = useState<any>({});
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  const resizeImage = (
    file: File,
    maxWidth: number,
    maxHeight: number,
    callback: (str: string) => void,
  ) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          callback(canvas.toDataURL("image/jpeg", 0.7));
        } else {
          callback(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setPicState: (val: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const downloadUrl = await uploadFileToFirebase(file, "profile_pictures");
      setPicState(downloadUrl);
    } catch (err: any) {
      console.error(err);
      alert(`Gagal mengunggah foto profil: ${err.message || err}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setProfilePicture(currentUser.profilePicture || "");
      setMyJapaneseLevel(currentUser.japaneseLevel || "");
      setMyKecakapanSensei(currentUser.kecakapanSensei || "");
      if (currentUser.role !== "VVIP") {
        setNewRole("Siswa");
      }
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-6 shadow-md">
        <div className="h-14 w-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto ring-4 ring-amber-50">
          <Lock className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="font-display font-bold text-lg text-slate-900">
            Akses Terkunci
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Halaman pengaturan akun memerlukan autentikasi login. Silakan tekan
            tombol di bawah untuk masuk ke akun Anda.
          </p>
        </div>
        <button
          onClick={onOpenLogin}
          className="w-full sm:w-auto px-6 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-900 transition"
        >
          Masuk Sekarang
        </button>
      </div>
    );
  }

  // Handle self profile update save
  const handleSaveSelf = async (e: React.FormEvent) => {
    e.preventDefault();
    setSelfError("");
    setIsSavedSelf(false);

    if (!name.trim() || !email.trim()) {
      setSelfError("Nama dan E-mail wajib diisi!");
      return;
    }

    const payload: any = {
      username: currentUser.username,
      name,
      email,
      role: currentUser.role,
      studentId: currentUser.studentId,
      profilePicture,
    };

    if (currentUser.role === "Pengajar") {
      payload.japaneseLevel = myJapaneseLevel;
      payload.kecakapanSensei = myKecakapanSensei;
    }

    if (password && password !== "••••••••") {
      payload.password = password;
    }

    const success = await onUpdateState("users", "edit", payload);
    if (success) {
      if (onLoginSuccess) {
        onLoginSuccess({
          ...currentUser,
          ...payload,
        });
      }
      setIsSavedSelf(true);
      setPassword("••••••••");
      setTimeout(() => setIsSavedSelf(false), 3000);
    } else {
      setSelfError("Gagal memperbarui profil di server.");
    }
  };

  const startEditRegData = () => {
    if (registeredStudentInfo) {
      setRegData({ ...registeredStudentInfo });
      setIsEditingReg(true);
      setRegError("");
      setRegSuccess(false);
    }
  };

  const handleSaveRegData = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess(false);

    if (!regData.name || !regData.phone || !regData.district) {
      setRegError(
        "Mohon lengkapi data yang wajib diisi (Nama, No HP, Alamat).",
      );
      return;
    }

    const success = await onUpdateState(
      isFromActiveStudents ? "activeStudents" : "registeredStudents",
      "update",
      regData,
    );
    if (success) {
      setIsEditingReg(false);
      setRegSuccess(true);
      setTimeout(() => setRegSuccess(false), 3000);

      // Also update the activeStudent profile if needed to sync names/phone etc.
      if (currentUser?.studentId) {
        await onUpdateState("activeStudents", "update_status", {
          id: currentUser.studentId,
          name: regData.name,
          phone: regData.phone,
        });
      }
    } else {
      setRegError("Gagal menyimpan data pendaftaran.");
    }
  };

  // Handle add user account
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsErrorAdd("");
    setIsAdminMessage("");

    if (!newUsername.trim() || !newName.trim() || !newEmail.trim()) {
      setIsErrorAdd("Semua bidang wajib diisi untuk mendaftarkan akun baru.");
      return;
    }

    const payload = {
      username: newUsername.trim().toLowerCase(),
      name: newName,
      email: newEmail,
      role: newRole,
      password: newPassword.trim() || "adminadmin",
      studentId:
        newRole === "Siswa" || newRole === "Alumni"
          ? newStudentId || `SIS-0${Math.floor(Math.random() * 80) + 20}`
          : undefined,
      profilePicture: newProfilePicture,
      japaneseLevel: newRole === "Pengajar" ? newJapaneseLevel : undefined,
      assignedClass:
        newRole === "Siswa" || newRole === "Pengajar"
          ? newAssignedClass
          : undefined,
      kecakapanSensei: newRole === "Pengajar" ? newKecakapanSensei : undefined,
    };

    const success = await onUpdateState("users", "add", payload);
    if (success) {
      setNewUsername("");
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewStudentId("");
      setNewProfilePicture("");
      setNewAssignedClass("");
      setNewJapaneseLevel("");
      setNewKecakapanSensei("");
      setIsAdminMessage(
        `Sukses membuat akun baru: @${payload.username} (${payload.role})`,
      );
      setTimeout(() => setIsAdminMessage(""), 400);
    } else {
      setIsErrorAdd("Username sudah terdaftar atau gagal mengirim data.");
    }
  };

  // Handle start edit other user
  const startEditUser = (user: UserAccount) => {
    setEditingUsername(user.username);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditStatus(user.status || "Active");
    setEditStudentId(user.studentId || "");
    setEditProfilePicture(user.profilePicture || "");
    setEditAssignedClass(user.assignedClass || "");
    setEditPassword(user.password || "");
    setEditJapaneseLevel(user.japaneseLevel || "");
    setEditKecakapanSensei(user.kecakapanSensei || "");
  };

  // Save edit other user
  const handleSaveEditOther = async (username: string) => {
    const payload: any = {
      username,
      name: editName,
      email: editEmail,
      role: editRole,
      status: editStatus,
      studentId: editStudentId,
      profilePicture: editProfilePicture,
      assignedClass:
        editRole === "Siswa" || editRole === "Pengajar"
          ? editAssignedClass
          : "",
      japaneseLevel: editRole === "Pengajar" ? editJapaneseLevel : "",
      kecakapanSensei: editRole === "Pengajar" ? editKecakapanSensei : "",
    };

    if (editPassword.trim()) {
      payload.password = editPassword.trim();
    }

    const success = await onUpdateState("users", "edit", payload);
    if (success) {
      setEditingUsername(null);
      setEditPassword("");
    } else {
      alert("Gagal menyimpan perubahan. Pastikan Anda memiliki akses yang cukup.");
    }
  };

  // Handle delete user account
  const handleDeleteUser = async (username: string) => {
    if (username === currentUser.username) {
      alert(
        "Anda tidak bisa menghapus akun Anda sendiri demi faktor keamanan.",
      );
      return;
    }
    await onUpdateState("users", "delete", { username });
  };

  // Role styled icons
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Admin":
      case "Admin Super":
      case "Admin Biasa":
        return <Shield className="h-4 w-4 text-amber-600" />;
      case "VVIP":
        return <Award className="h-4 w-4 text-rose-600 animate-pulse" />;
      case "Pengajar":
        return <BookOpen className="h-4 w-4 text-emerald-600" />;
      default:
        return <GraduationCap className="h-4 w-4 text-indigo-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Admin":
      case "Admin Super":
      case "Admin Biasa":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "VVIP":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Pengajar":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
  };

  let registeredStudentInfo: any = null;
  let isFromActiveStudents = false;

  if (currentUser?.role === "Siswa" || currentUser?.role === "Alumni") {
    const foundReg = systemState.registeredStudents?.find(
      (rs) =>
        (currentUser.studentId && rs.id === currentUser.studentId) ||
        rs.email === currentUser.email,
    );
    if (foundReg) {
      registeredStudentInfo = foundReg;
    } else {
      const foundActive = systemState.activeStudents?.find(
        (as) =>
          as.id === currentUser.studentId ||
          (currentUser.name && as.name === currentUser.name) ||
          as.email === currentUser.email,
      );
      if (foundActive) {
        registeredStudentInfo = foundActive;
        isFromActiveStudents = true;
      }
    }
  }

  const tabs =
    initialTab === "manajemen"
      ? [
          {
            id: "manajemen" as const,
            name: "Manajemen Akun & Sensei",
            ic: Users,
            desc: `Database ${
              (currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa")
                ? "Siswa"
                : "Semua Akun"
            } (${
              (currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa")
                ? (systemState.users?.filter(u => u.role === "Siswa" || u.role === "Alumni")?.length || 0)
                : (systemState.users?.length || 0)
            })`
          }
        ]
      : [
          { id: "profil" as const, name: "Profil Saya", ic: User, desc: "Informasi diri & kata sandi" },
          ...(currentUser?.role === "Siswa" || currentUser?.role === "Alumni"
            ? [
                {
                  id: "cv" as const,
                  name: "Pengaturan CV",
                  ic: FileText,
                  desc: "Data Curriculum Vitae"
                },
              ]
            : []),
          ...(currentUser?.role === "Pengajar"
            ? [
                {
                  id: "doc_sensei" as const,
                  name: "Berkas & Sertifikasi",
                  ic: FileText,
                  desc: "Curriculum Vitae, Ijazah & Sertifikat"
                },
              ]
            : []),
        ];

  const filteredUsers = (systemState.users || [])
    .filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(userSearchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (roleFilter !== "Semua" && user.role !== roleFilter) return false;
      if (currentUser?.role === "Admin" || currentUser?.role === "Admin Biasa") {
        return user.role === "Siswa" || user.role === "Alumni";
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const USERS_PER_PAGE = 10;
  const totalUserPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE) || 1;
  const paginatedUsers = filteredUsers.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 py-2 px-1 sm:px-4 text-left overflow-x-hidden">
      {/* Segmented Top Navigation Tab Bar */}
      {tabs.length > 1 && (
        <div className="bg-slate-100 p-1.5 sm:p-2 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex flex-row items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full">
            {tabs.map((tab) => {
              const Icon = tab.ic;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer whitespace-nowrap min-h-[40px] ${
                    isActive
                      ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
                      : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-500"}`} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-3 shrink-0">
            <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest bg-slate-200/60 px-2 py-0.5 rounded-md">
              LPK SC Dashboard
            </span>
          </div>
        </div>
      )}

      <div className="space-y-6 w-full">
        {/* View Header with beautiful profile summary card */}
        {activeTab !== "manajemen" && (
          <div className="bg-gradient-to-r from-indigo-700 to-[#001d3d] text-white rounded-3xl p-5 sm:p-6 shadow-md border-b-4 border-yellow-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <User className="h-48 w-48 text-white" />
            </div>
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full min-w-0">
              <div className="flex items-center gap-4 w-full min-w-0">
                <img
                  src={getSafePhotoUrl(currentUser?.profilePicture || registeredStudentInfo?.docFoto, currentUser?.name)}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 rounded-2xl object-cover border-2 border-white/20 shadow-inner shrink-0"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = createSvgAvatar(currentUser?.name || 'User');
                  }}
                />
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <h2 className="font-display text-xl sm:text-2xl font-black tracking-tight truncate flex-1 min-w-0">
                      {currentUser?.name || "Pengguna"}
                    </h2>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider border shrink-0 ${getRoleBadgeColor(currentUser?.role || "Siswa")}`}
                    >
                      {currentUser?.role === "Siswa" &&
                      systemState.activeStudents?.find(
                        (s) =>
                          s.id === currentUser?.studentId ||
                          s.name === currentUser?.name,
                      )?.kategoriPendaftaran === "Alumni"
                        ? "Alumni"
                        : (currentUser?.role || "Siswa")}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-300 font-mono mt-1 break-all">
                    Akun Utama: @{currentUser?.username || "username"} • {currentUser?.email || "email"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "profil" ? (
          /* PROFIL SAYA CARD */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 space-y-4 shadow-sm w-full min-w-0">
              <h3 className="font-sans font-bold text-slate-900 text-sm border-b pb-2">
                Status Autentikasi
              </h3>

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    LEVEL OTORISASI
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {getRoleIcon(currentUser.role)}
                    <span className="font-extrabold text-slate-900">
                      {currentUser.role === "Pengajar"
                        ? "Sensei / Staf LPK"
                        : currentUser.role}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-mono block uppercase">
                    Nomor Induk Siswa (NIS)
                  </span>
                  <span className="font-mono text-slate-800 mt-1 block font-bold">
                    {currentUser?.studentId || myActiveStudent?.id || (
                      <span className="text-slate-300 italic">
                        Bukan akun siswa
                      </span>
                    )}
                  </span>
                </div>

                {(currentUser?.role === "Siswa" || currentUser?.role === "Alumni" || myActiveStudent) && (
                  <>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block uppercase">
                        Nama Kelas LPK
                      </span>
                      <span className="text-slate-800 mt-1 block font-extrabold text-blue-600">
                        {myActiveStudent?.class || currentUser?.assignedClass || "Belum ada kelas"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block uppercase">
                        Sensei Pengampu
                      </span>
                      <span className="text-slate-800 mt-1 block font-bold">
                        {myActiveStudent?.sensei || "Belum ditentukan"}
                      </span>
                    </div>
                  </>
                )}

                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    FINGERPRINT BIO TOKEN (MOBILE)
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                    <BadgeCheck className="h-4 w-4" />
                    <span>Aktif / Terautentikasi</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border text-[10.5px] text-slate-600 leading-normal">
                  Ubah kata sandi atau informasi internal lainnya melalui
                  formulir di samping kanan. Informasi disinkronkan langsung ke
                  server pusat LPK.
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 w-full min-w-0">
              <h3 className="font-sans font-bold text-slate-900 text-sm border-b pb-2 mb-4">
                Sunting Akun
              </h3>

              {isSavedSelf && (
                <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex gap-2 animate-fade-in">
                  <Check className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-semibold">
                      Perubahan Berhasil Disimpan!
                    </p>
                    <p className="text-[11px] text-emerald-700/90 mt-0.5">
                      Informasi profil Anda telah dimutakhirkan secara langsung
                      di database LPK.
                    </p>
                  </div>
                </div>
              )}

              {selfError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-xs flex gap-2">
                  <ShieldAlert className="h-4.5 w-4.5 text-rose-600" />
                  <span>{selfError}</span>
                </div>
              )}

              <ConfirmForm
                onSubmit={handleSaveSelf}
                className="space-y-4 text-xs"
              >
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Ganti Foto Profil
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <img
                      src={getSafePhotoUrl(profilePicture, name)}
                      className="h-10 w-10 rounded-xl object-cover border border-slate-200"
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = createSvgAvatar(name || 'User');
                      }}
                    />
                    <label className={`bg-slate-50 border border-slate-200 hover:bg-white text-slate-600 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-2 ${uploadingAvatar ? 'opacity-50 pointer-events-none' : ''}`}>
                      {uploadingAvatar ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4" /> Upload Foto Baru
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingAvatar}
                        onChange={(e) => handleFileUpload(e, setProfilePicture)}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-hidden focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">
                      E-mail Terdaftar
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-hidden focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-400 flex items-center gap-1 leading-none">
                      <User className="h-3.5 w-3.5 text-slate-400" /> Username
                      (Read-Only)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.username}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-400 px-3.5 py-2.5 cursor-not-allowed font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">
                      Ganti Kata Sandi (Password)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 pl-3.5 pr-10 py-2.5 outline-hidden focus:border-blue-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {currentUser.role === "Pengajar" && (
                  <div className="grid sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Level Bahasa Jepang</label>
                      <input
                        type="text"
                        placeholder="cth: N3, N4, Belum Ada"
                        value={myJapaneseLevel}
                        onChange={(e) => setMyJapaneseLevel(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-hidden focus:border-blue-500 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Keterangan Kecakapan Khusus</label>
                      <textarea
                        placeholder="cth: Menguasai tata bahasa dasar, sertifikat mengajar pedagogi, dll"
                        value={myKecakapanSensei}
                        onChange={(e) => setMyKecakapanSensei(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-hidden focus:border-blue-500 transition"
                        rows={2}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-700 text-white hover:bg-indigo-900 font-bold uppercase rounded-xl transition shadow-xs cursor-pointer tracking-wider"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </ConfirmForm>
            </div>

            {/* REGISTRATION DATA VIEW FOR STUDENTS */}
            {registeredStudentInfo && (
              <div className="md:col-span-3 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 space-y-4 w-full min-w-0">
                <div className="border-b pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <h3 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-blue-600 shrink-0" />
                      Data Pendaftaran Anda
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Berikut adalah rekam data pribadi yang Anda ajukan saat
                      pendaftaran.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-slate-100 text-slate-600 font-mono text-[10px] rounded-lg border font-bold shrink-0 self-start sm:self-auto">
                      {registeredStudentInfo.id}
                    </div>
                    {!isEditingReg && (
                      <button
                        onClick={startEditRegData}
                        className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[10px] rounded-lg border border-blue-200 transition cursor-pointer"
                      >
                        Sunting Data
                      </button>
                    )}
                  </div>
                </div>

                {isEditingReg ? (
                  <form onSubmit={handleSaveRegData} className="space-y-4">
                    {regError && (
                      <div className="bg-red-50 text-red-600 p-2 text-xs rounded-xl border border-red-100 font-medium">
                        {regError}
                      </div>
                    )}
                    {regSuccess && (
                      <div className="bg-emerald-50 text-emerald-600 p-2 text-xs rounded-xl border border-emerald-100 font-medium">
                        Data berhasil disimpan.
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-xs">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] text-slate-400 font-mono block">
                          NAMA LENGKAP KTP *
                        </label>
                        <input
                          type="text"
                          value={regData.name || ""}
                          onChange={(e) =>
                            setRegData({ ...regData, name: e.target.value })
                          }
                          className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 outline-hidden focus:border-blue-500 transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-mono block">
                          TGL LAHIR
                        </label>
                        <input
                          type="date"
                          value={regData.birthDate || ""}
                          onChange={(e) =>
                            setRegData({
                              ...regData,
                              birthDate: e.target.value,
                            })
                          }
                          className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 outline-hidden focus:border-blue-500 transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-mono block">
                          JENIS KELAMIN
                        </label>
                        <select
                          value={regData.gender || ""}
                          onChange={(e) =>
                            setRegData({ ...regData, gender: e.target.value })
                          }
                          className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 outline-hidden focus:border-blue-500 transition"
                        >
                          <option value="">Pilih</option>
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] text-slate-400 font-mono block">
                          ALAMAT / DOMISILI *
                        </label>
                        <input
                          type="text"
                          value={regData.district || ""}
                          onChange={(e) =>
                            setRegData({ ...regData, district: e.target.value })
                          }
                          className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 outline-hidden focus:border-blue-500 transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-mono block">
                          NO WHATSAPP *
                        </label>
                        <input
                          type="text"
                          value={regData.phone || ""}
                          onChange={(e) =>
                            setRegData({ ...regData, phone: e.target.value })
                          }
                          className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 outline-hidden focus:border-blue-500 transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-mono block">
                          PENDIDIKAN TERAKHIR
                        </label>
                        <input
                          type="text"
                          value={regData.education || ""}
                          onChange={(e) =>
                            setRegData({
                              ...regData,
                              education: e.target.value,
                            })
                          }
                          className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 outline-hidden focus:border-blue-500 transition"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] text-slate-400 font-mono block">
                          ASAL SEKOLAH / KAMPUS
                        </label>
                        <input
                          type="text"
                          value={regData.school || ""}
                          onChange={(e) =>
                            setRegData({ ...regData, school: e.target.value })
                          }
                          className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 outline-hidden focus:border-blue-500 transition"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] text-slate-400 font-mono block">
                          KEMAMPUAN BAHASA
                        </label>
                        <input
                          type="text"
                          value={regData.japaneseLevel || ""}
                          onChange={(e) =>
                            setRegData({
                              ...regData,
                              japaneseLevel: e.target.value,
                            })
                          }
                          className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 outline-hidden focus:border-blue-500 transition"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <button
                        type="button"
                        onClick={() => setIsEditingReg(false)}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
                      >
                        Simpan Perubahan
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono block">
                        PROGRAM KELAS
                      </span>
                      <span className="font-semibold text-slate-800 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100 break-words">
                        {registeredStudentInfo.program}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono block">
                        KATEGORI PENDAFTARAN
                      </span>
                      <span className="font-semibold text-slate-800 break-words">
                        {registeredStudentInfo.statusPendaftaran || "-"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono block">
                        KEMAMPUAN BAHASA
                      </span>
                      <span className="font-semibold text-slate-800 break-words">
                        {registeredStudentInfo.japaneseLevel}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono block">
                        TANGGAL DAFTAR
                      </span>
                      <span className="font-semibold text-slate-800 break-words">
                        {registeredStudentInfo.date}
                      </span>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono block">
                        NAMA LENGKAP KTP
                      </span>
                      <span className="font-semibold text-slate-800 break-words">
                        {registeredStudentInfo.name}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono block">
                        JENIS KELAMIN
                      </span>
                      <span className="font-semibold text-slate-800 break-words">
                        {registeredStudentInfo.gender || "-"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono block">
                        TGL LAHIR
                      </span>
                      <span className="font-semibold text-slate-800 break-words">
                        {registeredStudentInfo.birthDate}
                      </span>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono block">
                        ALAMAT / DOMISILI
                      </span>
                      <span className="font-semibold text-slate-800 break-words">
                        {registeredStudentInfo.district || "-"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono block">
                        NO WHATSAPP
                      </span>
                      <span className="font-semibold text-slate-800 break-words">
                        {registeredStudentInfo.phone}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono block">
                        PENDIDIKAN TERAKHIR
                      </span>
                      <span className="font-semibold text-slate-800 break-words">
                        {registeredStudentInfo.education}
                      </span>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono block">
                        ASAL SEKOLAH / KAMPUS
                      </span>
                      <span className="font-semibold text-slate-800 break-words">
                        {registeredStudentInfo.school || "-"}
                      </span>
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono block">
                        STATUS VERIFIKASI DOKUMEN
                      </span>
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 break-words">
                        {registeredStudentInfo.status}
                      </span>
                    </div>
                  </div>
                )}

                {/* SECTION 17 DOKUMEN PENDAFTARAN & AKADEMIK */}
                <div className="mt-8 pt-8 border-t border-slate-150 text-left">
                  <div className="mb-5">
                    <h4 className="font-sans font-black text-slate-900 text-sm flex items-center gap-2 uppercase tracking-wide">
                      📂 Berkas & Dokumen Akademik/Pendaftaran (17 Dokumen)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Unggah, lihat, dan perbarui seluruh dokumen persyaratan akademik dan pendaftaran magang Jepang Anda secara mandiri di bawah ini.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { field: "docKTP", label: "KTP (Kartu Tanda Penduduk)", type: "PDF" },
                      { field: "docKK", label: "Kartu Keluarga (KK)", type: "PDF" },
                      { field: "docAkta", label: "Akta Kelahiran", type: "PDF" },
                      { field: "docIjazahSD", label: "Ijazah SD", type: "PDF" },
                      { field: "docIjazahSMP", label: "Ijazah SMP", type: "PDF" },
                      { field: "docIjazahSMA", label: "Ijazah SMA/SMK/Sederajat", type: "PDF" },
                      { field: "docTranskip", label: "Transkrip Nilai Akademik", type: "PDF" },
                      { field: "docFoto", label: "Pasfoto (Background Merah)", type: "JPG" },
                      { field: "docPraMCU", label: "Hasil Pra Medical Check-Up", type: "MED" },
                      { field: "docVaksin", label: "Sertifikat Vaksin Booster", type: "MED" },
                      { field: "docCV1", label: "Curriculum Vitae (CV) - Bagian 1", type: "CV" },
                      { field: "docCV2", label: "Curriculum Vitae (CV) - Bagian 2", type: "CV" },
                      { field: "docCV3", label: "Curriculum Vitae (CV) - Bagian 3", type: "CV" },
                      { field: "docCV4", label: "Curriculum Vitae (CV) - Bagian 4", type: "CV" },
                      { field: "docCV5", label: "Curriculum Vitae (CV) - Bagian 5", type: "CV" },
                      { field: "docMoU", label: "MoU Dokumen Persetujuan", type: "MoU" },
                      { field: "docKontrak", label: "Kontrak Kerja (JOB)", type: "JOB" },
                    ].map((doc, idx) => {
                      const rawVal = (registeredStudentInfo as any)[doc.field];
                      const currentVal = rawVal && !rawVal.includes("_default.") ? rawVal : "";
                      const badgeColor = 
                        doc.type === "PDF" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        doc.type === "JPG" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        doc.type === "MED" ? "bg-rose-50 text-rose-700 border-rose-200" :
                        doc.type === "CV" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-indigo-50 text-indigo-700 border-indigo-200";

                      return (
                        <div key={doc.field} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/40 flex flex-col justify-between gap-3 hover:border-indigo-200 hover:bg-white transition shadow-xs">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border leading-none bg-white">
                                #{idx + 1}
                              </span>
                              <span className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded border leading-none uppercase shrink-0 ${badgeColor}`}>
                                {doc.type}
                              </span>
                              <span className="text-[11px] font-bold text-slate-800 truncate" title={doc.label}>
                                {doc.label}
                              </span>
                            </div>
                            
                            <div className="mt-2.5 flex items-center gap-2 bg-slate-50/80 px-2.5 py-1.5 rounded-xl border border-slate-100 text-[10px] text-slate-600 truncate font-mono">
                              <span className="text-slate-400 shrink-0">📄</span>
                              <span className="truncate" title={currentVal.includes('|') ? currentVal.split('|')[0] : (currentVal.startsWith('http') || currentVal.startsWith('data:') ? 'Berkas Terlampir' : currentVal) || "Belum ada berkas terunggah"}>
                                {(currentVal.includes('|') ? currentVal.split('|')[0] : (currentVal.startsWith('http') || currentVal.startsWith('data:') ? 'Berkas Terlampir' : currentVal)) || "Belum ada berkas terunggah"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-1.5 border-t border-slate-100 pt-2.5">
                            <label className="flex-1 bg-white hover:bg-indigo-50/50 text-indigo-700 hover:text-indigo-800 border border-slate-200 hover:border-indigo-200 px-2 py-1.5 rounded-xl text-[10px] font-black cursor-pointer transition text-center flex items-center justify-center gap-1 shadow-2xs">
                              <Upload className="h-3.5 w-3.5" />
                              <span>{currentVal ? "Ganti" : "Unggah"}</span>
                              <input
                                type="file"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const url = await uploadFileToFirebase(file, "registrations");
                                    const updated = {
                                      ...registeredStudentInfo,
                                      [doc.field]: `${file.name}|${url}`,
                                    };
                                    if (doc.field === "docFoto") {
                                      updated.profilePicture = url;
                                      setProfilePicture(url);
                                      if ((currentUser as any)?.id || currentUser?.username) {
                                        await onUpdateState("users", "edit", {
                                          ...currentUser,
                                          profilePicture: url,
                                          docFoto: `${file.name}|${url}`
                                        });
                                      }
                                    }
                                    await onUpdateState(
                                      isFromActiveStudents ? "activeStudents" : "registeredStudents",
                                      "update",
                                      updated
                                    );
                                  } catch (err) {
                                    alert("Gagal mengunggah berkas");
                                  }
                                }}
                              />
                            </label>

                            {currentVal && (
                              <button
                                type="button"
                                onClick={() => {
                                  setViewingDoc({
                                    title: doc.label,
                                    url: currentVal.includes("|") ? currentVal.split("|")[1] : currentVal,
                                  });
                                }}
                                className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1.5 rounded-xl text-[10px] font-black transition text-center flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                                title="Lihat Berkas"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Lihat</span>
                              </button>
                            )}

                            {currentVal && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const updated = {
                                    ...registeredStudentInfo,
                                    [doc.field]: "",
                                  };
                                  await onUpdateState(
                                    isFromActiveStudents ? "activeStudents" : "registeredStudents",
                                    "update",
                                    updated
                                  );
                                }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-150 transition cursor-pointer"
                                title="Hapus Berkas"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === "manajemen" ? (
          /* MANAJEMEN SEMUA AKUN (Hanya tampak jika role Admin / VVIP) */
          <div className="space-y-4 w-full">
            {/* Sub-tabs for mobile management */}
            <div className="flex lg:hidden bg-slate-100 p-1 rounded-xl border border-slate-200 items-center justify-between gap-1 w-full max-w-xs mx-auto mb-2">
              <button
                onClick={() => setManajemenSubTab("registrasi")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                  manajemenSubTab === "registrasi"
                    ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <UserPlus className="h-3 w-3" />
                <span>Registrasi</span>
              </button>
              <button
                onClick={() => setManajemenSubTab("daftar")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                  manajemenSubTab === "daftar"
                    ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Users className="h-3 w-3" />
                <span>Daftar Akun</span>
              </button>
            </div>

            <div className="flex flex-col-reverse gap-6 w-full max-w-full min-w-0">
              {/* Daftar User Accounts */}
              <div className={`lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm min-w-0 w-full max-w-full ${manajemenSubTab === "daftar" ? "block" : "hidden lg:block"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="font-display font-black text-slate-900 text-sm tracking-tight uppercase">
                    Daftar Akun Pengguna
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Database seluruh pengguna (Siswa, Pengajar, Direksi, dan Admin).
                  </p>
                </div>
                <div className="relative group w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Cari nama / username..."
                    value={userSearchTerm}
                    onChange={(e) => { setUserSearchTerm(e.target.value); setUserPage(1); }}
                    className="w-full sm:w-[180px] text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-xl px-8 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
                  />
                  <Compass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
              </div>

              {/* INFO BOX ALUMNI ACTIVATION STATUS */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 text-[11px] leading-relaxed text-slate-600 shadow-3xs">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="font-extrabold text-slate-800 uppercase block tracking-wide text-[10px]">
                      ℹ️ Klasifikasi Data & Status Aktivasi Login Alumni
                    </span>
                    <p className="mt-1 font-medium">
                      Sistem membedakan dua sumber utama data Alumni untuk mempermudah pemantauan dan verifikasi:
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-700">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Diinput Admin (Alumni Sheet)</span>
                    </div>
                    <p className="text-slate-500 pl-3.5 text-[10px] leading-relaxed">
                      Akun alumni yang dibuat otomatis berdasarkan input data sebaran wilayah / alumni sheet. Akun ini <strong className="text-slate-700 font-extrabold">belum diaktivasi</strong> (belum memiliki email dan password login).
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Registrasi Mandiri (Form Online)</span>
                    </div>
                    <p className="text-slate-500 pl-3.5 text-[10px] leading-relaxed">
                      Siswa atau alumni mendaftar sendiri via form online. Akun login <strong className="text-emerald-600 font-extrabold">telah aktif</strong> lengkap dengan email dan password yang siap digunakan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Filter Role Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin -mx-1 px-1">
                {[
                  { label: "Semua", value: "Semua", color: "bg-slate-100 text-slate-700 border-slate-200" },
                  { label: "Siswa", value: "Siswa", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
                  { label: "Sensei", value: "Pengajar", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                  { label: "Alumni", value: "Alumni", color: "bg-sky-50 text-sky-700 border-sky-200" },
                  { label: "Admin Super", value: "Admin Super", color: "bg-amber-50 text-amber-700 border-amber-200" },
                  { label: "Admin Biasa", value: "Admin Biasa", color: "bg-amber-50 text-amber-700 border-amber-200" },
                  { label: "Admin VIP", value: "VVIP", color: "bg-rose-50 text-rose-700 border-rose-200" },
                ].map((opt) => {
                  const isActive = roleFilter === opt.value;
                  const count = (systemState.users || []).filter((u) => {
                    if (currentUser?.role === "Admin" || currentUser?.role === "Admin Biasa") {
                      if (u.role !== "Siswa" && u.role !== "Alumni") return false;
                    }
                    if (opt.value === "Semua") return true;
                    return u.role === opt.value;
                  }).length;

                  return (
                    <button
                      key={opt.value}
                      onClick={() => { setRoleFilter(opt.value); setUserPage(1); }}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border whitespace-nowrap transition cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                        isActive
                          ? "bg-indigo-700 text-white border-indigo-700 shadow-xs"
                          : `${opt.color} hover:bg-white`
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${
                        isActive ? "bg-white text-indigo-700" : "bg-white/60 text-slate-700"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3 lg:max-h-[650px] lg:overflow-y-auto overflow-x-hidden overflow-y-visible pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                {paginatedUsers.map((user) => {
                    const isEditing = editingUsername === user.username;
                    const isMe = user.username === currentUser.username;

                    return (
                      <div
                        key={user.username}
                        className={`group p-4 rounded-2xl border transition-all duration-200 ${
                          isMe 
                            ? "border-indigo-200 bg-indigo-50/20 shadow-indigo-100/50" 
                            : "border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md hover:shadow-slate-100"
                        } flex flex-col gap-3 overflow-hidden w-full`}
                      >
                      {isEditing ? (
                        /* Mode Edit */
                        <div className="flex-1 space-y-2 text-xs">
                          <div className="text-[10px] text-slate-400 font-bold block uppercase">
                            Edit Akun @{user.username}{" "}
                            {isMe && "(Anda Sendiri)"}
                          </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                             <input
                               type="text"
                               placeholder="Nama Lengkap"
                               value={editName}
                               onChange={(e) => setEditName(e.target.value)}
                               className="text-xs p-2 rounded-lg border border-slate-200 w-full"
                             />
                             <input
                               type="email"
                               placeholder="Email"
                               value={editEmail}
                               onChange={(e) => setEditEmail(e.target.value)}
                               className="text-xs p-2 rounded-lg border border-slate-200 w-full"
                             />
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select
                              value={editRole}
                              onChange={(e) =>
                                setEditRole(e.target.value as any)
                              }
                              disabled={currentUser.role !== "VVIP" && currentUser.role !== "Admin Super"}
                              className="text-xs p-2 rounded-lg border border-slate-200 bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                            >
                              <option value="Siswa">Siswa</option>
                              <option value="Alumni">Alumni</option>
                              <option value="Pengajar">Pengajar</option>
                              <option value="Admin Super">ADMIN SUPER</option>
                              <option value="Admin Biasa">ADMIN BIASA</option>
                              <option value="VVIP">VVIP / DIREKSI</option>
                            </select>
                            <select
                              value={editStatus}
                              onChange={(e) =>
                                setEditStatus(e.target.value as any)
                              }
                              className="text-xs p-2 rounded-lg border border-slate-200 bg-white"
                            >
                              <option value="Active">
                                🟢 Active (Bisa Login)
                              </option>
                              <option value="Suspended">
                                🔴 Suspended (Diblokir)
                              </option>
                            </select>
                          </div>

                          <div className="space-y-1 text-left">
                            <label className="text-[9.5px] text-slate-400 font-extrabold block uppercase tracking-wider">
                              Ubah Kata Sandi (Password)
                            </label>
                            <div className="relative">
                              <input
                                type={showEditPassword ? "text" : "password"}
                                placeholder="Masukkan kata sandi baru"
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                                className="text-xs pl-2 pr-8 py-2 rounded-lg border border-slate-200 w-full"
                              />
                              <button
                                type="button"
                                onClick={() => setShowEditPassword(!showEditPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                              >
                                {showEditPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>
                          </div>
                          {(editRole === "Siswa" || editRole === "Alumni") && (
                            <div className="grid grid-cols-1 gap-2">
                              <input
                                type="text"
                                placeholder="Nomor ID (cth: SIS-001)"
                                value={editStudentId}
                                onChange={(e) =>
                                  setEditStudentId(e.target.value)
                                }
                                className="text-xs p-2 rounded-lg border border-slate-200"
                              />
                            </div>
                          )}
                          {editRole === "Pengajar" && (
                            <div className="space-y-3 text-left">
                              <div className="space-y-1">
                                <label className="text-[9.5px] text-slate-400 font-extrabold block uppercase tracking-wider">
                                  Level Bahasa Jepang (JLPT/JFT)
                                </label>
                                <input
                                  type="text"
                                  placeholder="cth: N3, N2, dll"
                                  value={editJapaneseLevel}
                                  onChange={(e) => setEditJapaneseLevel(e.target.value)}
                                  className="text-xs p-2.5 rounded-xl border border-slate-200 bg-white w-full focus:border-blue-500 focus:outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9.5px] text-slate-400 font-extrabold block uppercase tracking-wider">
                                  Keterangan Kecakapan Khusus / Sertifikasi / Pengalaman
                                </label>
                                <textarea
                                  placeholder="cth: Menguasai tata bahasa dasar, sertifikat mengajar pedagogi, dll"
                                  value={editKecakapanSensei}
                                  onChange={(e) => setEditKecakapanSensei(e.target.value)}
                                  className="text-xs p-2.5 rounded-xl border border-slate-200 bg-white w-full focus:border-blue-500 focus:outline-none"
                                  rows={2}
                                />
                              </div>
                            </div>
                          )}
                          {(editRole === "Siswa" ||
                            editRole === "Pengajar" ||
                            editRole === "Alumni") && (
                            <div className="space-y-1 text-left">
                              <label className="text-[9.5px] text-slate-400 font-extrabold block uppercase tracking-wider">
                                Plotting Kelas / Batch & Kelas (LPK SC)
                              </label>
                              <select
                                value={editAssignedClass}
                                onChange={(e) =>
                                  setEditAssignedClass(e.target.value)
                                }
                                className="text-xs p-2.5 rounded-xl border border-slate-200 bg-white w-full font-extrabold focus:border-blue-500 text-blue-600 focus:outline-none"
                              >
                                <option value="">Belum ada kelas</option>
                                <optgroup label="Kelas E-Benkyou">
                                  {systemState.customization?.lmsClasses && systemState.customization.lmsClasses.length > 0 ? (
                                    systemState.customization.lmsClasses.map(cls => (
                                      <option key={cls.id} value={cls.name}>{cls.name}</option>
                                    ))
                                  ) : (
                                    <option value="" disabled>Belum ada data kelas</option>
                                  )}
                                </optgroup>
                              </select>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            {editProfilePicture && (
                              <img
                                src={editProfilePicture}
                                className="h-8 w-8 rounded-lg object-cover border border-slate-200"
                                alt="Preview"
                              />
                            )}
                            <label className={`flex-1 bg-slate-50 border border-slate-200 hover:bg-white text-slate-600 px-2 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center justify-center gap-1.5 ${uploadingAvatar ? 'opacity-50 pointer-events-none' : ''}`}>
                              {uploadingAvatar ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
                                </>
                              ) : (
                                <>
                                  <Camera className="h-3 w-3" /> Rekomendasi Foto Pengguna
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingAvatar}
                                onChange={(e) =>
                                  handleFileUpload(e, setEditProfilePicture)
                                }
                              />
                            </label>
                          </div>
                          <div className="flex justify-end gap-1.5 pt-1">
                            <button
                              onClick={() => setEditingUsername(null)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-semibold"
                            >
                              Batal
                            </button>
                            <ConfirmButton
                              confirmTitle="Simpan Perubahan Akun"
                              confirmMessage={`Anda yakin ingin memperbarui data akun @${user.username}?`}
                              onConfirmClick={() =>
                                handleSaveEditOther(user.username)
                              }
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                            >
                              Simpan
                            </ConfirmButton>
                          </div>
                        </div>
                      ) : (
                        /* Mode View */
                        <div className="flex flex-col gap-3 w-full">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                            <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1 w-full">
                              <div className="relative shrink-0">
                                <img
                                  src={getSafePhotoUrl(user.profilePicture, user.name)}
                                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl object-cover border-2 border-white shadow-sm ring-1 ring-slate-100"
                                  alt={user.name || "Avatar"}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = createSvgAvatar(user.name || 'User');
                                  }}
                                />
                                <div className={`absolute -bottom-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 rounded-full border-2 border-white shadow-xs flex items-center justify-center ${user.status === 'Suspended' ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                                  {user.status === 'Suspended' ? <X className="h-2 w-2 text-white" /> : <Check className="h-2 w-2 text-white" />}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <div className="flex items-center gap-1.5 flex-wrap min-w-0 max-w-full">
                                  <span className="font-black text-slate-900 text-xs sm:text-sm leading-tight block truncate max-w-full">
                                    {user.name}
                                  </span>
                                  {isMe && (
                                    <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full tracking-wider font-black uppercase shadow-sm shrink-0">
                                      Anda
                                    </span>
                                  )}
                                </div>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 mt-0.5 font-mono truncate max-w-full overflow-hidden">
                                  @{user.username} • <span className="text-slate-300 font-medium lowercase italic">{user.email}</span>
                                </p>
                                
                                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                                  <div
                                    className={`px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black font-mono uppercase tracking-wider border flex items-center gap-1 whitespace-nowrap shadow-xs ${getRoleBadgeColor(user.role)}`}
                                  >
                                    {getRoleIcon(user.role)}
                                    <span>{user.role}</span>
                                  </div>
                                  
                                  {user.studentId && (
                                    <div className="bg-slate-50 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black font-mono tracking-wider whitespace-nowrap shadow-xs">
                                      ID: {user.studentId}
                                    </div>
                                  )}
                                  
                                  {(user.role === "Siswa" || user.role === "Pengajar") && (
                                    <div className="bg-blue-600 text-white border border-blue-700 px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black font-mono uppercase tracking-wider whitespace-nowrap shadow-xs">
                                      Plot: {user.assignedClass || "Belum ada kelas"}
                                    </div>
                                  )}
                                  {user.role === "Pengajar" && (
                                    <>
                                      <div className="bg-emerald-600 text-white border border-emerald-700 px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black font-mono uppercase tracking-wider whitespace-nowrap shadow-xs">
                                        JLPT/JFT: {user.japaneseLevel || "Belum Diisi"}
                                      </div>
                                      {user.kecakapanSensei && (
                                        <div className="bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-bold font-sans tracking-wider whitespace-nowrap shadow-xs">
                                          Kecakapan: {user.kecakapanSensei}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Actions (Only Admin or VVIP can action) */}
                            {(currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa" || currentUser.role === "VVIP") && (
                              <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
                                {user.role === "Pengajar" && (
                                  <button
                                    onClick={() => setSelectedSenseiForDocCheck(user)}
                                    className="flex-1 sm:flex-none p-1.5 sm:p-2 sm:px-3 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg sm:rounded-xl border border-emerald-100 hover:border-emerald-600 transition flex items-center justify-center gap-1.5 font-black text-[9px] sm:text-[10px] shadow-xs whitespace-nowrap"
                                    title="Periksa Dokumen Sensei"
                                  >
                                    <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    <span>Berkas</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => startEditUser(user)}
                                  className="flex-1 sm:flex-none p-1.5 sm:p-2 sm:px-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg sm:rounded-xl border border-indigo-100 hover:border-indigo-600 transition flex items-center justify-center gap-1.5 font-black text-[9px] sm:text-[10px] shadow-xs whitespace-nowrap"
                                  title="Edit Akun"
                                >
                                  <Edit2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  <span>Kelola</span>
                                </button>
                                <ConfirmButton
                                  confirmTitle="Hapus Akun Pengguna"
                                  confirmMessage={`Yakin ingin menghapus permanen akses @${user.username}?`}
                                  onConfirmClick={() => handleDeleteUser(user.username)}
                                  disabled={isMe}
                                  className={`flex-1 sm:flex-none p-1.5 sm:p-2 sm:px-3 rounded-lg sm:rounded-xl border transition flex items-center justify-center gap-1.5 font-black text-[9px] sm:text-[10px] shadow-xs whitespace-nowrap ${
                                    isMe
                                      ? "bg-slate-50 border-slate-100 text-slate-200 cursor-not-allowed opacity-50"
                                      : "bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border-rose-100 hover:border-rose-600"
                                  }`}
                                  title={isMe ? "Keamanan Sistem: Tidak bisa menghapus diri sendiri" : "Hapus Akun"}
                                >
                                  <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  <span>Hapus</span>
                                </ConfirmButton>
                              </div>
                            )}
                          </div>

                          {/* Indikator Status Akun & Diferensiasi Sumber Data */}
                          {(() => {
                            const hasNoEmail = !user.email || user.email.trim() === "" || user.email.includes("no-email") || user.email.includes("dummy") || user.email.includes("placeholder");
                            const hasNoPassword = !user.hasPassword;
                            const isProfileInput = hasNoEmail || hasNoPassword || user.username.startsWith("temp_") || user.username.startsWith("placeholder_") || (user.role === "Alumni" && hasNoEmail);
                            
                            return (
                              <div className="w-full mt-1 space-y-1.5 border-t border-slate-100/60 pt-2.5 animate-fade-in">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {/* Status Aktivasi Login */}
                                  {hasNoEmail || hasNoPassword ? (
                                    <div className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wider whitespace-nowrap shadow-3xs flex items-center gap-1 animate-pulse">
                                      <span>⚠️ Belum Aktivasi Login</span>
                                    </div>
                                  ) : (
                                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wider whitespace-nowrap shadow-3xs flex items-center gap-1">
                                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                                      <span>🟢 Login Aktif</span>
                                    </div>
                                  )}
                                  {/* Diferensiasi Sumber Data */}
                                  {isProfileInput ? (
                                    <div className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wider whitespace-nowrap shadow-3xs">
                                      📂 Input Admin
                                    </div>
                                  ) : (
                                    <div className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wider whitespace-nowrap shadow-3xs">
                                      📝 Registrasi Mandiri
                                    </div>
                                  )}
                                  {/* Indikator Spesifik Data Administrator yang belum lengkap */}
                                  {(user.role === "Admin" || user.role === "Admin Super" || user.role === "Admin Biasa" || user.role === "VVIP") && (hasNoEmail || hasNoPassword) && (
                                    <div className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider whitespace-nowrap shadow-3xs animate-bounce">
                                      🚨 Data Belum Lengkap
                                    </div>
                                  )}
                                </div>
                                {/* Informasi Tambahan Pencegah Kebingungan */}
                                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2 text-[9px] leading-relaxed text-slate-600 font-medium space-y-1 shadow-3xs">
                                  {hasNoEmail && (
                                    <p className="text-amber-700 font-bold">
                                      ❌ Email belum valid (Tidak bisa login).
                                    </p>
                                  )}
                                  {hasNoPassword && (
                                    <p className="text-amber-700 font-bold">
                                      ❌ Sandi login belum diatur.
                                    </p>
                                  )}
                                  {!hasNoEmail && !hasNoPassword && (
                                    <p className="text-slate-600">
                                      ✔️ Email & sandi telah aktif. {isProfileInput ? "Diinput oleh admin." : "Didaftarkan secara online."}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Pagination Controls */}
              {totalUserPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Halaman {userPage} dari {totalUserPages}
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setUserPage(Math.max(1, userPage - 1))}
                      disabled={userPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setUserPage(Math.min(totalUserPages, userPage + 1))}
                      disabled={userPage === totalUserPages}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Form Tambah Account Baru */}
            <div className={`lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm ${manajemenSubTab === "registrasi" ? "block" : "hidden lg:block"}`}>
              <div className="space-y-0.5">
                <h3 className="font-display font-black text-slate-900 text-sm tracking-tight uppercase">
                  Registrasi Akun Baru
                </h3>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  Mendaftarkan hak autentikasi khusus bagi siswa baru, pengajar
                  (sensei), ataupun direktur (vvip).
                </p>
              </div>

              {isAdminMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-[11px] font-bold flex gap-2 animate-fade-in">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>{isAdminMessage}</span>
                </div>
              )}

              {isErrorAdd && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl text-[11px] flex gap-2 animate-fade-in">
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  <span>{isErrorAdd}</span>
                </div>
              )}

              <ConfirmForm
                confirmTitle="Registrasi Akun Baru"
                confirmMessage="Apakah Anda yakin ingin mendaftarkan akun baru ini?"
                onSubmit={handleAddUser}
                className="space-y-3.5 text-xs"
              >
                <div className="grid sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">
                      Nama Akun (Username Unik)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="cth: budi_sensei (tanpa spasi)"
                      value={newUsername}
                      onChange={(e) =>
                        setNewUsername(e.target.value.replace(/\s+/g, ""))
                      }
                      className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-hidden focus:border-blue-500 transition font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">
                      Foto Profil (Opsional)
                    </label>
                    <div className="flex items-center gap-3">
                      {newProfilePicture ? (
                        <img
                          src={newProfilePicture}
                          className="h-10 w-10 rounded-xl object-cover border border-slate-200"
                          alt="Preview"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                      <label className={`flex-1 bg-slate-50 border border-slate-200 hover:bg-white text-slate-600 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-2 ${uploadingAvatar ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploadingAvatar ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="h-3.5 w-3.5" /> Upload Foto
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingAvatar}
                          onChange={(e) =>
                            handleFileUpload(e, setNewProfilePicture)
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Nama Lengkap Pengguna
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="cth: Ahmad Fauzi, S.Pd"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-hidden focus:border-blue-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Alamat E-mail Resmi
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="cth: fauzi@lpksc.id"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-hidden focus:border-blue-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Kata Sandi Akun (Password)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Masukkan kata sandi (Kosongkan untuk default: adminadmin)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 pl-3.5 pr-10 py-2.5 outline-hidden focus:border-blue-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">
                      Level Hak Akses / Otoritas
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      disabled={currentUser.role !== "VVIP"}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-zinc-50 px-3 py-2.5 outline-hidden cursor-pointer focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                      {currentUser.role === "VVIP" ? (
                        <>
                          <option value="Siswa">Siswa</option>
                          <option value="Pengajar">SENSEI / STAF</option>
                          <option value="Admin Super">ADMIN SUPER</option>
                          <option value="Admin Biasa">ADMIN BIASA</option>
                          <option value="VVIP">VVIP / DIREKSI</option>
                        </>
                      ) : (
                        <option value="Siswa">Siswa</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">
                      Nomor ID
                    </label>
                    <input
                      type="text"
                      disabled={newRole !== "Siswa" && newRole !== "Alumni"}
                      placeholder="cth: SIS-016"
                      value={newStudentId}
                      onChange={(e) => setNewStudentId(e.target.value)}
                      className={`w-full text-xs rounded-xl border px-3.5 py-2.5 outline-hidden transition ${
                        newRole !== "Siswa" && newRole !== "Alumni"
                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                          : "bg-slate-50/50 border-slate-200 focus:border-blue-500 font-mono"
                      }`}
                    />
                  </div>
                </div>

                {newRole === "Pengajar" && (
                  <div className="space-y-3 text-left mb-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block text-xs">
                        Level Bahasa Jepang (JLPT/JFT)
                      </label>
                      <input
                        type="text"
                        placeholder="cth: N3, N2, dll"
                        value={newJapaneseLevel}
                        onChange={(e) => setNewJapaneseLevel(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-hidden focus:border-blue-500 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block text-xs">
                        Keterangan Kecakapan Khusus / Sertifikasi / Pengalaman
                      </label>
                      <textarea
                        placeholder="cth: Menguasai tata bahasa dasar, sertifikat mengajar pedagogi, dll"
                        value={newKecakapanSensei}
                        onChange={(e) => setNewKecakapanSensei(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-hidden focus:border-blue-500 transition"
                        rows={2}
                      />
                    </div>
                  </div>
                )}
                {(newRole === "Siswa" || newRole === "Pengajar" || newRole === "Alumni") && (
                  <div className="space-y-1 text-left">
                    <label className="font-semibold text-slate-700 block">
                      Plotting Kelas / Batch & Kelas (E-Benkyou) 🌐
                    </label>
                    <select
                      value={newAssignedClass}
                      onChange={(e) => setNewAssignedClass(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-zinc-50 px-3.5 py-2.5 outline-hidden cursor-pointer focus:border-blue-500 text-blue-600 font-extrabold"
                    >
                      <option value="">Belum ada kelas</option>
                                <optgroup label="Kelas E-Benkyou">
                                  {systemState.customization?.lmsClasses && systemState.customization.lmsClasses.length > 0 ? (
                                    systemState.customization.lmsClasses.map(cls => (
                                      <option key={cls.id} value={cls.name}>{cls.name}</option>
                                    ))
                                  ) : (
                                    <option value="" disabled>Belum ada data kelas</option>
                                  )}
                                </optgroup>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    currentUser.role !== "Admin" &&
                    currentUser.role !== "Admin Super" &&
                    currentUser.role !== "Admin Biasa" &&
                    currentUser.role !== "VVIP"
                  }
                  className={`w-full py-2.5 rounded-xl font-bold uppercase tracking-wider text-white shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    (currentUser.role !== "Admin" &&
                     currentUser.role !== "Admin Super" &&
                     currentUser.role !== "Admin Biasa" &&
                     currentUser.role !== "VVIP")
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-indigo-700 hover:bg-indigo-900"
                  }`}
                >
                  <Plus className="h-4 w-4 text-yellow-400" />
                  <span>Simpan Akun Baru</span>
                </button>
              </ConfirmForm>
            </div>
          </div>
          </div>
        ) : activeTab === "cv" && (currentUser.role === "Siswa" || currentUser.role === "Alumni") ? (
          (() => {
            const activeStudent = systemState.activeStudents?.find(
              (s) => s.id === currentUser.studentId || s.name === currentUser.name
            );
            if (!activeStudent) {
              return (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500">
                  Data siswa tidak ditemukan. Silakan hubungi admin.
                </div>
              );
            }
            return (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                <StudentCvView
                  student={activeStudent}
                  onUpdateStudent={async (payload) => {
                    return await onUpdateState("activeStudents", "update", payload);
                  }}
                  lpkName={systemState.customization?.logoText || "LPK Source Course"}
                />
              </div>
            );
          })()
        ) : activeTab === "doc_sensei" && currentUser.role === "Pengajar" ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 space-y-6 shadow-sm">
            <div>
              <h3 className="font-display font-black text-slate-900 text-sm tracking-tight uppercase flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                Unggah Dokumen & Sertifikasi Sensei
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Kelola berkas administrasi dan kompetensi keahlian Anda di bawah ini. Berkas Anda akan diverifikasi oleh manajemen LPK SCI.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: "Curriculum Vitae (CV) Sensei", field: "docCV" as const, desc: "CV terbaru berisi riwayat hidup dan pengalaman mengajar." },
                { label: "Ijazah Terakhir", field: "docIjazah" as const, desc: "Ijazah pendidikan formal terakhir atau transkrip nilai." },
                { label: "Sertifikat JLPT / JFT / NAT / Mengajar", field: "docSertifikat" as const, desc: "Bukti kompetensi bahasa Jepang (N5 - N1) atau sertifikat pedagogi." },
                { label: "KTP / Kartu Identitas Pribadi", field: "docKTP" as const, desc: "KTP atau identitas diri resmi untuk validitas data staf." },
              ].map((doc) => {
                const currentVal = currentUser[doc.field] || "";
                return (
                  <div key={doc.field} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col justify-between space-y-4 hover:border-indigo-150 transition">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-wider">
                        {doc.label}
                      </span>
                      <p className="text-[10.5px] text-slate-500 leading-normal">
                        {doc.desc}
                      </p>
                      <div className="pt-2">
                        {currentVal ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-xl font-bold">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span>Sudah Diunggah & Tersimpan</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50/50 border border-amber-100 px-2.5 py-1.5 rounded-xl font-medium">
                            <span>Belum Ada Berkas</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <label className="flex-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 px-3 py-2 rounded-xl text-xs font-black transition text-center flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer">
                        <Upload className="h-4 w-4 text-slate-500" />
                        <span>{currentVal ? "Ganti File" : "Pilih File"}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const url = await uploadFileToFirebase(file, "sensei_docs");
                              const success = await onUpdateState("users", "edit", {
                                ...currentUser,
                                [doc.field]: `${file.name}|${url}`
                              });
                              if (success && onLoginSuccess) {
                                onLoginSuccess({
                                  ...currentUser,
                                  [doc.field]: `${file.name}|${url}`
                                });
                              }
                            } catch (err) {
                              alert("Gagal mengunggah berkas");
                            }
                          }}
                        />
                      </label>

                      {currentVal && (
                        <button
                          type="button"
                          onClick={() => {
                            setViewingDoc({
                              title: doc.label,
                              url: currentVal.includes("|") ? currentVal.split("|")[1] : currentVal,
                            });
                          }}
                          className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-xl text-xs font-black transition text-center flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Lihat</span>
                        </button>
                      )}

                      {currentVal && (
                        <button
                          type="button"
                          onClick={async () => {
                            const success = await onUpdateState("users", "edit", {
                              ...currentUser,
                              [doc.field]: ""
                            });
                            if (success && onLoginSuccess) {
                              onLoginSuccess({
                                ...currentUser,
                                [doc.field]: ""
                              });
                            }
                          }}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-150 transition cursor-pointer"
                          title="Hapus Dokumen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="font-bold text-slate-800 text-sm">
                {viewingDoc.title}
              </h4>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="p-1.5 hover:bg-slate-200 rounded-full transition text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 bg-slate-900 flex flex-col items-center justify-center min-h-[50vh] max-h-[70vh] overflow-y-auto gap-4">
              {!viewingDoc.url || (!viewingDoc.url.startsWith('http') && !viewingDoc.url.startsWith('data:')) ? (
                <div className="text-center p-8 bg-slate-800 rounded-2xl border border-slate-700 max-w-sm">
                  <div className="text-amber-500 text-3xl mb-2">⚠️</div>
                  <p className="text-sm font-bold text-slate-200">Berkas tidak tersedia</p>
                  <p className="text-xs text-slate-400 mt-1">Anda belum mengunggah dokumen ini.</p>
                </div>
              ) : viewingDoc.url.includes("application/pdf") || viewingDoc.url.toLowerCase().includes(".pdf") ? (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-center max-w-md w-full">
                    <p className="text-xs text-slate-300 font-bold mb-3">
                      Dokumen ini adalah format PDF.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <a
                        href={viewingDoc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Buka PDF di Tab Baru</span>
                      </a>
                      <a
                        href={viewingDoc.url}
                        download={`${viewingDoc.title}.pdf`}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Unduh PDF</span>
                      </a>
                    </div>
                  </div>
                  <object
                    data={getEmbeddablePdfUrl(viewingDoc.url)}
                    type="application/pdf"
                    className="w-full h-[45vh] bg-white rounded-lg shadow-md border border-slate-200"
                  >
                    <iframe
                      src={getEmbeddablePdfUrl(viewingDoc.url)}
                      title="PDF Viewer"
                      className="w-full h-full bg-white rounded-lg border-0"
                    />
                  </object>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="flex flex-wrap gap-3 justify-center items-center w-full">
                    <a
                      href={viewingDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Buka Gambar di Tab Baru</span>
                    </a>
                    <a
                      href={viewingDoc.url}
                      download={`${viewingDoc.title}.jpg`}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Unduh Gambar</span>
                    </a>
                  </div>
                  <div className="w-full overflow-auto flex items-center justify-center p-4 bg-slate-950/40 rounded-2xl border border-slate-800 max-h-[50vh]">
                    <img
                      src={viewingDoc.url}
                      alt="Dokumen"
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-[40vh] object-contain rounded-lg shadow-md"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedSenseiForDocCheck && createPortal(
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 overflow-y-auto bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg">
                    <FileText className="h-4 w-4" />
                  </span>
                  Pemeriksaan Berkas & Sertifikasi Sensei
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-1 ml-9">
                  Staf Pengajar: {selectedSenseiForDocCheck.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedSenseiForDocCheck(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600"
              >
                <span className="text-xl font-bold">×</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5">
              
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl flex items-center gap-4">
                 <div className="h-16 w-16 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs flex-shrink-0">
                    {selectedSenseiForDocCheck.profilePicture ? (
                      <img src={getSafePhotoUrl(selectedSenseiForDocCheck.profilePicture, selectedSenseiForDocCheck.name)} className="h-full w-full object-cover" alt="Profile" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-3xl">👤</div>
                    )}
                 </div>
                 <div>
                   <h4 className="font-black text-slate-900 text-lg">{selectedSenseiForDocCheck.name}</h4>
                   <p className="text-xs font-bold text-slate-500">{selectedSenseiForDocCheck.role}</p>
                   <div className="flex flex-wrap gap-2 mt-1.5">
                     <p className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100 font-bold">
                       Kecakapan: {selectedSenseiForDocCheck.japaneseLevel || "N3-N2"}
                     </p>
                     <p className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg border border-indigo-100 font-bold">
                       Kelas: {selectedSenseiForDocCheck.assignedClass || "Belum ada kelas"}
                     </p>
                   </div>
                 </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <h4 className="font-black text-slate-800 text-sm border-b pb-2">Daftar Dokumen Pendukung</h4>
                
                <div className="space-y-3">
                  {[
                    { label: "Curriculum Vitae (CV)", field: "docCV" as const },
                    { label: "Ijazah Terakhir", field: "docIjazah" as const },
                    { label: "Sertifikat JLPT / JFT / NAT", field: "docSertifikat" as const },
                    { label: "KTP / Identitas Pribadi", field: "docKTP" as const },
                  ].map((doc) => {
                    const docUrl = selectedSenseiForDocCheck[doc.field];
                    return (
                      <div key={doc.field} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-white transition">
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{doc.label}</p>
                          <p className="text-[10px] text-slate-500">{docUrl ? "Sudah Diunggah" : "Belum Diunggah"}</p>
                        </div>
                        {docUrl ? (
                          <button
                            onClick={() => {
                              setViewingDoc({
                                title: doc.label,
                                url: docUrl.includes("|") ? docUrl.split("|")[1] : docUrl,
                              });
                            }}
                            className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer"
                          >
                            Periksa Dokumen
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">Tidak Tersedia</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setSelectedSenseiForDocCheck(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Selesai Periksa
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
