import { useEffect, useRef, useState } from "react";
import "./App.css";

const samples = [
  "I need this done as soon as possible.",
  "Sorry, I cannot make it today.",
  "Can we talk about something important?",
  "Thank you for your support.",
];

const toneData = {
  Professional: {
    label: "Professional",
    tag: "CLEAR & CONFIDENT",
  },
  Casual: {
    label: "Casual",
    tag: "RELAXED & NATURAL",
  },
  Direct: {
    label: "Direct",
    tag: "CLEAR & ASSERTIVE",
  },
  Warm: {
    label: "Warm",
    tag: "KIND & EMPATHETIC",
  },
  Balanced: {
    label: "Balanced",
    tag: "NATURAL & THOUGHTFUL",
  },
};

export default function App() {
  const [message, setMessage] = useState(
    "I need this done as soon as possible."
  );

  const [point, setPoint] = useState({
    x: 50,
    y: 50,
  });

  const [tone, setTone] = useState("Balanced");
  const [result, setResult] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiOnline, setAiOnline] = useState(false);

  // NEW: Stores previous rewrites
  const [history, setHistory] = useState([]);

  const toneFieldRef = useRef(null);

  async function checkAIStatus() {
    try {
      const response = await fetch("http://127.0.0.1:8000/status");

      if (!response.ok) {
        setAiOnline(false);
        return;
      }

      const data = await response.json();
      setAiOnline(data.ai === "online");
    } catch (error) {
      setAiOnline(false);
    }
  }

  useEffect(() => {
    checkAIStatus();

    const interval = setInterval(() => {
      checkAIStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  function getToneFromPosition(x, y) {
    const centerDistance = Math.sqrt(
      Math.pow(x - 50, 2) + Math.pow(y - 50, 2)
    );

    if (centerDistance < 16) return "Balanced";
    if (y < 38) return "Professional";
    if (x < 38) return "Casual";
    if (x > 62) return "Direct";

    return "Warm";
  }

  function updateTonePosition(event) {
    const field = toneFieldRef.current;

    if (!field) return;

    const rect = field.getBoundingClientRect();

    let x = ((event.clientX - rect.left) / rect.width) * 100;
    let y = ((event.clientY - rect.top) / rect.height) * 100;

    x = Math.max(5, Math.min(95, x));
    y = Math.max(5, Math.min(95, y));

    setPoint({ x, y });
    setTone(getToneFromPosition(x, y));
  }

  function handlePointerDown(event) {
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    updateTonePosition(event);
  }

  function handlePointerMove(event) {
    if (!dragging) return;
    updateTonePosition(event);
  }

  function handlePointerUp() {
    setDragging(false);
  }

  async function handleShapeWords() {
    if (!aiOnline) {
      setResult(
        "AI is currently offline. Please make sure the backend and Ollama are running."
      );
      return;
    }

    const text = message.trim();

    if (!text) {
      setResult("Write something first, then shape the tone that feels right.");
      return;
    }

    setLoading(true);
    setCopied(false);
    setResult("");

    try {
      const response = await fetch("http://127.0.0.1:8000/rewrite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          tone: tone,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to rewrite message");
      }

      const data = await response.json();

      setResult(data.result);
      setAiOnline(true);

      // NEW: Save successful rewrite to history
      const newHistoryItem = {
        id: Date.now(),
        original: text,
        tone: tone,
        result: data.result,
      };

      setHistory((previousHistory) => [
        newHistoryItem,
        ...previousHistory,
      ]);

    } catch (error) {
      console.error(error);

      setAiOnline(false);

      setResult(
        "Something went wrong. The AI may have gone offline. Please check the backend and Ollama."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result || loading) return;

    try {
      await navigator.clipboard.writeText(result);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  }

  // NEW: Clear all history
  function clearHistory() {
    setHistory([]);
  }

  // NEW: Load an old result back into the output
  function loadHistoryItem(item) {
    setMessage(item.original);
    setTone(item.tone);
    setResult(item.result);
    setCopied(false);
  }

  function useSample(sample) {
    setMessage(sample);
    setResult("");
    setCopied(false);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">✦</div>

          <div>
            <div className="brand-name">TONEKEY</div>
            <div className="brand-subtitle">AI COMMUNICATION</div>
          </div>
        </div>

        <nav className="nav">
          <button>Product</button>
          <button>How it works</button>
          <button>Use cases</button>
          <button>Pricing</button>
        </nav>

        <div className="nav-right">
          <span
            className={`ai-status ${
              aiOnline ? "online" : "offline"
            }`}
          >
            <span className="status-dot" />
            {aiOnline ? "AI Online" : "AI Offline"}
          </span>

          <button className="sign-in">Sign in</button>
          <button className="get-started">Get started</button>
        </div>
      </header>

      <main className="workspace">

        <aside className="intro-panel">
          <div className="eyebrow">
            BETTER CONVERSATIONS
            <span />
          </div>

          <div className="small-line">A BRIGHTER YOU</div>

          <h1>
            <span>Say</span>
            <span>Thoughts.</span>
            <span className="small-word">A</span>
            <em>Better</em>
            <em>You.</em>
          </h1>

          <p>
            ToneKey helps you express yourself clearly,
            <br />
            confidently and authentically — in any situation.
          </p>

          <div className="stats">
            <div>
              <strong>1M+</strong>
              <span>MESSAGES</span>
              <small>REFINED</small>
            </div>

            <div>
              <strong>4.9★</strong>
              <span>USER</span>
              <small>RATING</small>
            </div>

            <div>
              <strong>100%</strong>
              <span>PRIVACY</span>
              <small>FIRST</small>
            </div>
          </div>
        </aside>

        {/* INPUT */}

        <section className="panel thought-panel">
          <div className="panel-top">
            <span>01 / YOUR THOUGHT</span>

            <span className="live">
              <i />
              LIVE
            </span>
          </div>

          <div className="panel-content">
            <h2>What do you want to say?</h2>

            <p className="panel-description">
              Write it naturally. Don't overthink it.
            </p>

            <textarea
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setResult("");
                setCopied(false);
              }}
              placeholder="Write what you really want to say..."
              maxLength={500}
            />

            <div className="sample-title">✦ Try an example</div>

            <div className="samples">
              {samples.map((sample) => (
                <button
                  key={sample}
                  onClick={() => useSample(sample)}
                  className={message === sample ? "active-sample" : ""}
                >
                  <span>{sample}</span>
                  <b>→</b>
                </button>
              ))}
            </div>
          </div>

          <div className="panel-bottom">
            <span>RAW THOUGHT</span>
            <span>SHIFT + ENTER</span>
          </div>
        </section>

        {/* TONE FIELD */}

        <section className="panel tone-panel">
          <div className="panel-top">
            <span>02 / TONE FIELD</span>
            <span>DRAG TO EXPLORE</span>
          </div>

          <div className="tone-content">
            <h2>Find your tone.</h2>

            <p className="panel-description">
              Drag anywhere inside the field to shape how your message feels.
            </p>

            <div
              ref={toneFieldRef}
              className={`tone-field ${dragging ? "dragging" : ""}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <div className="grid-lines" />

              <div className="axis horizontal-axis" />
              <div className="axis vertical-axis" />

              <span className="field-label professional-label">
                PROFESSIONAL
              </span>

              <span className="field-label casual-label">
                CASUAL
              </span>

              <span className="field-label direct-label">
                DIRECT
              </span>

              <span className="field-label warm-label">
                WARM
              </span>

              <span className="balanced-label">BALANCED</span>

              <div
                className="tone-point"
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                }}
              >
                <div className="tone-ring ring-one" />
                <div className="tone-ring ring-two" />
                <div className="tone-core" />
              </div>
            </div>

            <div className="selected-tone">
              <div>
                <span>SELECTED TONE</span>
                <small>{toneData[tone].tag}</small>
              </div>

              <strong>{toneData[tone].label}</strong>
            </div>

            <p className="tone-hint">
              Move through the field — every position creates a different
              communication style.
            </p>
          </div>
        </section>

        {/* OUTPUT */}

        <section className="panel output-panel">
          <div className="panel-top">
            <span>03 / TRANSFORMATION</span>

            <span className="ai-ready">
              <i />
              {loading ? "SHAPING..." : aiOnline ? "AI READY" : "AI OFFLINE"}
            </span>
          </div>

          <div className="output-content">
            <div className="output-orbit">
              <div className="orbit orbit-1" />
              <div className="orbit orbit-2" />

              <div className="output-core">
                {loading ? "..." : aiOnline ? "✦" : "!"}
              </div>
            </div>

            <div className="output-box">
              <span>
                {loading
                  ? "SHAPING YOUR MESSAGE"
                  : !aiOnline
                  ? "AI IS OFFLINE"
                  : result
                  ? `${tone.toUpperCase()} VERSION`
                  : "YOUR REFINED MESSAGE"}
              </span>

              <p>
                {loading
                  ? "ToneKey is shaping your words..."
                  : !aiOnline
                  ? "Start the backend and Ollama to use ToneKey."
                  : result ||
                    "Your words will evolve here. Choose a tone and let ToneKey shape the expression."}
              </p>

              {result && !loading && aiOnline && (
                <button
                  className="copy-button"
                  onClick={handleCopy}
                >
                  {copied ? "✓ COPIED!" : "⧉ COPY"}
                </button>
              )}
            </div>
          </div>

          <button
            className="shape-button"
            onClick={handleShapeWords}
            disabled={loading || !aiOnline}
          >
            <span>
              {loading
                ? "SHAPING..."
                : !aiOnline
                ? "AI OFFLINE"
                : "SHAPE MY WORDS"}
            </span>

            <b>
              {loading
                ? "..."
                : !aiOnline
                ? "!"
                : "↗"}
            </b>
          </button>
        </section>
      </main>

      {/* NEW: TONE HISTORY */}

      <section className="history-section">
        <div className="history-header">
          <div>
            <span className="history-label">
              04 / TONE HISTORY
            </span>

            <h2>Your previous transformations</h2>
          </div>

          {history.length > 0 && (
            <button
              className="clear-history-button"
              onClick={clearHistory}
            >
              CLEAR HISTORY
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="empty-history">
            <span>✦</span>
            <p>
              Your tone transformations will appear here.
            </p>
          </div>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <button
                key={item.id}
                className="history-item"
                onClick={() => loadHistoryItem(item)}
              >
                <div className="history-item-top">
                  <span>{item.tone.toUpperCase()}</span>
                  <small>VIEW →</small>
                </div>

                <p className="history-original">
                  {item.original}
                </p>

                <p className="history-result">
                  {item.result}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      <footer className="footer">
        <span>TONEKEY © 2026</span>

        <span className="footer-center">
          THOUGHT
          <i />
          TONE
          <i />
          IMPACT
        </span>

        <span>DESIGNED FOR HUMAN CONVERSATION</span>
      </footer>
    </div>
  );
}