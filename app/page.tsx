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
};

type Signoff = {
  id: string;
  created_at: string;
  handoff_id: string;
  signed_by_name: string;
  signed_by_role: string;
  signed_for_phase: string;
  notes?: string | null;
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
  const [loading, setLoading] = useState(false);
  
  // Feature: Expand Button
  const [isExpanded, setIsExpanded] = useState(false);

  // Selection & Sign-offs
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSignoffs, setSelectedSignoffs] = useState<Signoff[]>([]);

  // Signoff Form State
  const [enableSignoff, setEnableSignoff] = useState(false);
  const [signName, setSignName] = useState("");
  const [signRole, setSignRole] = useState("");
  const [signPhase, setSignPhase] = useState("");
  const [signNotes, setSignNotes] = useState("");
  const [signSaving, setSignSaving] = useState(false);

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
      // If we have data but no selection, select the first one
      if (!selectedId && data && data.length > 0) {
        setSelectedId(data[0].id);
      }
    }
    setLoading(false);
  }

  async function loadSignoffs(handoffId: string) {
    const { data, error } = await supabase
      .from("handoff_signoffs")
      .select("*")
      .eq("handoff_id", handoffId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setSelectedSignoffs([]);
    } else {
      setSelectedSignoffs((data as Signoff[]) || []);
    }
  }

  // Initial Load
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When selection changes, load sign-offs
  useEffect(() => {
    if (!selectedId) return;
    loadSignoffs(selectedId);

    // Auto-fill phase if possible
    const phase = rows.find((r) => r.id === selectedId)?.phase;
    if (phase && !signPhase) setSignPhase(phase);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

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

  async function submitSignoff() {
    if (!selected) return;

    const name = signName.trim();
    const role = signRole.trim();
    const phase = signPhase.trim();

    if (!name || !role || !phase) {
      alert("Please fill: name, role, and phase.");
      return;
    }

    setSignSaving(true);

    const { error } = await supabase.from("handoff_signoffs").insert({
      handoff_id: selected.id,
      signed_by_name: name,
      signed_by_role: role,
      signed_for_phase: phase,
      notes: signNotes.trim() || null,
    });

    setSignSaving(false);

    if (error) {
      console.error(error);
      alert("Sign-off failed. Check console.");
      return;
    }

    // Success: reset form and reload list
    setEnableSignoff(false);
    setSignNotes("");
    await loadSignoffs(selected.id);
  }

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
            <div className={`rounded-2xl bg-white border border-zinc-200 p-4 shadow-sm transition-all duration-300 ${isExpanded ? 'row-span-2' : ''}`}>
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
                  // Simple check if this handoff has any signoffs loaded (optional visual cue)
                  // For now we keep the list simple to avoid complex filtering logic
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`w-full text-left p-3 rounded-xl border transition ${
                        active ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900" : "border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold text-sm">
                          {r.phase || "Unknown"} {r.client_name ? `— ${r.client_name}` : ""}
                        </div>
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

                  {/* SIGNOFFS SECTION (Uses separate table) */}
                  <div className="rounded-xl border border-zinc-200 p-4 bg-zinc-50">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="text-sm font-bold uppercase text-zinc-600 tracking-wider">Sign-offs</div>
                      <label className="flex items-center gap-2 text-xs text-blue-600 font-medium cursor-pointer hover:underline select-none">
                        <input
                          type="checkbox"
                          className="h-3 w-3 accent-blue-600"
                          checked={enableSignoff}
                          onChange={(e) => setEnableSignoff(e.target.checked)}
                        />
                        Add new sign-off
                      </label>
                    </div>

                    {/* Signoff List */}
                    <div className="space-y-2 mb-4">
                      {selectedSignoffs.length > 0 ? (
                        selectedSignoffs.map((s) => (
                          <div key={s.id} className="bg-white border border-zinc-200 p-3 rounded-lg shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-sm font-semibold text-zinc-800">{s.signed_by_name}</div>
                                <div className="text-xs text-zinc-500">{s.signed_by_role} • For phase: {s.signed_for_phase}</div>
                              </div>
                              <div className="text-[10px] text-zinc-400">{niceTime(s.created_at)}</div>
                            </div>
                            {s.notes && <div className="text-xs text-zinc-600 mt-2 pt-2 border-t border-zinc-100">{s.notes}</div>}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-zinc-400 italic">No sign-offs recorded yet.</div>
                      )}
                    </div>

                    {/* Signoff Form */}
                    {enableSignoff && (
                      <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                         <div className="grid grid-cols-1 gap-3 mb-3">
                           <input 
                             placeholder="Your Name" 
                             className="text-sm px-3 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                             value={signName}
                             onChange={(e) => setSignName(e.target.value)}
                           />
                           <input 
                             placeholder="Role (e.g. Architect)" 
                             className="text-sm px-3 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                             value={signRole}
                             onChange={(e) => setSignRole(e.target.value)}
                           />
                           <input 
                             placeholder="Phase (e.g. Solutions)" 
                             className="text-sm px-3 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                             value={signPhase}
                             onChange={(e) => setSignPhase(e.target.value)}
                           />
                           <textarea
                             placeholder="Optional notes..."
                             className="text-sm px-3 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                             value={signNotes}
                             onChange={(e) => setSignNotes(e.target.value)}
                           />
                         </div>
                         <div className="flex gap-2">
                           <button 
                             onClick={submitSignoff}
                             disabled={signSaving}
                             className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-2 rounded-lg text-sm transition"
                           >
                             {signSaving ? "Saving..." : "Submit Sign-off"}
                           </button>
                           <button 
                             onClick={() => setEnableSignoff(false)}
                             className="px-4 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium py-2 rounded-lg text-sm transition"
                           >
                             Cancel
                           </button>
                         </div>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}