import { getSession } from "@/lib/auth";
import { getBranding } from "@/lib/settings-db";
import { HeaderNav } from "./HeaderNav";

export async function AppHeader() {
  const [branding, session] = await Promise.all([getBranding(), getSession()]);
  return <HeaderNav branding={branding} user={session} />;
}
