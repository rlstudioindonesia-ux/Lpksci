export const isMathSubject = (s: any): boolean => {
  if (!s) return false;
  const str = String(s).trim().toLowerCase();
  return str === "ssw" || str.includes("matematika") || str.includes("math") || str.includes("ssw");
};

export const isJapaneseSubject = (s: any): boolean => {
  if (!s) return true;
  const str = String(s).trim().toLowerCase();
  return !isMathSubject(str);
};

export const isSameSubject = (subjA: any, subjB: any): boolean => {
  const a = (subjA || "Bahasa Jepang").trim().toLowerCase();
  const b = (subjB || "Bahasa Jepang").trim().toLowerCase();
  if (a === b) return true;
  const mathA = isMathSubject(a);
  const mathB = isMathSubject(b);
  if (mathA && mathB) return true;
  const jpnA = isJapaneseSubject(a);
  const jpnB = isJapaneseSubject(b);
  return jpnA && jpnB;
};

export const getCanonicalSubjectSlug = (s: any): "bahasa_jepang" | "matematika" => {
  return isMathSubject(s) ? "matematika" : "bahasa_jepang";
};

export const getCanonicalSubjectName = (s: any): "Bahasa Jepang" | "Matematika" => {
  return isMathSubject(s) ? "Matematika" : "Bahasa Jepang";
};
