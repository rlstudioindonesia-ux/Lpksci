const fs = require('fs');
let code = fs.readFileSync('src/components/AccountSettingsView.tsx', 'utf-8');

const filterCode = `  const filteredUsers = (systemState.users || [])
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

  return (`;

code = code.replace('  return (', filterCode);

fs.writeFileSync('src/components/AccountSettingsView.tsx', code);
