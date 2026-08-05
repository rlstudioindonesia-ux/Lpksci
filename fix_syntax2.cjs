const fs = require('fs');
const file = 'src/components/LmsView.tsx';
let code = fs.readFileSync(file, 'utf-8');

const t1 = `                                                            </div>
                                                                ) : (
                                                                    <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-center font-bold text-xs shadow-3xs">
                                                                      🚫 Waktu pengerjaan tugas CBT telah habis. Anda tidak dapat mengunggah berkas lagi.
                                                                    </div>
                                                                )}
                                                              </>
                                                            )}
                                                          </div>
                                                        )}`;

const r1 = `                                                            </div>
                                                              </>
                                                                ) : (
                                                                    <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-center font-bold text-xs shadow-3xs">
                                                                      🚫 Waktu pengerjaan tugas CBT telah habis. Anda tidak dapat mengunggah berkas lagi.
                                                                    </div>
                                                                )}
                                                              </>
                                                            )}
                                                          </div>
                                                        )}`;

code = code.replace(t1, r1);
fs.writeFileSync(file, code);
