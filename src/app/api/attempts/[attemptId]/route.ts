import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { findAttemptContent } from "@/lib/attempts";
import { apiError } from "@/lib/http";
export async function GET(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try { const user = await requireUser(); const { attemptId } = await params; const data = await findAttemptContent(attemptId, user.id); return NextResponse.json(data); } catch (error) { return apiError(error); }
}
