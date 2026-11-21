"use client";
import { scorePassword, PASSWORD_MIN_LENGTH } from "@/lib/passwordRules";

const LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const COLORS = ["bg-stone-200", "bg-rose-400", "bg-amber-400", "bg-orange-400", "bg-emerald-500"];

/** Small strength meter + requirement hint. Uses only the app's existing palette. */
export default function PasswordStrength({ password }) {
  const score = scorePassword(password);
  return (
    <div className="mt-2 px-1" aria-live="polite">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? COLORS[score] : "bg-stone-200"}`} />
        ))}
      </div>
      <p className="mt-1 text-[11px] text-stone-500">
        {password ? `${LABELS[score]} · ` : ""}
        Use {PASSWORD_MIN_LENGTH}+ characters with upper &amp; lower case letters and a special character.
      </p>
    </div>
  );
}
