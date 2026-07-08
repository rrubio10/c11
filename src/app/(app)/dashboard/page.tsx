import Link from "next/link";
import { BookOpen, Clock3, Flame, Target, TrendingUp } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDuration, testGroupLabel } from "@/lib/utils";
import { StartButton } from "@/components/ui/start-button";

export default async function DashboardPage(){
  const user=await requireUser();
  const [sets, attempts]=await Promise.all([
    db.exerciseSet.findMany({where:{active:true},select:{testGroup:true,part:true,itemCount:true},orderBy:[{testGroup:'asc'},{part:'asc'}]}),
    db.attempt.findMany({where:{userId:user.id},include:{exerciseSet:{select:{title:true,externalId:true,part:true,testGroup:true}}},orderBy:{startedAt:'desc'},take:20})
  ]);
  const submitted=attempts.filter(a=>a.status==='SUBMITTED'); const avg=submitted.length?submitted.reduce((n,a)=>n+a.percentage,0)/submitted.length:0;
  const inProgress=attempts.find(a=>a.status==='IN_PROGRESS');
  const groups=[...new Set(sets.map(s=>s.testGroup))].filter(g=>!['STANDALONE','MEGA_KWT'].includes(g)).slice(0,6);
  const days=new Set(submitted.map(a=>a.submittedAt?.toISOString().slice(0,10)).filter(Boolean));
  return <main className="mx-auto max-w-[1400px] px-4 py-8 lg:px-7">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[#007f86]">YOUR STUDY SPACE</p><h1 className="mt-1 text-3xl font-bold">Welcome, {user.name.split(' ')[0]}</h1><p className="mt-2 text-slate-600">Build exam confidence one carefully reviewed answer at a time.</p></div><Link className="rounded-md border border-slate-300 bg-white px-4 py-2.5 font-semibold hover:bg-slate-50" href="/library">Browse all exercises</Link></div>
    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon={<Target/>} label="Average score" value={`${Math.round(avg)}%`}/><Stat icon={<BookOpen/>} label="Completed attempts" value={String(submitted.length)}/><Stat icon={<Clock3/>} label="Study time" value={formatDuration(submitted.reduce((n,a)=>n+a.timeSpentSeconds,0))}/><Stat icon={<Flame/>} label="Study days" value={String(days.size)}/>
    </section>
    {inProgress&&<section className="mt-7 rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50 to-white p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-[#007f86]">Continue where you left off</p><h2 className="mt-1 text-xl font-bold">{inProgress.exerciseSet?.title??testGroupLabel(inProgress.testGroup??'Practice')}</h2><p className="mt-1 text-sm text-slate-600">Started {inProgress.startedAt.toLocaleDateString('en-GB')}</p></div><Link href={`/attempt/${inProgress.id}`} className="rounded-md bg-[#007f86] px-5 py-3 font-bold text-white">Continue</Link></div></section>}
    <section className="mt-9"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Available full tests</h2><Link className="text-sm font-semibold text-[#007f86]" href="/library?mode=full">View all</Link></div><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{groups.map(g=>{const parts=sets.filter(s=>s.testGroup===g);return <article key={g} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-bold text-slate-500">FULL READING & USE OF ENGLISH</p><h3 className="mt-1 text-lg font-bold">{testGroupLabel(g)}</h3></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{parts.length} parts</span></div><p className="mt-3 text-sm text-slate-600">{parts.reduce((n,p)=>n+p.itemCount,0)} questions across Parts 1–8.</p><StartButton testGroup={g} label="Start full test" className="mt-5 w-full"/></article>})}</div></section>
    <section className="mt-9"><div className="flex items-center gap-2"><TrendingUp size={20}/><h2 className="text-xl font-bold">Recent results</h2></div><div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">{submitted.length===0?<p className="p-6 text-slate-600">No submitted attempts yet.</p>:submitted.slice(0,6).map((a,i)=><Link key={a.id} href={`/attempt/${a.id}/results`} className={`flex items-center gap-4 p-4 hover:bg-slate-50 ${i?'border-t border-slate-100':''}`}><div className="grid h-11 w-11 place-items-center rounded-full bg-teal-50 font-bold text-[#007f86]">{Math.round(a.percentage)}%</div><div className="min-w-0 flex-1"><b className="block truncate">{a.exerciseSet?.title??testGroupLabel(a.testGroup??'Practice')}</b><span className="text-sm text-slate-500">{a.rawScore}/{a.maximumScore} points · {formatDuration(a.timeSpentSeconds)}</span></div><span className="text-sm text-slate-500">{a.submittedAt?.toLocaleDateString('en-GB')}</span></Link>)}</div></section>
  </main>
}
function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3 text-[#007f86]">{icon}<span className="text-sm font-semibold text-slate-600">{label}</span></div><div className="mt-3 text-2xl font-bold">{value}</div></div>}
