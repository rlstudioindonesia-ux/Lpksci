const fs = require('fs');
let code = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

const target = `                  </button>
                </ConfirmForm>
            </div>
          </div>
        )}
        {activeSegment === "kustomisasi"`;

const replacement = `                  </button>
                </ConfirmForm>
              </div>
            </div>
          </div>
        )}
        {activeSegment === "kustomisasi"`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/AdminView.tsx', code);
    console.log("Fixed missing div.");
} else {
    console.log("Could not find target.");
}
