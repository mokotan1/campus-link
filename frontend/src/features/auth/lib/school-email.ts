export const allowedSchoolDomains = ["kmu.ac.kr"] as const;

export function getEmailDomain(email: string) {
  return email.trim().toLowerCase().split("@")[1] ?? "";
}

export function isSchoolEmail(email: string) {
  const domain = getEmailDomain(email);
  return allowedSchoolDomains.some((allowed) => allowed === domain);
}

export function schoolEmailMessage() {
  return "학교 이메일 도메인(kmu.ac.kr)으로 가입해야 합니다.";
}
