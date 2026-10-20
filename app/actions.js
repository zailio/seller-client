'use server';


import { cookies } from "next/headers";

export async function getServerCookie(name) {
  return (await cookies()).get(name)?.value;
}
export async function rmServerCookie(name) {
  return (await cookies()).remove(name);
}
export async function setSellerToken(sessionId) {
  const cookieStore = await cookies(); // ✅ Await cookies()
  cookieStore.set("seller_token", sessionId, {
    path: "/",
    maxAge: 3600, // 1 hour
    httpOnly: false,
  });
}
