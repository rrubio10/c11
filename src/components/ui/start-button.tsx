"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function StartButton({setId,testGroup,label="Start practice",className=""}:{setId?:string;testGroup?:string;label?:string;className?:string}){const [busy,setBusy]=useState(false);const r=useRouter();return <button disabled={busy} onClick={async()=>{setBusy(true);const res=await fetch('/api/attempts',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(setId?{setId}:{testGroup})});const d=await res.json();if(res.ok)r.push(`/attempt/${d.attemptId}`);else setBusy(false);}} className={`rounded-md bg-[#007f86] px-4 py-2.5 font-bold text-white hover:bg-[#00666b] disabled:opacity-60 ${className}`}>{busy?'Opening…':label}</button>}
