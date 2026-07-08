import { NextResponse } from "next/server";
import { requireSameOrigin } from "@/lib/http";
import { deleteSession } from "@/lib/auth/session";
export async function POST(request: Request) { requireSameOrigin(request); await deleteSession(); return NextResponse.json({ ok: true }); }
