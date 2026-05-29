"use client";
import { useState, useRef } from "react";

const INSTANT_TEMPLATES = {
  "Dead Air": [
    "Chat, don't let me die out here — what's everyone up to today?",
    "It's quiet… TOO quiet. Someone say something wild in chat, go.",
    "Okay chat, this is your moment. Entertain me. What you got?",
    "Drop a 1 if you're lurking, 2 if you're actually watching. Let's see who's here.",
    "Real talk chat — what should I be doing differently right now?",
  ],
  "New Viewer": [
    "Welcome to the chaos! Chat, say hi and tell them what kind of stream this is.",
    "New faces in chat — glad you're here! Drop where you're watching from.",
    "Fresh eyes in the building! Chat, should I explain what's going on or just let them figure it out?",
    "If you just found this stream, no context needed — just buckle up and enjoy.",
  ],
  "Hype Moment": [
    "CHAT. Did you see that?! Someone clip that RIGHT NOW.",
    "That's the highlight of the stream and we all know it. Chat explode.",
    "Okay that just happened. I need chat to validate me — was that as crazy as I think it was?",
    "I've been waiting for that moment all stream. LETS GOOO chat!",
  ],
  "Just Started": [
    "We're live! Who's here from the jump? Drop something in chat so I know you're real.",
    "Alright we're starting — chat, good to see you. What's the vibe today?",
    "Day one energy in chat — let's set the tone. What are we doing today?",
    "Stream is officially GO. What do you want to see happen today?",
  ],
  "Raid Incoming": [
    "We've got a raid coming in — chat, make some noise and welcome the crew!",
    "Incoming raid! Everyone be on your best behavior… or don't, this is Twitch.",
    "Raid! Chat show them how we do it here — say hello!",
  ],
  "Taking a Break": [
    "Quick break incoming — don't go anywhere, chat. Talk amongst yourselves.",
    "Bio break, two minutes. Chat, debate something while I'm gone. Go.",
    "Stepping away for a sec — chat keep the energy up, I'll be right back.",
  ],
  "Controversial Take": [
    "I said what I said. Chat — agree or disagree? Let's hear it.",
    "Okay drop your hot takes in chat, I know you all have opinions on this.",
    "I'm not backing down. Chat, who's with me and who's against me?",
  ],
  "Giveaway": [
    "Alright chat, this is the moment you've been waiting for — let's gooo!",
    "Giveaway time! Chat goes crazy in 3… 2… 1…",
    "Something special is happening right now — chat make some noise!",
  ],
};

const MOMENTS = Object.keys(INSTANT_TEMPLATES);
const VIBES = ["Hype & Energetic", "Chill & Laid Back", "Funny & Chaotic", "Wholesome & Warm", "Competitive & Intense"];
const accentColors = ["#8b5cf6", "#06b6d4", "#f97316", "#10b981"];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, 4);
}

