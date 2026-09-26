import { Hall } from "@/components/Hall";
import { getSessionUser } from "@/lib/session";
import { getCourt, getUserPet } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const court = await getCourt();
  const user = await getSessionUser();
  const pet = user ? await getUserPet(user.id) : null;
  return <Hall initialCourt={court} initialMe={{ user, pet }} />;
}
