import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { AdminImport } from "@/components/ui/admin-import";
export default async function ImportPage(){try{await requireAdmin()}catch{redirect('/dashboard')}return <main className="mx-auto max-w-3xl px-4 py-9"><h1 className="text-3xl font-bold">Import exercise data</h1><p className="mt-2 mb-7 text-slate-600">The importer is idempotent, validates identifiers and item counts, and preserves user attempts.</p><section className="rounded-xl border bg-white p-6"><AdminImport/></section></main>}
