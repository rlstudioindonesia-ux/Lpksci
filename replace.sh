sed -i '/{\/\* 3\. PERKEMBANGAN BELAJARKU/,/{\/\* 4\. E-BENKYOU/c\
          {/* 3. DATA PROGRESS SISWA */}\
          {activeSubpage === "perkembangan" && (\
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm">\
              <SenseiDashboardView currentUser={currentUser} systemState={systemState} />\
            </div>\
          )}\
\
          {/* 4. E-BENKYOU' src/components/MobileDashboardView.tsx
