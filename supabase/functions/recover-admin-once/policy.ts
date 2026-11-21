export function canRecoverAdmin(userId: string, targetId: string, role: string | undefined): boolean {
  return userId === targetId && role === "admin";
}