"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// --- TYPES ---
type Handoff = {
  id: string;
  created_at: string;
  summary?: string | null;

  // structured fields
  phase?: string | null;
  reported_by?: string | null;
  reported_role?: string | null;

  client_name?: string | null;
  pain_points?: string | null;
  budget?: string | null;
  priority?: string | null;
  ai_models_discussed?: string | null;

  technical_constraints?: string | null;
  api_information?: string | null;
  edge_cases?: string | null;

  latency_requirements?: string | null;
  gpu_cost_notes?: string | null;
  docker_tag?: string | null;

  performance_metrics?: string | null;
  pilot_results?: string | null;
  secret_sauce_notes?: string | null;

  // Sign-off fields (These match the columns we added earlier)
  signed_off_by?: string | null;
  signed_off_role?: string | null;
  signed_off_at?: string | null;
};

// --- HELPER FUNCTIONS ---
function niceTime(ts?: string | null) {
  if (!ts) return "n/a";
  const d = new Date(ts);
  return isNaN(d.getTime()) ? ts : d.toLocaleString();
}

function isUseful(v: unknown) {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s !== "" && s !== "n/a" && s !== "na" && s !== "null" && s !== "undefined";
  }
  return true;
}

export default function Home() {
  // --- STATE ---
  const [rows, setRows] = useState<Handoff[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // New Feature: Expand State
  const [isExpanded, setIsExpanded] = useState(false);

  // Sign-off State
  const [signerName, setSignerName] = useState("");
  const [signerRole, setSignerRole] = useState("");
  const [isSigning, setIsSigning] = useState(false);

  // --- LOGIC ---
  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId]
  );

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("handoffs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setRows([]);
    } else {
      setRows((data as Handoff[]) || []);
    }
    setLoading(false);
  }

  async function handleSignOff() {
    if (!selected) return;
    if (!signerName.trim() || !signerRole.trim()) {
      alert("Please enter both Name and Role to sign off.");
      return;
    }

    setIsSigning(true);
    const { error } = await supabase
      .from("handoffs")
      .update({
        signed_off_by: signerName,
        signed_off_role: signerRole,
        signed_off_at: new Date().toISOString(),
      })
      .eq("id", selected.id);

    if (error) {
      alert("Error signing off: " + error.message);
    } else {
      setSignerName("");
      setSignerRole("");
      await load();
    }
    setIsSigning(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detailSections = useMemo(() => {
    if (!selected) return [];

    const sections: Array<{
      title: string;
      items: Array<{ label: string; value: string }>;
    }> = [];

    const addSection = (title: string, entries: Array<[string, unknown]>) => {
      const items = entries
        .filter(([, v]) => isUseful(v))
        .map(([label, v]) => ({ label, value: String(v) }));
      if (items.length) sections.push({ title, items });
    };

    addSection("Core", [
      ["Phase", selected.phase],
      ["Client", selected.client_name],
      ["Reported by", selected.reported_by],
      ["Role", selected.reported_role],
      ["Priority", selected.priority],
      ["Budget", selected.budget],
      ["Created", niceTime(selected.created_at)],
    ]);

    addSection("Sales info", [
      ["Pain points", selected.pain_points],
      ["AI models discussed", selected.ai_models_discussed],
    ]);

    addSection("Solutions info", [
      ["Technical constraints", selected.technical_constraints],
      ["API info", selected.api_information],
      ["Edge cases", selected.edge_cases],
    ]);

    addSection("Engineering info", [
      ["Latency requirements", selected.latency_requirements],
      ["GPU cost notes", selected.gpu_cost_notes],
      ["Docker tag", selected.docker_tag],
    ]);

    addSection("Product info", [
      ["Performance metrics", selected.performance_metrics],
      ["Pilot results", selected.pilot_results],
      ["Secret sauce notes", selected.secret_sauce_notes],
    ]);

    addSection("Summary", [["Summary", selected.summary]]);

    return sections;
  }, [selected]);

  // --- RENDER ---
  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-900 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
        
        {/* SIDEBAR */}
        <aside className="bg-white border-r border-zinc-200 p-5 min-h-screen sticky top-0 h-screen overflow-y-auto">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-900 text-white grid place-items-center font-bold">H</div>
            <div>
              <div className="font-semibold leading-tight">Hand-off</div>
              <div className="text-xs text-zinc-500">Internal Dashboard</div>
            </div>
          </div>
          <div className="mt-6 space-y-1 text-sm">
            <div className="px-3 py-2 rounded-lg bg-zinc-900 text-white font-medium">Handoffs</div>
            <div className="px-3 py-2 rounded-lg text-zinc-600 hover:bg-zinc-50 cursor-pointer">Overview</div>
            <div className="px-3 py-2 rounded-lg text-zinc-600 hover:bg-zinc-50 cursor-pointer">Settings</div>
          </div>
          <button
            onClick={load}
            className="mt-6 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </aside>

        {/* MAIN CONTENT */}
        <section className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Internal Hand-off Dashboard</h1>
              <p className="text-sm text-zinc-600 mt-1">Voice → Vapi → n8n → Supabase → this screen</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-6 mt-6 items-start">
            
            {/* LIST PANEL (With Expand Feature) */}
            <div className={`rounded-2xl bg-white border border-zinc-200 p-4 shadow-sm transition-all duration-300`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-zinc-800">All handoffs</h2>
                <div className="flex gap-2 items-center">
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-zinc-500 hover:text-blue-600 font-medium px-2 py-1 rounded hover:bg-zinc-100 transition"
                  >
                    {isExpanded ? "Collapse View" : "Expand View"}
                  </button>
                  <div className="text-xs text-zinc-500">{rows.length} records</div>
                </div>
              </div>

              {/* The List Container */}
              <div className={`space-y-2 pr-1 transition-all ${isExpanded ? '' : 'max-h-[75vh] overflow-auto'}`}>
                {rows.map((r) => {
                  const active = r.id === selectedId;
                  const isSigned = !!r.signed_off_at;
                  return (
                    <button
                      key={r.id}
                      onClick={() => { setSelectedId(r.id); setSignerName(""); setSignerRole(""); }}
                      className={`w-full text-left p-3 rounded-xl border transition ${
                        active ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900" : "border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold text-sm">
                          {r.phase || "Unknown"} {r.client_name ? `— ${r.client_name}` : ""}
                        </div>
                        {isSigned && (
                          <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Signed
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {niceTime(r.created_at)} • {r.reported_by || "n/a"}
                      </div>
                    </button>
                  );
                })}
                 {!rows.length && !loading && (
                  <div className="text-sm text-zinc-500 p-2">No records found.</div>
                )}
              </div>
            </div>

            {/* DETAILS PANEL */}
            <div className="rounded-2xl bg-white border border-zinc-200 p-6 shadow-sm sticky top-6">
              <h2 className="font-semibold mb-4 text-zinc-800">Details</h2>

              {!selected ? (
                <div className="text-sm text-zinc-500 italic">Select a handoff to view details.</div>
              ) : (
                <div className="space-y-6">
                  
                  {/* SIGN-OFF SECTION */}
                  <div className={`rounded-xl p-5 border ${selected.signed_off_at ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200"}`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${selected.signed_off_at ? "text-emerald-800" : "text-blue-800"}`}>
                      {selected.signed_off_at ? "✅ Hand-off Complete" : "⏳ Review & Sign-off"}
                    </h3>

                    {selected.signed_off_at ? (
                      <div className="text-sm text-emerald-900">
                        <p>Accepted by <strong>{selected.signed_off_by}</strong> ({selected.signed_off_role}).</p>
                        <p className="text-xs mt-1 opacity-75">{niceTime(selected.signed_off_at)}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-blue-800 mb-2">Review data. Sign off to proceed.</p>
                        <div className="grid grid-cols-2 gap-3">
                          <input 
                            placeholder="Your Name" 
                            className="text-sm px-3 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={signerName}
                            onChange={(e) => setSignerName(e.target.value)}
                          />
                          <input 
                            placeholder="Role" 
                            className="text-sm px-3 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={signerRole}
                            onChange={(e) => setSignerRole(e.target.value)}
                          />
                        </div>
                        <button 
                          onClick={handleSignOff}
                          disabled={isSigning}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition"
                        >
                          {isSigning ? "Signing off..." : "Accept & Sign Off"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* DATA SECTIONS */}
                  {detailSections.map((sec) => (
                    <div key={sec.title} className="rounded-xl border border-zinc-200 p-4">
                      <div className="text-xs font-bold uppercase text-zinc-400 mb-3 tracking-wider">{sec.title}</div>
                      <div className="space-y-3">
                        {sec.items.map((it) => (
                          <div key={it.label} className="grid grid-cols-[140px_1fr] gap-4 text-sm">
                            <div className="text-zinc-500 font-medium">{it.label}</div>
                            <div className="text-zinc-900 break-words">{it.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}