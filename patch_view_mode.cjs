const fs = require('fs');
let code = fs.readFileSync('src/components/AccountSettingsView.tsx', 'utf-8');

const targetStr = `                      ) : (
                        /* Mode View */
                        <>
                          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 w-full">
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              <div className="relative shrink-0">`;

const replacement = `                      ) : (
                        /* Mode View */
                        <div className="flex flex-col gap-3 w-full">
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 w-full">
                            <div className="flex items-start gap-3.5 min-w-0 flex-1 w-full">
                              <div className="relative shrink-0 mt-1">`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('src/components/AccountSettingsView.tsx', code);
