const fs = require('fs');
let code = fs.readFileSync('src/components/AccountSettingsView.tsx', 'utf-8');

const targetStr = `                {(systemState.users || [])
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
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((user) => {`;

code = code.replace(targetStr, `                {paginatedUsers.map((user) => {`);

fs.writeFileSync('src/components/AccountSettingsView.tsx', code);
