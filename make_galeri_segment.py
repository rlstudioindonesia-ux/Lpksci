import re

with open('src/components/AdminView.tsx', 'r') as f:
    lines = f.readlines()

start = -1
end = -1
for i, line in enumerate(lines):
    if 'activeSegment === "galeri" && (' in line:
        start = i
        break

if start != -1:
    braceCount = 1
    for i in range(start + 1, len(lines)):
        braceCount += lines[i].count('(')
        braceCount -= lines[i].count(')')
        if braceCount == 0:
            end = i
            break

segment = "".join(lines[start+1:end])

# Create AdminGaleriSegment.tsx
component_code = f"""import React from "react";
import {{ Plus, Image as ImageIcon, Trash2, Loader2, ArrowUp, ArrowDown }} from "lucide-react";
import {{ uploadFileToFirebase }} from "../../lib/storageHelper";

interface AdminGaleriSegmentProps {{
  custGallery: any[];
  setCustGallery: React.Dispatch<React.SetStateAction<any[]>>;
  galleryUploadStatus: 'idle' | 'loading' | 'success' | 'error';
  setGalleryUploadStatus: React.Dispatch<React.SetStateAction<'idle' | 'loading' | 'success' | 'error'>>;
  onUpdateState: (dataType: string, action: string, payload: any) => Promise<boolean>;
}}

export default function AdminGaleriSegment({{
  custGallery,
  setCustGallery,
  galleryUploadStatus,
  setGalleryUploadStatus,
  onUpdateState
}}: AdminGaleriSegmentProps) {{
  return (
{segment}
  );
}}
"""

with open('src/components/admin/AdminGaleriSegment.tsx', 'w') as f:
    f.write(component_code)

# Replace in AdminView.tsx
new_lines = lines[:start] + ["        {activeSegment === \"galeri\" && (\n", "          <AdminGaleriSegment\n", "            custGallery={custGallery}\n", "            setCustGallery={setCustGallery}\n", "            galleryUploadStatus={galleryUploadStatus}\n", "            setGalleryUploadStatus={setGalleryUploadStatus}\n", "            onUpdateState={onUpdateState}\n", "          />\n", "        )}\n"] + lines[end+1:]
with open('src/components/AdminView.tsx', 'w') as f:
    f.writelines(new_lines)

# Insert import
for i, line in enumerate(new_lines):
    if 'import AdminKelasSegment' in line:
        new_lines.insert(i + 1, 'import AdminGaleriSegment from "./admin/AdminGaleriSegment";\n')
        break

with open('src/components/AdminView.tsx', 'w') as f:
    f.writelines(new_lines)
