const fs = require('fs');
let code = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

const regex = /<\/ConfirmForm>\s*<\/div>\s*<\/div>\s*<\/div>\s*}\)/;
// Let's just find the exact string
const target = `                  </button>
                </ConfirmForm>
            </div>
          </div>
        )}`;

const replacement = `                  </button>
                </ConfirmForm>
              </div>
            </div>
          </div>
        )}`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/AdminView.tsx', code);
    console.log("Fixed missing div.");
} else {
    console.log("Could not find target.");
}
