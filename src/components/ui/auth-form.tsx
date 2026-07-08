"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter(); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    const form = new FormData(e.currentTarget); const body=Object.fromEntries(form.entries());
    const res=await fetch(`/api/auth/${mode}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    const data=await res.json(); setBusy(false);
    if(!res.ok){setError(data.error === "INVALID_CREDENTIALS" ? "Email or password is incorrect." : data.error === "EMAIL_IN_USE" ? "This email is already registered." : "We could not complete the request.");return;}
    router.replace("/dashboard"); router.refresh();
  }
  return <form onSubmit={submit} className="space-y-4">
    {mode==="register"&&<label className="block text-sm font-semibold">Name<input name="name" required minLength={2} autoComplete="name" className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5"/></label>}
    <label className="block text-sm font-semibold">Email<input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5"/></label>
    <label className="block text-sm font-semibold">Password<input name="password" type="password" required minLength={mode==="register"?10:1} autoComplete={mode==="login"?"current-password":"new-password"} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5"/></label>
    {error&&<p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    <button disabled={busy} className="w-full rounded-md bg-[#007f86] px-4 py-3 font-bold text-white hover:bg-[#00666b] disabled:opacity-60">{busy?"Please wait…":mode==="login"?"Sign in":"Create account"}</button>
    <p className="text-center text-sm text-slate-600">{mode==="login"?<>New here? <Link className="font-semibold text-[#007f86]" href="/register">Create an account</Link></>:<>Already registered? <Link className="font-semibold text-[#007f86]" href="/login">Sign in</Link></>}</p>
  </form>;
}
