const fs = require('fs');
let code = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

const target = `                        </button>
                      </div>
                    </div>
                  </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-slate-100">`;

const replacement = `                        </button>
                      </div>
                    </div>
                  </div>
              <div className="flex justify-end pt-4 border-t border-slate-100">`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/AdminView.tsx', code);
    console.log("Removed one extra div.");
} else {
    console.log("Not found target 1");
}

let code2 = fs.readFileSync('src/components/AdminView.tsx', 'utf8');
const target2 = `                    {landingSaveSuccess ? "Berhasil Disimpan!" : "Simpan Perubahan"}
                  </button>
                </ConfirmForm>
              </div>
            </div>
          </div>
        )}
        {activeSegment === "kustomisasi"`;

const replacement2 = `                    {landingSaveSuccess ? "Berhasil Disimpan!" : "Simpan Perubahan"}
                  </button>
                </ConfirmForm>
              </div>
            </div>
        )}
        {activeSegment === "kustomisasi"`;

if (code2.includes(target2)) {
    code2 = code2.replace(target2, replacement2);
    fs.writeFileSync('src/components/AdminView.tsx', code2);
    console.log("Removed second extra div.");
} else {
    console.log("Not found target 2");
}

