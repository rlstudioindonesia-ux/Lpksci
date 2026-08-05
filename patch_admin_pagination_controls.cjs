const fs = require('fs');
let code = fs.readFileSync('src/components/AdminView.tsx', 'utf-8');

const target = `                  </div>
                )}
              </div>
            </div>
          </div>
        )}`;

const replacement = `                  </div>
                )}
              </div>
              
              {/* Pagination Controls */}
              {siswaTab !== "rekap" && siswaTab !== "sensei" && siswaTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-2xl shadow-sm mt-4">
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-700">
                        Menampilkan <span className="font-medium">{((siswaPage - 1) * siswaItemsPerPage) + 1}</span> hingga <span className="font-medium">{Math.min(siswaPage * siswaItemsPerPage, filteredSiswaItems.length)}</span> dari <span className="font-medium">{filteredSiswaItems.length}</span> hasil
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => setSiswaPage(p => Math.max(1, p - 1))}
                          disabled={siswaPage === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        {Array.from({ length: siswaTotalPages }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setSiswaPage(i + 1)}
                            className={\`relative inline-flex items-center px-4 py-2 text-sm font-semibold \${
                              siswaPage === i + 1 
                                ? "z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                : "text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0"
                            }\`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => setSiswaPage(p => Math.min(siswaTotalPages, p + 1))}
                          disabled={siswaPage === siswaTotalPages}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                  
                  {/* Mobile Pagination */}
                  <div className="flex flex-1 justify-between sm:hidden items-center">
                    <button
                      onClick={() => setSiswaPage(p => Math.max(1, p - 1))}
                      disabled={siswaPage === 1}
                      className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Sebelumnya
                    </button>
                    <span className="text-xs text-slate-500 font-medium">Hal {siswaPage} / {siswaTotalPages}</span>
                    <button
                      onClick={() => setSiswaPage(p => Math.min(siswaTotalPages, p + 1))}
                      disabled={siswaPage === siswaTotalPages}
                      className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/AdminView.tsx', code);
