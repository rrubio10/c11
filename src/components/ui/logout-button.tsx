"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
export function LogoutButton(){const r=useRouter();return <button className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-slate-100" onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});r.replace('/login');r.refresh();}}><LogOut size={16}/>Sign out</button>}