async function callAI(body) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export default function ChatIgniter() {
  const [dark, setDark] = useState(true);
  const [mode, setMode] = useState("instant");

  const [instantTopic, setInstantTopic] = useState("");
  const [activeMoment, setActiveMoment] = useState(null);
  const [instantResults, setInstantResults] = useState(null);
  const [preloading, setPreloading] = useState(false);
  const [preloaded, setPreloaded] = useState(false);
  const [preloadedBank, setPreloadedBank] = useState({});
  const debounceRef = useRef(null);
  const lastTopicRef = useRef("");

  const [topic, setTopic] = useState("");
  const [vibe, setVibe] = useState("");
  const [moment, setMoment] = useState("");
  const [scripts, setScripts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);

  const d = dark;
  const bg = d ? "#0d0d14" : "#f5f4f0";
  const fg = d ? "#f0eeff" : "#1a1a2e";
  const subtle = d ? "#ffffff10" : "#1a1a2e10";
  const border = d ? "#ffffff18" : "#1a1a2e20";
  const muted = d ? "#ffffff50" : "#1a1a2e55";

  const copy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 1800);
  };

  const preloadBank = async (topicVal) => {
    if (!topicVal.trim()) return;
    setPreloading(true);
    setPreloaded(false);
    setPreloadedBank({});

    const prompt = `You are a Twitch stream engagement coach. Generate chat engagement scripts for a streamer playing/doing: "${topicVal}"

For EACH of these 8 stream moments, generate 6 short punchy lines the streamer says OUT LOUD:
${MOMENTS.map((m, i) => `${i + 1}. ${m}`).join("\n")}

Rules for every line:
- 1-2 sentences max
- Natural and conversational, not scripted
- Includes a question or CTA to get chat responding
- Reference "${topicVal}" naturally where it fits
- Varied across all 6 lines per moment

Respond ONLY with a valid JSON object where each key is the exact moment name and value is an array of 6 strings. No markdown, no preamble.`;

    try {
      const data = await callAI({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });
      const text = data.content?.map((i) => i.text || "").join("") || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setPreloadedBank(parsed);
      setPreloaded(true);
      if (activeMoment && parsed[activeMoment]) {
        setInstantResults(shuffle(parsed[activeMoment]));
      }
    } catch {
      setPreloaded(false);
    } finally {
      setPreloading(false);
    }
  };

  const handleTopicChange = (val) => {
    setInstantTopic(val);
    setPreloaded(false);
    setPreloadedBank({});
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) return;
    debounceRef.current = setTimeout(() => {
      if (val.trim() !== lastTopicRef.current) {
        lastTopicRef.current = val.trim();
        preloadBank(val.trim());
      }
    }, 800);
  };

  const fireInstant = (m) => {
    setActiveMoment(m);
    const bank = preloaded && preloadedBank[m]?.length ? preloadedBank[m] : INSTANT_TEMPLATES[m];
    setInstantResults(shuffle(bank));
  };

  const generateCustom = async () => {
    if (!topic.trim() || !vibe || !moment) { setError("Fill in all fields first!"); return; }
    setError(""); setLoading(true); setScripts(null);
    const prompt = `You are a Twitch stream engagement coach. Generate exactly 4 short punchy chat engagement lines the streamer says OUT LOUD.
Stream: ${topic} | Vibe: ${vibe} | Moment: ${moment}
Rules: 1-3 sentences max, natural not scripted, includes a question or CTA, match the vibe, all 4 varied.
Respond ONLY with a JSON array of 4 strings. No markdown, no preamble.`;
    try {
      const data = await callAI({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      });
      const text = data.content?.map((i) => i.text || "").join("") || "";
      setScripts(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch { setError("Something went wrong. Try again!"); }
    finally { setLoading(false); }
  };

  const ScriptCard = ({ line, i }) => (
    <div onClick={() => copy(line, i)} style={{
      position: "relative", background: subtle, border: `1px solid ${border}`,
      borderLeft: `3px solid ${accentColors[i % 4]}`,
      borderRadius: 10, padding: "12px 48px 12px 16px",
      cursor: "pointer", marginBottom: 8,
    }}>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: d ? "#ffffffcc" : "#1a1a2ecc" }}>{line}</p>
      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, fontFamily: "monospace", color: copied === i ? "#10b981" : muted }}>
        {copied === i ? "✓" : "copy"}
      </span>
    </div>
  );

  const Dots = () => (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "20px 0" }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#8b5cf6", animation: "bounce 0.8s infinite", animationDelay: `${i * 0.12}s` }} />
      ))}
    </div>
  );

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: bg, color: fg, transition: "all 0.25s" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, background: "#8b5cf6", borderRadius: "50%", display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontWeight: 800, fontSize: 16, background: "linear-gradient(135deg,#8b5cf6,#d946ef)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Chat Igniter
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["instant", "custom"].map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: "pointer", border: "none", transition: "all 0.2s",
              background: mode === m ? "#7c3aed" : subtle,
              color: mode === m ? "#fff" : muted,
            }}>
              {m === "instant" ? "⚡ Instant" : "🎯 Custom"}
            </button>
          ))}
          <button onClick={() => setDark(!d)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", background: subtle, border: `1px solid ${border}`, color: muted }}>
            {d ? "☀" : "☾"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 60px" }}>
        {mode === "instant" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, marginBottom: 6 }}>
                Game / Topic <span style={{ color: d ? "#ffffff30" : "#1a1a2e30", fontStyle: "italic", textTransform: "none", letterSpacing: 0 }}>— optional</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  value={instantTopic}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  placeholder="e.g. Minecraft, Valorant, Just Chatting..."
                  style={{
                    width: "100%", boxSizing: "border-box", background: subtle,
                    border: `1px solid ${preloaded ? "#10b981" : preloading ? "#f59e0b" : border}`,
                    borderRadius: 10, padding: "10px 40px 10px 14px", fontSize: 13, color: fg,
                    outline: "none", fontFamily: "system-ui, sans-serif", transition: "border 0.3s",
                  }}
                />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12 }}>
                  {preloading ? "⏳" : preloaded ? "✅" : ""}
                </span>
              </div>
              {preloading && <p style={{ fontSize: 11, color: "#f59e0b", margin: "5px 0 0" }}>⚡ Loading personalized scripts in background…</p>}
              {preloaded && <p style={{ fontSize: 11, color: "#10b981", margin: "5px 0 0" }}>✦ Scripts personalized for <strong>{instantTopic}</strong> — tap any moment!</p>}
            </div>

            <p style={{ fontSize: 12, color: muted, marginBottom: 12 }}>Tap a moment → instant scripts.</p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {MOMENTS.map((m) => (
                <button key={m} onClick={() => fireInstant(m)} style={{
                  padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", border: `1px solid ${activeMoment === m ? "#7c3aed" : border}`,
                  background: activeMoment === m ? "#7c3aed" : subtle,
                  color: activeMoment === m ? "#fff" : muted, transition: "all 0.15s",
                }}>
                  {m}
                </button>
              ))}
            </div>

            {instantResults && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: muted }}>
                    {activeMoment}{instantTopic ? ` · ${instantTopic}` : ""}
                  </span>
                  <button onClick={() => fireInstant(activeMoment)} style={{ fontSize: 11, background: "none", border: "none", cursor: "pointer", color: muted }}>↻ shuffle</button>
                </div>
                {instantResults.map((line, i) => <ScriptCard key={i} line={line} i={i} />)}
              </div>
            )}

            {!instantResults && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: muted, fontSize: 13 }}>
                👆 Tap any moment above to fire scripts
              </div>
            )}
          </div>
        )}

        {mode === "custom" && (
          <div>
            <p style={{ fontSize: 12, color: muted, marginBottom: 16 }}>Full control — vibe, topic, moment. Best when you have a moment to spare.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, marginBottom: 6 }}>What are you streaming?</label>
                <input value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Minecraft, Just Chatting, Valorant ranked..."
                  style={{ width: "100%", boxSizing: "border-box", background: subtle, border: `1px solid ${border}`, borderRadius: 10, padding: "11px 14px", fontSize: 13, color: fg, outline: "none", fontFamily: "system-ui, sans-serif" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, marginBottom: 6 }}>Vibe</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {VIBES.map((v) => (
                    <button key={v} onClick={() => setVibe(v)} style={{
                      padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      background: vibe === v ? "#7c3aed" : subtle, border: `1px solid ${vibe === v ? "#7c3aed" : border}`,
                      color: vibe === v ? "#fff" : muted, transition: "all 0.15s",
                    }}>{v}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, marginBottom: 6 }}>What's happening?</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {MOMENTS.map((m) => (
                    <button key={m} onClick={() => setMoment(m)} style={{
                      padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      background: moment === m ? "#c026d3" : subtle, border: `1px solid ${moment === m ? "#c026d3" : border}`,
                      color: moment === m ? "#fff" : muted, transition: "all 0.15s",
                    }}>{m}</button>
                  ))}
                </div>
              </div>
              {error && <p style={{ color: "#f87171", fontSize: 12, margin: 0 }}>{error}</p>}
              <button onClick={generateCustom} disabled={loading} style={{
                padding: "14px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg,#7c3aed,#c026d3)",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1, fontFamily: "system-ui, sans-serif",
              }}>
                {loading ? "Generating..." : "✦ Generate Custom Scripts"}
              </button>
            </div>
            {loading && <Dots />}
            {scripts && !loading && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: muted }}>Your scripts</span>
                  <button onClick={generateCustom} style={{ fontSize: 11, background: "none", border: "none", cursor: "pointer", color: muted }}>↻ regenerate</button>
                </div>
                {scripts.map((line, i) => <ScriptCard key={i} line={line} i={i} />)}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
      `}</style>
    </div>
  );
}
