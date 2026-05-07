import { useState } from "react";
import axios from "axios";
import MapView from "./MapView";
import "leaflet/dist/leaflet.css";

// TYPES 

type FormData = {
  currentLocation: string;
  pickupLocation: string;
  dropoffLocation: string;
  cycleUsed: number;
};

type Route = {
  distance_miles: number;
  duration_hours: number;
  geometry: [number, number][];
};

type LogEntry = {
  start: number;
  end: number;
  status: string;
};

type DayLog = {
  day: number;
  entries: LogEntry[];
};

type Stop = {
  type: string;
  day: number;
};

type ApiResponse = {
  route: Route;
  logs: DayLog[];
  stops: Stop[];
};

// ICONS  

const IconRoute = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="3" cy="4" r="1.5"/><circle cx="13" cy="12" r="1.5"/>
    <path d="M3 5.5C3 8 6 8 8 8s5 0 5 2.5"/>
  </svg>
);

const IconClock = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="8" cy="8" r="6"/><path d="M8 4v4l2.5 2"/>
  </svg>
);

const IconFlag = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M3 2v12M3 2l10 3-10 3"/>
  </svg>
);

const IconAlert = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M8 2L1 14h14L8 2z"/><path d="M8 7v3M8 11.5v.5"/>
  </svg>
);

const IconTruck = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 11h14M3 11V7l2-4h6l2 4v4M6 11V9h4v2"/>
    <circle cx="4.5" cy="12.5" r="1.5"/><circle cx="11.5" cy="12.5" r="1.5"/>
  </svg>
);

// ELD LOG SHEET  
function ELDLogSheet({ log, date }: { log: DayLog; date: string }) {
  const getPos = (time: number) => (time / 24) * 100;

  const getTotals = (status: string) =>
    log.entries
      .filter((e) => e.status === status)
      .reduce((acc, curr) => acc + (curr.end - curr.start), 0)
      .toFixed(1);

  const statusRows: { key: string; label: string }[] = [
    { key: "OFF",     label: "Off Duty"          },
    { key: "SB",      label: "Sleeper Berth"      },
    { key: "DRIVING", label: "Driving"            },
    { key: "ON_DUTY", label: "On Duty"            },
  ];

  const yMap: Record<string, number> = {
    OFF: 12.5, SB: 37.5, DRIVING: 62.5, ON_DUTY: 87.5,
  };

  return (
    <div
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border-mid)",
        borderRadius: "var(--radius-lg)",
        padding: "1.25rem 1.5rem",
        marginBottom: "0.75rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Amber top-edge accent */}
      <div style={{
        position: "absolute", inset: "0 0 auto 0", height: 2,
        background: "linear-gradient(90deg, var(--amber) 0%, transparent 60%)",
      }} />

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        marginBottom: "1rem", paddingBottom: "0.75rem",
        borderBottom: "1px solid var(--border)",
      }}>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em",
            textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>
            ELD Form 395-B
          </p>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem",
            color: "var(--text-h)", letterSpacing: "-0.02em" }}>
            Driver's Daily Log
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>
            Report Date
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 500,
            color: "var(--amber)" }}>
            Day {log.day} &mdash; {date}
          </p>
        </div>
      </div>

      {/* Row labels + Grid */}
      <div style={{ display: "flex", gap: 12 }}>
        {/* Status labels */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around",
          width: 90, flexShrink: 0 }}>
          {statusRows.map((row) => (
            <span key={row.key} style={{
              fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.06em",
              textTransform: "uppercase", color: row.key === "DRIVING" ? "var(--amber)" : "var(--text-muted)",
              fontWeight: row.key === "DRIVING" ? 500 : 400,
            }}>
              {row.label}
            </span>
          ))}
        </div>

        {/* Grid canvas */}
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{
            position: "relative",
            background: "var(--surface-2)",
            border: "1px solid var(--border-mid)",
            borderRadius: 8,
            height: 120,
            overflow: "hidden",
          }}>
            {/* Hour grid lines */}
            {[...Array(23)].map((_, i) => (
              <div key={i} style={{
                position: "absolute", top: 0, bottom: 0,
                left: `${((i + 1) / 24) * 100}%`,
                borderLeft: `1px solid var(--border)`,
                opacity: i % 6 === 5 ? 0.6 : 0.3,
              }} />
            ))}

            {/* Horizontal status row dividers */}
            {[25, 50, 75].map((pct) => (
              <div key={pct} style={{
                position: "absolute", left: 0, right: 0,
                top: `${pct}%`, borderTop: "1px solid var(--border)",
              }} />
            ))}

            {/* SVG timeline */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              {log.entries.map((entry, idx) => {
                const y = yMap[entry.status] ?? 87.5;
                const xStart = getPos(entry.start);
                const xEnd = getPos(entry.end);
                const next = log.entries[idx + 1];
                const isActive = entry.status === "DRIVING";
                return (
                  <g key={idx}>
                    <line
                      x1={`${xStart}%`} y1={`${y}%`}
                      x2={`${xEnd}%`} y2={`${y}%`}
                      stroke={isActive ? "var(--amber)" : "var(--primary)"}
                      strokeWidth={isActive ? 3 : 2}
                    />
                    {next && (
                      <line
                        x1={`${xEnd}%`} y1={`${y}%`}
                        x2={`${xEnd}%`} y2={`${yMap[next.status] ?? 87.5}%`}
                        stroke={isActive ? "var(--amber)" : "var(--primary)"}
                        strokeWidth="1.5" strokeDasharray="3 2"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Hour axis */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            marginTop: 4, paddingBottom: 2,
          }}>
            {["M","","","","","","6","","","","","","N","","","","","","6","","","","","","M"].map((h, i) => (
              <span key={i} style={{
                fontFamily: "var(--font-mono)", fontSize: "0.55rem",
                color: h ? "var(--text-muted)" : "transparent",
                width: 0, display: "flex", justifyContent: "center",
              }}>{h}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Totals */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8,
        marginTop: "0.875rem",
      }}>
        {statusRows.map((row) => (
          <div key={row.key} style={{
            background: "var(--surface-2)", border: "1px solid var(--border)",
            borderRadius: 6, padding: "6px 10px", textAlign: "center",
          }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem",
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: row.key === "DRIVING" ? "var(--amber)" : "var(--text-muted)",
              marginBottom: 2 }}>
              {row.key === "ON_DUTY" ? "On Duty" : row.key}
            </p>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800,
              fontSize: "0.95rem", color: "var(--text-h)" }}>
              {getTotals(row.key)}<span style={{ fontSize: "0.6rem", fontWeight: 400,
                color: "var(--text-muted)", marginLeft: 2 }}>hr</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// FIELD COMPONENT 

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.1em",
        textTransform: "uppercase", color: "var(--text-muted)",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: 2, background: "var(--amber)",
          flexShrink: 0, display: "inline-block" }} />
        {label}
      </label>
      {children}
    </div>
  );
}

// SECTION DIVIDER

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.75rem",
      fontFamily: "var(--font-mono)", fontSize: "0.65rem",
      letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)",
      margin: "0.25rem 0",
    }}>
      {children}
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

