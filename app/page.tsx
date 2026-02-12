"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Handoff = {
  id: string;
  created_at: string;

  summary?: string | null;
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
  const [rows, setRows] = useState<Handoff[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSignoffs, setSelectedSignoffs] = useState<Signoff[]>([]);
  const [loading, setLoading] = useState(false);

  // Signoff UI state
  const [enableSignoff, setEnableSignoff] = useState(false);
  const [signName, setSignName] = useState("");
  const [signRole, setSignRole] = useState("");
  const [signPhase, setSignPhase] = useState("");
  const [signNotes, setSignNotes] = useState("");
  const [signSaving, setSignSaving] = useState(false);

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
      setSelectedId(null);
      setLoading(false);
      return;
    }

    const clean = (data as Handoff[]) || [];
    setRows(clean);
    if (!selectedId && clean.length) setSelectedId(clean[0].id);

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
      return;
    }

    setSelectedSignoffs((data as Signoff[]) || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadSignoffs(selectedId);

    // default signoff phase to the selected handoff phase (if exists)
    const phase = rows.find((r) => r.id === selectedId)?.phase;
    if (phase && !signPhase) setSignPhase(phase);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const stats = useMemo(() => {
    const total = rows.length;
    const byPhase: Record<string, number> = {};
    rows.forEach((r) => {
      const p = (r.phase || "Unknown").trim();
      byPhase[p] = (byPhase[p] || 0) + 1;
    });
    const topPhase = Object.entries(byPhase).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "n/a";
    return { total, topPhase };
  }, [rows]);

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
      alert("Sign-off failed. Check console + Supabase permissions.");
      return;
    }

    // reset + refresh list
    setEnableSignoff(false);
    setSignNotes("");
    await loadSignoffs(selected.id);
  }

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
        {/* SIDEBAR */}
        <aside className="bg-white border-r border-zinc-200 p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-900 text-white grid place-items-center font-bold">
              H
            </div>
            <div>
              <div className="font-semibold leading-tight">Hand-off</div>
              <div className="text-xs text-zinc-500">Internal Dashboard</div>
            </div>
          </div>

          <div className="mt-6 space-y-2 text-sm">
            <div className="px-3 py-2 rounded-lg bg-zinc-900 text-white font-medium">
              Handoffs
            </div>
            <div className="px-3 py-2 rounded-lg text-zinc-600">Overview</div>
            <div className="px-3 py-2 rounded-lg text-zinc-600">Settings</div>
          </div>

          <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs text-zinc-500">Total handoffs</div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
            <div className="text-xs text-zinc-500 mt-3">Most common phase</div>
            <div className="text-sm font-semibold mt-1">{stats.topPhase}</div>
          </div>

          <button
            onClick={load}
            className="mt-6 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </aside>

        {/* MAIN */}
        <section className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Internal Hand-off Dashboard</h1>
              <p className="text-sm text-zinc-600 mt-1">
                Voice → Vapi → n8n → Supabase → this screen
              </p>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <div className="rounded-xl bg-white border border-zinc-200 px-4 py-2">
                <div className="text-[11px] text-zinc-500">Selected</div>
                <div className="text-sm font-semibold">
                  {selected?.phase ?? "n/a"} {selected?.client_name ? `• ${selected.client_name}` : ""}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-5 mt-6">
            {/* LIST */}
            <div className="rounded-2xl bg-white border border-zinc-200 p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">All handoffs</h2>
                <div className="text-xs text-zinc-500">{rows.length} rows</div>
              </div>

              <div className="mt-3 space-y-2 max-h-[70vh] overflow-auto pr-1">
                {rows.map((r) => {
                  const active = r.id === selectedId;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`w-full text-left p-3 rounded-xl border transition ${
                        active
                          ? "border-zinc-900 bg-zinc-50"
                          : "border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold">
                          {(r.phase && r.phase !== "n/a" ? r.phase : "Unknown") +
                            (r.client_name ? ` — ${r.client_name}` : "")}
                        </div>
                        {r.priority && isUseful(r.priority) ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-zinc-900 text-white">
                            {String(r.priority)}
                          </span>
                        ) : null}
                      </div>

                      <div className="text-xs text-zinc-600 mt-1">
                        {(r.reported_by && isUseful(r.reported_by) ? r.reported_by : "n/a")} •{" "}
                        {niceTime(r.created_at)}
                      </div>

                      {r.summary && isUseful(r.summary) ? (
                        <div className="text-xs text-zinc-600 mt-2 line-clamp-2">
                          {r.summary}
                        </div>
                      ) : null}
                    </button>
                  );
                })}

                {!rows.length && !loading && (
                  <div className="text-sm text-zinc-500">No records yet.</div>
                )}
              </div>
            </div>

            {/* DETAILS */}
            <div className="rounded-2xl bg-white border border-zinc-200 p-4">
              <h2 className="font-semibold">Details</h2>

              {!selected ? (
                <div className="text-sm text-zinc-500 mt-3">Click a handoff on the left.</div>
              ) : (
                <div className="mt-3 space-y-4">
                  {/* DETAILS SECTIONS */}
                  {detailSections.map((sec) => (
                    <div key={sec.title} className="rounded-xl border border-zinc-200 p-3">
                      <div className="text-sm font-semibold">{sec.title}</div>
                      <div className="mt-2 space-y-2">
                        {sec.items.map((it) => (
                          <div
                            key={it.label}
                            className="grid grid-cols-[160px_1fr] gap-3 text-sm"
                          >
                            <div className="text-zinc-600">{it.label}</div>
                            <div className="text-zinc-900 break-words">{it.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* SIGNOFFS */}
                  <div className="rounded-xl border border-zinc-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">Sign-offs</div>

                      <label className="flex items-center gap-2 text-sm text-zinc-700 select-none">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={enableSignoff}
                          onChange={(e) => setEnableSignoff(e.target.checked)}
                        />
                        Add sign-off
                      </label>
                    </div>

                    {/* existing signoffs list */}
                    <div className="mt-3 space-y-2">
                      {selectedSignoffs.length ? (
                        selectedSignoffs.map((s) => (
                          <div
                            key={s.id}
                            className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-medium text-sm">
                                {s.signed_by_name} • {s.signed_by_role}
                              </div>
                              <div className="text-xs text-zinc-600">{niceTime(s.created_at)}</div>
                            </div>
                            <div className="text-xs text-zinc-700 mt-1">
                              Phase: <span className="font-medium">{s.signed_for_phase}</span>
                            </div>
                            {s.notes && isUseful(s.notes) ? (
                              <div className="text-sm text-zinc-800 mt-2">{s.notes}</div>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-zinc-500">No sign-offs yet.</div>
                      )}
                    </div>

                    {/* signoff form */}
                    {enableSignoff && (
                      <div className="mt-4 grid gap-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                            placeholder="Your name"
                            value={signName}
                            onChange={(e) => setSignName(e.target.value)}
                          />
                          <input
                            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                            placeholder="Your role (e.g. Solutions Architect)"
                            value={signRole}
                            onChange={(e) => setSignRole(e.target.value)}
                          />
                          <input
                            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                            placeholder="Phase you’re signing for (e.g. Solutions)"
                            value={signPhase}
                            onChange={(e) => setSignPhase(e.target.value)}
                          />
                        </div>

                        <textarea
                          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm min-h-[80px]"
                          placeholder="Optional notes (what you checked / next step)"
                          value={signNotes}
                          onChange={(e) => setSignNotes(e.target.value)}
                        />

                        <div className="flex items-center gap-2">
                          <button
                            onClick={submitSignoff}
                            disabled={signSaving}
                            className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-800 disabled:opacity-60"
                          >
                            {signSaving ? "Saving..." : "Submit sign-off"}
                          </button>

                          <button
                            onClick={() => setEnableSignoff(false)}
                            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
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
