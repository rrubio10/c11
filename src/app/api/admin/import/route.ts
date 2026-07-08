import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { importMasterText } from "@/lib/importer/import-db";
import { apiError, requireSameOrigin } from "@/lib/http";
const schema=z.object({sourceName:z.string().min(1).max(200),content:z.string().min(50).max(5_000_000)});
export async function POST(request:Request){try{requireSameOrigin(request);await requireAdmin();const input=schema.parse(await request.json());const r=await importMasterText(input.content,input.sourceName);return NextResponse.json({ok:r.errors.length===0,sets:r.sets.length,items:r.sets.reduce((n,s)=>n+s.items.length,0),errors:r.errors,warnings:r.warnings},{status:r.errors.length?422:200})}catch(e){return apiError(e)}}