// STOP TYPE COLORS

const stopStyles: Record<string, { bg: string; color: string; border: string }> = {
  REST:    { bg: "var(--success-dim)", color: "var(--success)", border: "rgba(34,197,94,0.25)" },
  FUEL:    { bg: "var(--amber-dim)",   color: "var(--amber)",   border: "rgba(245,158,11,0.25)" },
  PICKUP:  { bg: "var(--primary-dim)", color: "var(--primary)", border: "rgba(59,130,246,0.25)" },
  DROPOFF: { bg: "var(--danger-dim)",  color: "var(--danger)",  border: "rgba(239,68,68,0.25)" },
};

function stopBadge(type: string) {
  const s = stopStyles[type.toUpperCase()] ?? {
    bg: "var(--surface-3)", color: "var(--text-muted)", border: "var(--border-mid)",
  };
  return s;
}

// MAIN APPLICATION

export default function App() {
  const [form, setForm] = useState<FormData>({
    currentLocation: "",
    pickupLocation: "",
    dropoffLocation: "",
    cycleUsed: 0,
  });

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
  if (!form.currentLocation || !form.dropoffLocation) {
    alert("Please enter at least Departure and Destination.");
    return;
  }

  // Get the base URL from the env file, fallback to empty string if missing
  const API_BASE_URL = import.meta.env.VITE_API_URL || "";

  try {
    setLoading(true);
    // Using a template literal to combine the base URL and the endpoint
    const res = await axios.post<ApiResponse>(`${API_BASE_URL}/api/plan-trip/`, form);
    setData(res.data);
  } catch (err) {
    console.error("Connection Error:", err);
    alert("Backend connection error. Please check your API configuration.");
  } finally {
    setLoading(false);
  }
};

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.65rem 1rem",
    fontFamily: "var(--font-ui)", fontSize: 16,
    color: "var(--text-strong)",
    background: "var(--surface-2)",
    border: "1px solid var(--border-mid)",
    borderRadius: "var(--radius)", outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>

      {/* ── HEADER ── */}
      <header style={{
        borderBottom: "1px solid var(--border-mid)",
        background: "var(--surface-1)",
        padding: "0 1.5rem",
      }}>
        <div style={{
          maxWidth: 1360, margin: "0 auto",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "1rem 0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Logo mark */}
            <div style={{
              width: 36, height: 36,
              background: "var(--amber)", borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <IconTruck />
            </div>
            <div>
              <h1 style={{
                fontFamily: "var(--font-display)", fontWeight: 800,
                fontSize: "clamp(1.2rem,3vw,1.6rem)", letterSpacing: "-0.03em",
                color: "var(--text-h)", lineHeight: 1.1,
              }}>
                Meridian <span style={{ color: "var(--amber)" }}>ELD</span>
              </h1>
              <p style={{
                fontFamily: "var(--font-mono)", fontSize: "0.6rem",
                letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)",
              }}>
                Trip Planner & Compliance Monitor
              </p>
            </div>
          </div>

          {/* Status chip */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--surface-2)", border: "1px solid var(--border-mid)",
            borderRadius: "var(--radius)", padding: "8px 14px",
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: loading ? "var(--amber)" : "var(--success)",
              boxShadow: loading
                ? "0 0 0 0 rgba(245,158,11,0.5)"
                : "0 0 0 0 rgba(34,197,94,0.5)",
              animation: "pulse-status 2s infinite",
            }} />
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: "0.68rem",
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: loading ? "var(--amber)" : "var(--success)",
            }}>
              {loading ? "Computing…" : "System Ready"}
            </span>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: "0.65rem",
              color: "var(--text-muted)", borderLeft: "1px solid var(--border-mid)",
              paddingLeft: 10, marginLeft: 2,
            }}>
              70hr / 8-day cycle
            </span>
          </div>
        </div>

        <style>{`
          @keyframes pulse-status {
            0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
            70%  { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
            100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
          }
          input:focus { border-color: var(--amber) !important; box-shadow: 0 0 0 3px var(--amber-dim) !important; }
          input::placeholder { color: var(--text-muted); }
        `}</style>
      </header>

      {/* ── MAIN ── */}
      <main style={{
        maxWidth: 1360, margin: "0 auto",
        padding: "1.5rem",
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr)",
        gap: "1.25rem",
      }}>
        <style>{`
          @media (min-width: 1024px) {
            .app-layout { grid-template-columns: 300px minmax(0,1fr) !important; }
          }
        `}</style>

        <div className="app-layout" style={{
          display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: "1.25rem",
        }}>

          {/* ── LEFT: FORM ── */}
          <aside style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Manifest form card */}
            <div style={{
              background: "var(--surface-1)", border: "1px solid var(--border-mid)",
              borderRadius: "var(--radius-lg)", padding: "1.5rem",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", inset: "0 0 auto 0", height: 2,
                background: "linear-gradient(90deg, var(--amber) 0%, transparent 60%)",
              }} />

              <div style={{ marginBottom: "1.25rem" }}>
                <h2 style={{
                  fontFamily: "var(--font-display)", fontWeight: 700,
                  fontSize: "1rem", color: "var(--text-h)", letterSpacing: "-0.02em",
                }}>Manifest Data</h2>
                <p style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.62rem",
                  color: "var(--text-muted)", letterSpacing: "0.08em",
                  textTransform: "uppercase", marginTop: 4,
                }}>
                  Enter trip parameters below
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {([
                  { label: "Current Location", key: "currentLocation", placeholder: "City or coordinates" },
                  { label: "Pickup Location",  key: "pickupLocation",  placeholder: "City or coordinates" },
                  { label: "Dropoff Location", key: "dropoffLocation", placeholder: "City or coordinates" },
                ] as const).map((field) => (
                  <Field key={field.key} label={field.label}>
                    <input
                      style={inputStyle}
                      placeholder={field.placeholder}
                      value={(form as any)[field.key]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    />
                  </Field>
                ))}

                <Field label="Prior Cycle Hours Used">
                  <input
                    type="number"
                    style={inputStyle}
                    value={form.cycleUsed}
                    onChange={(e) => setForm({ ...form, cycleUsed: Number(e.target.value) })}
                  />
                </Field>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    width: "100%", padding: "0.75rem 1.25rem",
                    fontFamily: "var(--font-ui)", fontSize: "0.875rem", fontWeight: 600,
                    letterSpacing: "0.02em",
                    background: loading ? "var(--surface-3)" : "var(--amber)",
                    color: loading ? "var(--text-muted)" : "#0a0e14",
                    border: "none", borderRadius: "var(--radius)",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading ? "none" : "0 2px 10px var(--amber-glow)",
                    transition: "all 0.15s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <IconRoute />
                  {loading ? "Planning Route…" : "Process Trip"}
                </button>
              </div>
            </div>

            {/* Trip analytics card — shown after response */}
            {data && (
              <div style={{
                background: "var(--surface-1)", border: "1px solid var(--border-mid)",
                borderRadius: "var(--radius-lg)", padding: "1.25rem 1.5rem",
              }}>
                <SectionLabel>Trip Analytics</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: "0.75rem" }}>
                  {[
                    { icon: <IconRoute />,  label: "Distance",  value: `${data.route.distance_miles.toFixed(1)}`, unit: "mi" },
                    { icon: <IconClock />,  label: "Est. Time", value: `${data.route.duration_hours.toFixed(1)}`,   unit: "hr" },
                  ].map((stat) => (
                    <div key={stat.label} style={{
                      background: "var(--surface-2)", border: "1px solid var(--border)",
                      borderRadius: 8, padding: "12px 14px",
                    }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 5,
                        fontFamily: "var(--font-mono)", fontSize: "0.6rem",
                        letterSpacing: "0.1em", textTransform: "uppercase",
                        color: "var(--text-muted)", marginBottom: 6,
                      }}>
                        {stat.icon} {stat.label}
                      </div>
                      <p style={{
                        fontFamily: "var(--font-display)", fontWeight: 800,
                        fontSize: "1.5rem", letterSpacing: "-0.04em",
                        color: "var(--text-h)", lineHeight: 1,
                      }}>
                        {stat.value}
                        <span style={{ fontSize: "0.65rem", fontWeight: 400,
                          color: "var(--text-muted)", marginLeft: 4 }}>
                          {stat.unit}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* ── RIGHT: OUTPUT ── */}
          <article style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Map */}
            {data?.route ? (
              <MapView geometry={data.route.geometry} />
            ) : (
              <div style={{
                height: 320, border: "1px dashed var(--border-strong)",
                borderRadius: "var(--radius-lg)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 10,
                background: "var(--surface-2)",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "var(--surface-3)", border: "1px solid var(--border-mid)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-muted)",
                }}>
                  <IconRoute />
                </div>
                <p style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.7rem",
                  letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)",
                }}>
                  Awaiting route geometry
                </p>
              </div>
            )}

            {/* Logbook entries */}
            {data?.logs && (
              <div>
                <SectionLabel>
                  <IconFlag /> Logbook Entries
                </SectionLabel>
                <div style={{ marginTop: "0.75rem" }}>
                  {data.logs.map((log, i) => (
                    <ELDLogSheet
                      key={i}
                      log={log}
                      date={new Date().toLocaleDateString()}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Stops */}
            {data?.stops && (
              <div style={{
                background: "var(--surface-1)", border: "1px solid var(--border-mid)",
                borderRadius: "var(--radius-lg)", padding: "1.25rem 1.5rem",
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginBottom: "1rem",
                }}>
                  <SectionLabel>
                    <IconAlert /> Intervention Points
                  </SectionLabel>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "0.65rem",
                    color: "var(--text-muted)", letterSpacing: "0.08em",
                  }}>
                    {data.stops.length} total
                  </span>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 8,
                }}>
                  {data.stops.map((s, i) => {
                    const bs = stopBadge(s.type);
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        background: "var(--surface-2)", border: "1px solid var(--border)",
                        borderRadius: "var(--radius)", padding: "10px 12px",
                        transition: "border-color 0.15s",
                      }}>
                        <span style={{
                          fontFamily: "var(--font-mono)", fontSize: "0.6rem",
                          letterSpacing: "0.08em", textTransform: "uppercase",
                          background: "var(--surface-3)", color: "var(--text-muted)",
                          border: "1px solid var(--border-mid)",
                          padding: "2px 7px", borderRadius: 4, flexShrink: 0,
                        }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <p style={{
                            fontFamily: "var(--font-mono)", fontSize: "0.68rem",
                            letterSpacing: "0.06em", textTransform: "uppercase",
                            background: bs.bg, color: bs.color,
                            border: `1px solid ${bs.border}`,
                            padding: "1px 8px", borderRadius: 4,
                            display: "inline-block", marginBottom: 3,
                          }}>
                            {s.type}
                          </p>
                          <p style={{
                            fontFamily: "var(--font-mono)", fontSize: "0.62rem",
                            color: "var(--text-muted)",
                          }}>
                            Day {s.day}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </article>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        maxWidth: 1360, margin: "0 auto",
        padding: "1.25rem 1.5rem",
        borderTop: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 8,
      }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: "0.62rem",
          letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)",
        }}>
          Meridian ELD // Terminal ID: 4882-X
        </span>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: "0.62rem",
          letterSpacing: "0.08em", color: "var(--text-muted)",
        }}>
          {new Date().toISOString().replace("T", " ").slice(0, 19)}
        </span>
      </footer>
    </div>
  );
}