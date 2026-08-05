sed -i '/{currentUser?.role !== "Alumni" && (/,/                  <\/button>/c\                {(currentUser?.role === "Pengajar" || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") && (\
                  <button\
                    onClick={() => handleCategoryAction("perkembangan")}\
                    className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"\
                  >\
                    <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white relative">\
                      <TrendingUp className="h-5 w-5 drop-shadow-sm" />\
                    </div>\
                    <div className="space-y-1 text-center w-full px-1">\
                      <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">\
                        DATA PROGRESS\
                      </span>\
                      <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">\
                        Progress Belajar\
                      </p>\
                    </div>\
                  </button>\
                )}' src/components/MobileDashboardView.tsx
