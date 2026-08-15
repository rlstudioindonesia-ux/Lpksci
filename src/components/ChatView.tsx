import React, { useState, useEffect, useRef } from "react";
import { UserAccount, SystemState, ChatMessage } from "../types";
import { ArrowLeft, SendHorizontal, User, Search, Paperclip, File, Loader2, Users, Download, CheckCircle2, MessageSquare, Trash2, Check, CheckCheck } from "lucide-react";
import { uploadFileToFirebase, getSafePhotoUrl, createSvgAvatar } from "../lib/storageHelper";
import { getLocalMedia, downloadAndSaveMedia } from "../lib/localMedia";
import { ConfirmButton } from "./ConfirmButton";

interface ChatViewProps {
  currentUser: UserAccount;
  systemState: SystemState;
  onUpdateState: (dataType: string, action: string, payload: any) => Promise<boolean>;
  onClose: () => void;
}

function openMediaSafe(url: string) {
  if (!url) return;
  if (url.startsWith("data:")) {
    try {
      const arr = url.split(",");
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
      return;
    } catch (e) {
      console.warn("Blob conversion failed:", e);
    }
  }
  window.open(url, "_blank");
}

export default function ChatView({ currentUser, systemState, onUpdateState, onClose }: ChatViewProps) {
  const [activeChatUser, setActiveChatUser] = useState<UserAccount | (UserAccount & { isGroup?: boolean }) | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"recent" | "personal" | "groups">("recent");
  const [localMediaMap, setLocalMediaMap] = useState<Record<string, string>>({});
  const [viewportHeight, setViewportHeight] = useState("100%");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestedMarkReadIdsRef = useRef<Set<string>>(new Set());

  const myChatId = (currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa") ? "admin_shared" : currentUser.username;
  const myChatName = (currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa") ? "Admin LPK SCI" : currentUser.name;

  const [isMobileScreen, setIsMobileScreen] = useState(false);

  // Handle mobile keyboard and viewport resizing
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        setViewportHeight(`${window.visualViewport.height}px`);
      }
      setIsMobileScreen(window.innerWidth < 768);
    };
    
    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Pre-load local media URLs
  useEffect(() => {
    const loadLocalMedia = async () => {
      if (!systemState.messages) return;
      const newMap = { ...localMediaMap };
      let changed = false;
      
      for (const msg of systemState.messages) {
        if (msg.fileUrl && !newMap[msg.fileUrl]) {
          const local = await getLocalMedia(msg.fileUrl);
          if (local) {
            newMap[msg.fileUrl] = URL.createObjectURL(local.blob);
            changed = true;
          }
        }
      }
      
      if (changed) setLocalMediaMap(newMap);
    };
    loadLocalMedia();
  }, [systemState.messages]);

  const handleSaveToDevice = async (url: string, fileName: string) => {
    const localUrl = await downloadAndSaveMedia(url, fileName);
    if (localUrl) {
      setLocalMediaMap(prev => ({ ...prev, [url]: localUrl }));
    }
  };

  const activeIsGroup = activeChatUser ? ("isGroup" in activeChatUser && activeChatUser.isGroup) : false;
  const activeChatMessagesCount = (systemState.messages || []).filter(m => {
    if (!activeChatUser) return false;
    if (activeIsGroup) return m.receiverId === activeChatUser.username;
    return (m.senderId === myChatId && m.receiverId === activeChatUser.username) ||
           (m.senderId === activeChatUser.username && m.receiverId === myChatId);
  }).length;

  // Mark unread messages as read
  useEffect(() => {
    if (activeChatUser && !activeIsGroup && systemState.messages) {
      const unreadMsgs = systemState.messages.filter(
        m => m.senderId === activeChatUser.username && m.receiverId === myChatId && !m.isRead
      );
      
      const newUnreadMsgs = unreadMsgs.filter(m => !requestedMarkReadIdsRef.current.has(m.id));
      
      if (newUnreadMsgs.length > 0) {
        // Track these IDs as already requested
        newUnreadMsgs.forEach(m => requestedMarkReadIdsRef.current.add(m.id));
        
        onUpdateState?.("messages", "mark_read_all", { 
          senderId: activeChatUser.username, 
          receiverId: myChatId 
        });
      }
    }
  }, [systemState.messages, activeChatUser, myChatId, activeIsGroup]);

  // Auto-scroll to bottom of chat only when entering or when a message is added to the active conversation
  useEffect(() => {
    if (activeChatUser) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [activeChatUser, activeChatMessagesCount]);

  const handleSendMessage = async (fileUrl?: string, fileType?: any, fileName?: string) => {
    if ((!newMessage.trim() && !fileUrl) || !activeChatUser) return;
    
    await onUpdateState("messages", "send", {
      senderId: myChatId,
      senderName: myChatName,
      senderRole: currentUser.role,
      receiverId: activeChatUser.username,
      text: newMessage.trim(),
      fileUrl,
      fileType,
      fileName,
      timestamp: new Date().toISOString(),
      isRead: false
    });
    
    setNewMessage("");
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!onUpdateState) return;
    await onUpdateState("messages", "delete", { id: msgId });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFileToFirebase(file, "chat_attachments");
      let fileType: "image" | "document" | "video" | "other" = "other";
      if (file.type.startsWith("image/")) fileType = "image";
      else if (file.type.startsWith("video/")) fileType = "video";
      else if (file.type.includes("pdf") || file.type.includes("doc") || file.type.includes("xls")) fileType = "document";
      
      // Send the file message directly
      await onUpdateState("messages", "send", {
        senderId: myChatId,
        senderName: myChatName,
        senderRole: currentUser.role,
        receiverId: activeChatUser!.username,
        text: `Mengirim file: ${file.name}`,
        fileUrl: url,
        fileType,
        fileName: file.name,
        timestamp: new Date().toISOString(),
        isRead: false
      });
    } catch (err) {
      console.error(err);
      alert("Gagal mengunggah file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };


  // Filter who the current user can chat with
  const personalContacts = (systemState.users || []).reduce((acc: UserAccount[], u) => {
    if (u.username === currentUser.username) return acc;
    
    if (currentUser.role === "Siswa") {
      if (u.role === "Pengajar") acc.push(u);
    } else if (currentUser.role === "Pengajar") {
      if (u.role === "Siswa" || u.role === "VVIP") acc.push(u);
    } else if (currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa") {
      if (u.role !== "Admin" && u.role !== "Admin Super" && u.role !== "Admin Biasa") acc.push(u);
    } else if (currentUser.role === "VVIP") {
      if (u.role !== "Admin" && u.role !== "Admin Super" && u.role !== "Admin Biasa" && u.role !== "VVIP") acc.push(u);
    }
    return acc;
  }, []);

  // Add the shared Admin persona to non-Admin users
  if (currentUser.role !== "Admin" && currentUser.role !== "Admin Super" && currentUser.role !== "Admin Biasa") {
    personalContacts.push({
      username: "admin_shared",
      name: "Admin LPK SCI",
      email: "admin@lpksci.com",
      role: "Admin"
    });
  }

  // Group Contacts (Classes)
  const groupContacts: any[] = [];
  const rawClasses = [...(systemState.lmsClasses || []), ...(systemState.customization?.lmsClasses || [])];
  
  // Deduplicate classes by trimmed name
  const seenClassKeys = new Set<string>();
  const classes = rawClasses.filter(c => {
    if (!c) return false;
    const nameKey = (c.name || c.id || "").trim().toLowerCase();
    if (!nameKey || seenClassKeys.has(nameKey)) return false;
    seenClassKeys.add(nameKey);
    return true;
  });
  
  classes.forEach(cls => {
    // A user can see a class group if they are an Admin, VVIP, or belong to that class
    const canSee = (currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa" || currentUser.role === "VVIP" || currentUser.role === "Pengajar" || currentUser.assignedClass === cls.name);
    
    if (canSee) {
      const groupName = `Kelas: ${cls.name}`;
      if (!groupContacts.find(g => g.name === groupName)) {
        groupContacts.push({
          username: `GROUP_${cls.name}`,
          name: groupName,
          role: "Grup Kelas",
          isGroup: true,
          profilePicture: createSvgAvatar(groupName, "#2563eb")
        });
      }
    }
  });

  const getLatestMessageTime = (contactUsername: string, isGroup: boolean) => {
    if (!systemState.messages) return 0;
    
    let latestMsg = 0;
    if (isGroup) {
      const msgs = systemState.messages.filter((m: any) => m.receiverId === contactUsername);
      for (const m of msgs) {
        const time = new Date(m.timestamp).getTime();
        if (time > latestMsg) latestMsg = time;
      }
    } else {
      const msgs = systemState.messages.filter((m: any) => 
        (m.senderId === contactUsername && m.receiverId === myChatId) ||
        (m.senderId === myChatId && m.receiverId === contactUsername)
      );
      for (const m of msgs) {
        const time = new Date(m.timestamp).getTime();
        if (time > latestMsg) latestMsg = time;
      }
    }
    return latestMsg;
  };

  const totalUnreadCount = (systemState.messages || []).filter(m => m.receiverId === myChatId && !m.isRead).length;

  const getBaseContacts = () => {
    if (selectedTab === "personal") return personalContacts;
    if (selectedTab === "groups") return groupContacts;
    
    // "recent": Combined personal and group contacts that have message history or unread messages
    const combined = [...personalContacts, ...groupContacts];
    return combined.filter(c => {
      const isGrp = "isGroup" in c && c.isGroup;
      const lastTime = getLatestMessageTime(c.username, isGrp);
      const unreads = isGrp ? 0 : (systemState.messages?.filter(m => m.senderId === c.username && m.receiverId === myChatId && !m.isRead).length || 0);
      return lastTime > 0 || unreads > 0;
    });
  };

  const filteredContacts = getBaseContacts()
    .filter(c => 
      (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.username || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const timeA = getLatestMessageTime(a.username, "isGroup" in a ? a.isGroup : false);
      const timeB = getLatestMessageTime(b.username, "isGroup" in b ? b.isGroup : false);
      return timeB - timeA;
    });

  return (
    <div 
      className="flex flex-col bg-slate-50 relative overflow-hidden w-full" 
      style={{ height: (activeChatUser && isMobileScreen) ? viewportHeight : "100%" }}
    >
      {!activeChatUser ? (
        // LIST OF CONTACTS
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="p-4 space-y-3 sm:space-y-4">
            <div className="bg-gradient-to-r from-indigo-700 to-[#001d3d] text-white p-4 rounded-2xl shadow-md">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm uppercase tracking-tight">Pusat Komunikasi LPK</h3>
                <Users className="h-4 w-4 text-yellow-400" />
              </div>
              <p className="text-[10px] text-slate-300 mt-1 opacity-90 leading-relaxed">
                Pilih kontak atau grup kelas untuk memulai percakapan.
              </p>
            </div>

            {/* SEARCH BAR */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama atau username..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 transition shadow-xs"
              />
            </div>

            {/* TABS */}
            <div className="flex p-1 bg-slate-200/60 rounded-xl gap-1">
              <button 
                type="button"
                onClick={() => setSelectedTab("recent")}
                className={`flex-1 py-1.5 px-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedTab === "recent" 
                    ? "bg-indigo-600 text-white shadow-xs" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-300/40"
                }`}
              >
                <MessageSquare className="h-3 w-3" />
                <span>Chat Terbaru</span>
                {totalUnreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full animate-pulse">
                    {totalUnreadCount}
                  </span>
                )}
              </button>
              <button 
                type="button"
                onClick={() => setSelectedTab("personal")}
                className={`flex-1 py-1.5 px-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                  selectedTab === "personal" 
                    ? "bg-white text-blue-700 shadow-xs" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-300/40"
                }`}
              >
                <span>Kontak</span>
              </button>
              <button 
                type="button"
                onClick={() => setSelectedTab("groups")}
                className={`flex-1 py-1.5 px-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                  selectedTab === "groups" 
                    ? "bg-white text-blue-700 shadow-xs" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-300/40"
                }`}
              >
                <span>Grup Kelas</span>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-2 flex items-center justify-between">
              <span>
                {selectedTab === "recent" ? "⚡ Chat & Pesan Terbaru" : selectedTab === "personal" ? "👤 Daftar Kontak Personal" : "👥 Daftar Grup Kelas"} ({filteredContacts.length})
              </span>
            </h4>

            {selectedTab === "recent" && filteredContacts.length === 0 && (
              <div className="p-6 text-center bg-white border border-slate-200/80 rounded-2xl my-2 shadow-2xs">
                <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">Belum Ada Percakapan Terbaru</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Pesan atau chat baru yang masuk akan otomatis tampil di tab <b>Chat Terbaru</b> ini. Silakan pilih tab <b>Kontak</b> atau <b>Grup Kelas</b> untuk memulai obrolan.
                </p>
              </div>
            )}
            
            {filteredContacts.map((contact, index) => {
              // Count unread messages from this contact
              const isGroup = "isGroup" in contact && contact.isGroup;
              const unreadCount = isGroup ? 0 : (systemState.messages?.filter(m => m.senderId === contact.username && m.receiverId === myChatId && !m.isRead).length || 0);
              
              // Get latest message text
              let latestMessageText = "";
              let latestMessageTimeStr = "";
              if (systemState.messages) {
                let latestMsgObj = null;
                if (isGroup) {
                  const msgs = systemState.messages.filter(m => m.receiverId === contact.username);
                  if (msgs.length > 0) latestMsgObj = msgs.reduce((prev, current) => (new Date(prev.timestamp).getTime() > new Date(current.timestamp).getTime()) ? prev : current);
                } else {
                  const msgs = systemState.messages.filter(m => 
                    (m.senderId === contact.username && m.receiverId === myChatId) ||
                    (m.senderId === myChatId && m.receiverId === contact.username)
                  );
                  if (msgs.length > 0) latestMsgObj = msgs.reduce((prev, current) => (new Date(prev.timestamp).getTime() > new Date(current.timestamp).getTime()) ? prev : current);
                }
                
                if (latestMsgObj) {
                  latestMessageText = latestMsgObj.text || "";
                  if (!latestMessageText && latestMsgObj.fileUrl) latestMessageText = "📷 Mengirim lampiran";
                  const dateObj = new Date(latestMsgObj.timestamp);
                  latestMessageTimeStr = dateObj.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
                }
              }
              
              const hasHistory = !!(latestMessageText || latestMessageTimeStr);

              return (
                <div
                  key={contact.username}
                  onClick={() => {
                    setActiveChatUser(contact);
                    if (!isGroup && systemState.messages) {
                      const hasUnread = systemState.messages.some(m => m.senderId === contact.username && m.receiverId === myChatId && !m.isRead);
                      if (hasUnread) {
                        onUpdateState?.("messages", "mark_read_all", { senderId: contact.username, receiverId: myChatId });
                      }
                    }
                  }}
                  className={`group/row p-3 rounded-xl flex items-center justify-between cursor-pointer transition drop-shadow-xs border ${unreadCount > 0 ? 'bg-indigo-100 border-indigo-300 hover:bg-indigo-200 shadow-indigo-100/50' : index === 0 && (latestMessageText || latestMessageTimeStr) ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 shadow-emerald-100/50' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                    <img
                      src={getSafePhotoUrl(contact.profilePicture, contact.name)}
                      className="h-10 w-10 rounded-lg object-cover border border-slate-200 shrink-0"
                      alt={contact.name || "Avatar"}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = createSvgAvatar(contact.name || 'User');
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-xs text-slate-900 truncate" title={contact.name}>{contact.name}</div>
                      <div className="text-[10px] text-slate-500 font-medium truncate">
                        {latestMessageText || (contact.isGroup ? `${((systemState.users || []).filter(u => u.assignedClass === (contact.name || "").replace("Kelas: ", "")).length)} Anggota` : `@${contact.username}`)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {latestMessageTimeStr && (
                      <span className="text-[9px] text-slate-400 font-medium">{latestMessageTimeStr}</span>
                    )}
                    <span className={`text-[8.5px] px-2 py-0.5 rounded-md font-bold uppercase ${
                      (contact.role === "Admin" || contact.role === "Admin Super" || contact.role === "Admin Biasa") ? "bg-amber-100 text-amber-700" :
                      contact.role === "VVIP" ? "bg-rose-100 text-rose-700" :
                      contact.role === "Pengajar" ? "bg-indigo-100 text-indigo-700" :
                      contact.role === "Grup Kelas" ? "bg-blue-100 text-blue-700" :
                      "bg-emerald-100 text-emerald-700"
                    }`}>
                      {contact.role}
                    </span>
                    {unreadCount > 0 && (
                      <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {unreadCount}
                      </span>
                    )}
                    {hasHistory && ((currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa") || !isGroup) && (
                      <ConfirmButton
                        confirmTitle="Hapus Chat"
                        confirmMessage={`Hapus seluruh riwayat percakapan dengan ${contact.name}? Pesan yang dihapus tidak dapat dikembalikan.`}
                        onConfirmClick={async () => {
                          await onUpdateState("messages", "clear_chat", {
                            myChatId,
                            otherChatId: contact.username,
                            isGroup,
                          });
                        }}
                        className="opacity-0 group-hover/row:opacity-100 sm:opacity-0 max-sm:opacity-100 p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition cursor-pointer"
                        title="Hapus Chat Ini"
                      >
                        <Trash2 className="h-3 w-3" />
                      </ConfirmButton>
                    )}
                  </div>
                </div>
              );
            })}
            
            {filteredContacts.length === 0 && (
              <div className="text-center p-8 border border-dashed border-slate-300 rounded-2xl bg-white text-slate-400">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">Tidak ada {selectedTab === "personal" ? "kontak" : "grup"} yang ditemukan.</p>
              </div>
            )}
          </div>
          
          {/* Bottom attribution to fill space if needed removed for cleaner layout */}
        </div>
      ) : (
        // ACTIVE CHAT ROOM
        <div className="flex flex-col h-full bg-slate-100 absolute inset-0 z-20 overflow-hidden">
          <div className="bg-indigo-900 text-white p-3 flex items-center justify-between drop-shadow-md z-20 shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveChatUser(null)} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-slate-200 transition"><ArrowLeft className="h-4 w-4" /></button>
              <div className="flex items-center gap-2">
                <img
                  src={getSafePhotoUrl(activeChatUser.profilePicture, activeChatUser.name)}
                  className="h-8 w-8 rounded-md object-cover border border-indigo-700"
                  alt={activeChatUser.name || "Avatar"}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = createSvgAvatar(activeChatUser.name || 'User');
                  }}
                />
                <div>
                  <h4 className="font-bold text-xs text-white leading-none">{activeChatUser.name}</h4>
                  <p className="text-[9px] text-yellow-400/90 font-mono mt-0.5 uppercase tracking-wide">{activeChatUser.role}</p>
                </div>
              </div>
            </div>
            {((currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa") || !("isGroup" in activeChatUser && activeChatUser.isGroup)) && (
              <ConfirmButton 
                confirmTitle="Bersihkan Chat"
                confirmMessage="Apakah Anda yakin ingin membersihkan seluruh pesan di obrolan ini?"
                onConfirmClick={async () => {
                  await onUpdateState("messages", "clear_chat", { 
                    myChatId, 
                    otherChatId: activeChatUser.username, 
                    isGroup: "isGroup" in activeChatUser && activeChatUser.isGroup 
                  });
                }}
                className="p-1.5 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg text-slate-300 transition cursor-pointer"
                title="Bersihkan Chat"
              >
                <Trash2 className="h-4 w-4" />
              </ConfirmButton>
            )}
          </div>
                   <div className="flex-1 overflow-y-auto bg-[#efeae2] flex flex-col relative">
            <div className="p-3 space-y-4 flex flex-col">
              {/* Filter messages */}
              {(() => {
                const activeIsGroup = "isGroup" in activeChatUser && activeChatUser.isGroup;
                const filteredMsgs = systemState.messages?.filter(m => {
                  if (activeIsGroup) return m.receiverId === activeChatUser.username;
                  return (m.senderId === myChatId && m.receiverId === activeChatUser.username) ||
                         (m.senderId === activeChatUser.username && m.receiverId === myChatId);
                }) || [];

                if (filteredMsgs.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 opacity-30 mt-auto">
                      <MessageSquare className="h-10 w-10 mb-2 text-slate-400" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Belum Ada Pesan</p>
                    </div>
                  );
                }

                return filteredMsgs.map((msg) => {
                  const isMe = msg.senderId === myChatId;
                  const dateObj = new Date(msg.timestamp);
                  const timeStr = dateObj.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
                  const localUrl = msg.fileUrl ? localMediaMap[msg.fileUrl] : null;
                  const displayUrl = localUrl || msg.fileUrl;
                  
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1 relative group`}>
                      {activeIsGroup && !isMe && (
                        <span className="text-[8px] font-bold text-slate-400 px-1 uppercase tracking-wider">{msg.senderName} ({msg.senderRole})</span>
                      )}
                      


                      <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-[11px] leading-relaxed shadow-xs ${
                        isMe
                          ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-sm'
                          : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200'
                      }`}>
                      {msg.fileUrl ? (
                        <div className="space-y-1.5">
                          {msg.fileType === "image" ? (
                            <img src={displayUrl} className="max-w-full rounded-lg cursor-pointer border border-slate-200 shadow-sm" alt="attachment" onClick={() => openMediaSafe(displayUrl!)}/>
                          ) : msg.fileType === "video" ? (
                            <div className="relative rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-black/5">
                              <video src={displayUrl} controls className="w-full max-h-[200px]" />
                            </div>
                          ) : (
                            <button
                              onClick={() => openMediaSafe(displayUrl!)}
                              className="flex items-center gap-3 p-3 bg-black/[0.03] hover:bg-black/[0.06] rounded-xl border border-slate-200/60 relative overflow-hidden text-left w-full transition"
                            >
                              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                                <File className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-[10px] font-bold text-slate-700">{msg.fileName || "File"}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase">Ketuk untuk membuka</p>
                              </div>
                            </button>
                          )}
                          {msg.text && msg.text !== `Mengirim file: ${msg.fileName}` && (
                            <p className="px-0.5">{msg.text}</p>
                          )}
                          <button
                            onClick={() => handleSaveToDevice(msg.fileUrl!, msg.fileName || 'file')}
                            className="flex items-center gap-1.5 text-[8.5px] font-bold text-slate-500 hover:text-indigo-700 transition px-0.5"
                            title="Unduh untuk akses offline di perangkat ini"
                          >
                            {localUrl ? <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> : <Download className="h-2.5 w-2.5" />}
                            {localUrl ? "Tersimpan offline" : "Unduh ke perangkat"}
                          </button>
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                    <div className={`flex items-center gap-1.5 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-[8.5px] font-mono text-slate-400">
                        {timeStr}
                      </span>
                      {isMe && (
                        <span className="text-[10px]" title={msg.isRead ? "Dibaca" : "Terkirim"}>
                          {msg.isRead ? <CheckCheck className="h-3 w-3 text-blue-500" /> : <Check className="h-3 w-3 text-slate-400" />}
                        </span>
                      )}
                      {(isMe || currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa") && (
                        <button 
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-0.5 active:scale-95"
                          title="Hapus Pesan"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  );
                });
              })()}
              <div ref={messagesEndRef} />
            </div>
          </div>
    
          <div className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center">
            <div className="relative group">
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition shrink-0"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </button>
              <div className="absolute bottom-full mb-2 left-0 w-48 bg-slate-800 text-white text-[8px] font-bold p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-xl">
                Kirim gambar, video, atau dokumen (PDF/DOC/XLS).
              </div>
            </div>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ketik pesan disini..."
              className="flex-1 text-xs px-4 py-2.5 bg-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 transition border-none placeholder:text-slate-400"
            />
            <button 
              onClick={() => handleSendMessage()}
              disabled={(!newMessage.trim() && !isUploading) || isUploading}
              className="p-2.5 bg-indigo-700 hover:bg-indigo-900 text-white rounded-xl disabled:bg-slate-300 disabled:text-slate-500 transition drop-shadow-sm flex items-center justify-center shrink-0"
            >
              <SendHorizontal className="h-4 w-4 ml-0.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

