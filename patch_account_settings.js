const fs = require('fs');
const file = 'src/components/AccountSettingsView.tsx';
let content = fs.readFileSync(file, 'utf8');

const hookStr = `
  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setProfilePicture(currentUser.profilePicture || "");
      setMyJapaneseLevel(currentUser.japaneseLevel || "");
      setMyKecakapanSensei(currentUser.kecakapanSensei || "");
    }
  }, [currentUser]);
`;

content = content.replace(
  '  const [uploadingAvatar, setUploadingAvatar] = useState(false);',
  '  const [uploadingAvatar, setUploadingAvatar] = useState(false);\n' + hookStr
);

fs.writeFileSync(file, content);
