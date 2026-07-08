import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
export async function GET(){try{await requireAdmin();const [users,sets,items,attempts,submitted]=await Promise.all([db.user.count(),db.exerciseSet.count(),db.exerciseItem.count(),db.attempt.count(),db.attempt.count({where:{status:'SUBMITTED'}})]);return NextResponse.json({users,sets,items,attempts,submitted})}catch(e){return apiError(e)}}
