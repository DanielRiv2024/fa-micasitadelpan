export default function Loading() {
  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes progressAnim {
          0%   { width: 4%;  opacity: 1; }
          60%  { width: 78%; opacity: 1; }
          85%  { width: 91%; opacity: 1; }
          100% { width: 91%; opacity: 0.3; }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .loading-card {
          animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        .spinner-arc {
          animation: spin 0.85s cubic-bezier(0.4,0,0.6,1) infinite;
        }
        .spinner-dot-rev {
          animation: spin 0.85s cubic-bezier(0.4,0,0.6,1) infinite reverse;
        }
        .progress-fill {
          animation: progressAnim 3.8s ease-in-out infinite;
        }
        .skel { animation: shimmer 1.6s ease-in-out infinite; }
        .skel-2 { animation: shimmer 1.6s ease-in-out 0.15s infinite; }
        .skel-3 { animation: shimmer 1.6s ease-in-out 0.30s infinite; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        backgroundColor: "#f0f4f8",
        backgroundImage: `
          linear-gradient(rgba(20,71,230,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(20,71,230,0.06) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
      }}>

        <div className="loading-card" style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "24px",
          padding: "48px 52px",
          width: "360px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "32px",
          boxShadow: "0 4px 24px rgba(20,71,230,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        }}>

          {/* Spinner */}
          <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
            {/* track */}
            <div style={{
              position: "absolute", inset: 0,
              borderRadius: "50%",
              border: "3px solid #e8edf5",
            }} />
            {/* arc */}
            <div className="spinner-arc" style={{
              position: "absolute", inset: 0,
              borderRadius: "50%",
              border: "3px solid transparent",
              borderTopColor: "#1447E6",
              borderRightColor: "#1447E6",
            }} />
            {/* reverse dot */}
            <div className="spinner-dot-rev" style={{
              position: "absolute", inset: 0,
              borderRadius: "50%",
              border: "3px solid transparent",
              borderBottomColor: "rgba(20,71,230,0.2)",
            }} />
            {/* center */}
            <div style={{
              position: "absolute", inset: 12,
              background: "#eff4ff",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                   stroke="#1447E6" strokeWidth="1.8"
                   strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2"/>
                <path d="M8 2v4M16 2v4M3 10h18M8 14h4M8 17h2"/>
              </svg>
            </div>
          </div>

          {/* Text */}
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 6 }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#1a1d2e", letterSpacing: "-0.3px", margin: 0 }}>
              Cargando
            </p>
            <p style={{ fontSize: 13, color: "#8e96b0", margin: 0 }}>
              Preparando la aplicación...
            </p>
          </div>

          {/* Progress */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{
              width: "100%", height: 4,
              background: "#eaecf5",
              borderRadius: 99,
              overflow: "hidden",
            }}>
              <div className="progress-fill" style={{
                height: "100%",
                background: "#1447E6",
                borderRadius: 99,
                width: "4%",
              }} />
            </div>
            {/* dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 7 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{
                  width: 7, height: 7,
                  borderRadius: "50%",
                  background: i === 0 ? "#1447E6" : "#dde3f0",
                  transform: i === 0 ? "scale(1.4)" : "scale(1)",
                  transition: "background 0.35s, transform 0.25s",
                }} />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: "100%", height: 1, background: "#f0f2f8" }} />

          {/* Skeletons */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 11 }}>
            {[
              { w: "90%", cls: "skel" },
              { w: "70%", cls: "skel skel-2" },
              { w: "55%", cls: "skel skel-3" },
            ].map(({ w, cls }, i) => (
              <div key={i} className={cls} style={{
                height: 12,
                width: w,
                borderRadius: 7,
                backgroundImage: "linear-gradient(90deg,#edf0f7 0%,#dce2ef 45%,#edf0f7 100%)",
                backgroundSize: "300% 100%",
              }} />
            ))}
          </div>

        </div>
      </div>
    </>
  );
}