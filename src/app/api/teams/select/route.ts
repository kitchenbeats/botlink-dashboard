import { COOKIE_KEYS } from "@/configs/keys";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = COOKIE_KEYS.SELECTED_TEAM_ID;
const COOKIE_OPTIONS = {
  expires: 8640000000, // ~100 years in seconds
  maxAge: 8640000000, // ~100 years in seconds
  secure: false,
  path: "/",
  sameSite: "lax",
  httpOnly: true,
} as const;

export async function POST(req: NextRequest) {
  const { domain } = await req.json();

  const response = new NextResponse(null, { status: 200 });

  response.cookies.set(COOKIE_NAME, domain, COOKIE_OPTIONS);

  return response;
}

export async function DELETE() {
  const response = new NextResponse(null, { status: 200 });

  response.cookies.delete(COOKIE_NAME);

  return response;
}
