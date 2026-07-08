import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { findAttemptContent } from "@/lib/attempts";
import { ExamRunner } from "@/components/exam/exam-runner";
export default async function AttemptPage({params}:{params:Promise<{attemptId:string}>}){const user=await requireUser();const {attemptId}=await params;const data=await findAttemptContent(attemptId,user.id);if(data.attempt.status==='SUBMITTED')redirect(`/attempt/${attemptId}/results`);return <ExamRunner data={data as never}/>}
