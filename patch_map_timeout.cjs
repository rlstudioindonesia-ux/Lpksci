const fs = require('fs');

function fixFile(file) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace setTimeout map invalidateSize
  code = code.replace(
    /setTimeout\(\(\) => \{\s+if \(map\) map\.invalidateSize\(\);\s+\}, 250\);/g,
    'setTimeout(() => { try { if (map && map._container) map.invalidateSize(); } catch (e) {} }, 250);'
  );
  code = code.replace(
    /setTimeout\(\(\) => \{\s+map\.invalidateSize\(\);\s+\}, 250\);/g,
    'setTimeout(() => { try { if (map && map._container) map.invalidateSize(); } catch (e) {} }, 250);'
  );
  
  code = code.replace(
    /setTimeout\(\(\) => \{\s+if \(map\) map\.invalidateSize\(\);\s+\}, 500\);/g,
    'setTimeout(() => { try { if (map && map._container) map.invalidateSize(); } catch (e) {} }, 500);'
  );
  code = code.replace(
    /setTimeout\(\(\) => \{\s+map\.invalidateSize\(\);\s+\}, 500\);/g,
    'setTimeout(() => { try { if (map && map._container) map.invalidateSize(); } catch (e) {} }, 500);'
  );
  
  fs.writeFileSync(file, code);
}

fixFile('src/components/FrontendView.tsx');
fixFile('src/components/AdminView.tsx');
fixFile('src/components/MobileDashboardView.tsx');
