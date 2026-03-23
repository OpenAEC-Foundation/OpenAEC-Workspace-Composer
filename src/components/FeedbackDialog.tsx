import { createSignal, Show, For } from "solid-js";
import { TbOutlineX } from "solid-icons/tb";

const API_URL = "https://open-feedback-studio.pages.dev/api/feedback";
const APP_ID = "openaec-workspace-composer";
const MAX_MESSAGE = 5000;
const MIN_MESSAGE = 10;

type Status = "idle" | "submitting" | "success" | "error";

interface FeedbackDialogProps {
  open: boolean;
  onClose: () => void;
}

export function FeedbackDialog(props: FeedbackDialogProps) {
  const [email, setEmail] = createSignal(localStorage.getItem("feedback-email") || "");
  const [fullName, setFullName] = createSignal(localStorage.getItem("feedback-name") || "");
  const [category, setCategory] = createSignal("general");
  const [message, setMessage] = createSignal("");
  const [sentiment, setSentiment] = createSignal<number | null>(null);
  const [status, setStatus] = createSignal<Status>("idle");
  const [errorMsg, setErrorMsg] = createSignal("");

  const isValidEmail = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email().trim());
  const canSubmit = () =>
    isValidEmail() &&
    message().trim().length >= MIN_MESSAGE &&
    message().length <= MAX_MESSAGE &&
    status() !== "submitting";

  const SENTIMENT_MAP: Record<number, string> = { 1: "Frustrated", 2: "Neutral", 3: "Happy" };

  const categories = [
    { key: "general", label: "General" },
    { key: "bug", label: "Bug Report" },
    { key: "feature", label: "Feature Request" },
  ];

  const sentiments = [
    { value: 1, emoji: "\u{1F61E}", label: "Frustrated" },
    { value: 2, emoji: "\u{1F610}", label: "Neutral" },
    { value: 3, emoji: "\u{1F60A}", label: "Happy" },
  ];

  function resetForm() {
    setCategory("general");
    setMessage("");
    setSentiment(null);
    setStatus("idle");
    setErrorMsg("");
  }

  function handleClose() {
    resetForm();
    props.onClose();
  }

  async function handleSubmit() {
    if (!canSubmit()) return;

    setStatus("submitting");
    setErrorMsg("");

    try {
      const sentimentValue = sentiment();
      const sentimentLabel = sentimentValue ? SENTIMENT_MAP[sentimentValue] : undefined;

      const body: Record<string, string | undefined> = {
        app: APP_ID,
        email: email().trim(),
        fullname: fullName().trim() || undefined,
        category: category(),
        message: message().trim(),
        sentiment: sentimentLabel,
        appVersion: "3.0.0",
      };

      // Remove undefined values
      const cleanBody = Object.fromEntries(
        Object.entries(body).filter(([, v]) => v !== undefined)
      );

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanBody),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as any).error || `HTTP ${response.status}`);
      }

      // Remember email and name for next time
      localStorage.setItem("feedback-email", email().trim());
      if (fullName().trim()) localStorage.setItem("feedback-name", fullName().trim());

      setStatus("success");
    } catch (e: any) {
      console.error("Feedback submission failed:", e);
      setStatus("error");
      setErrorMsg(e.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <Show when={props.open}>
      <div class="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
        <div class="modal feedback-dialog">
          <div class="modal-header">
            <h2>Send Feedback</h2>
            <button class="btn btn-ghost btn-sm" onClick={handleClose}>
              <TbOutlineX size={18} />
            </button>
          </div>

          <Show when={status() === "success"} fallback={
            <div class="modal-body">
              {/* Email & Name */}
              <div class="form-group">
                <label>Email <span class="feedback-required">*</span></label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email()}
                  onInput={(e) => setEmail(e.currentTarget.value)}
                />
              </div>
              <div class="form-group">
                <label>Name (optional)</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={fullName()}
                  onInput={(e) => setFullName(e.currentTarget.value)}
                />
              </div>

              {/* Category */}
              <div class="form-group">
                <label>Category</label>
                <div class="feedback-categories">
                  <For each={categories}>
                    {(cat) => (
                      <button
                        class={`feedback-category-btn ${category() === cat.key ? "active" : ""}`}
                        onClick={() => setCategory(cat.key)}
                      >
                        {cat.label}
                      </button>
                    )}
                  </For>
                </div>
              </div>

              {/* Message */}
              <div class="form-group">
                <label>Message <span class="feedback-required">*</span></label>
                <textarea
                  placeholder="Tell us what you think, report a bug, or request a feature..."
                  maxLength={MAX_MESSAGE}
                  rows={5}
                  value={message()}
                  onInput={(e) => setMessage(e.currentTarget.value)}
                />
                <div class={`feedback-char-count ${message().length >= 4500 ? "warning" : ""}`}>
                  {message().length} / {MAX_MESSAGE}
                </div>
              </div>

              {/* Sentiment */}
              <div class="form-group">
                <label>How do you feel?</label>
                <div class="feedback-sentiment">
                  <For each={sentiments}>
                    {(s) => (
                      <button
                        class={`feedback-sentiment-btn ${sentiment() === s.value ? "active" : ""}`}
                        onClick={() => setSentiment(sentiment() === s.value ? null : s.value)}
                        title={s.label}
                      >
                        {s.emoji}
                      </button>
                    )}
                  </For>
                </div>
              </div>

              {/* Error */}
              <Show when={status() === "error"}>
                <div class="feedback-error">{errorMsg()}</div>
              </Show>

              {/* Submit */}
              <div class="modal-footer">
                <button class="btn btn-ghost" onClick={handleClose}>Cancel</button>
                <button
                  class="btn btn-primary"
                  disabled={!canSubmit()}
                  onClick={handleSubmit}
                >
                  {status() === "submitting" ? "Sending..." : "Send Feedback"}
                </button>
              </div>
            </div>
          }>
            {/* Success */}
            <div class="modal-body feedback-success">
              <div class="feedback-success-icon">{"\u2705"}</div>
              <h3>Thank you for your feedback!</h3>
              <p class="text-dim">Your message has been received. If you reported a bug or requested a feature, it will be tracked as a GitHub issue.</p>
              <div class="modal-footer">
                <button class="btn btn-ghost" onClick={handleClose}>Close</button>
                <button class="btn btn-primary" onClick={resetForm}>Send Another</button>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}
