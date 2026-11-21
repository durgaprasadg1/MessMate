"use client";
import { apiFetch } from "@/lib/apiFetch";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ShieldCheck } from "lucide-react";

const cardCls =
  "bg-white border border-slate-100 rounded-[2rem] shadow-[0_2px_24px_-4px_rgba(0,0,0,0.04)] p-6 sm:p-8";
const inputCls =
  "w-full px-4 py-3 rounded-2xl border border-orange-200 bg-orange-50/35 text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-400/35 focus:border-orange-400 transition-all placeholder:text-stone-400";
const primaryBtn =
  "px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold tracking-wide transition-colors disabled:opacity-60";
const ghostBtn =
  "px-5 py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 transition-colors disabled:opacity-60";

/** Two-step verification (TOTP) for admin and owner accounts. */
export default function MfaSettings() {
  const [status, setStatus] = useState(null);
  const [setup, setSetup] = useState(null); // { qr, secret }
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const res = await apiFetch("/api/mfa");
      if (res.ok) setStatus(await res.json());
    } catch {
      /* status stays unknown; the card simply stays hidden */
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const call = async (path, body) => {
    setBusy(true);
    try {
      const res = await apiFetch(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Something went wrong");
        return null;
      }
      return data;
    } catch {
      toast.error("Server issue. Try again later.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const startSetup = async () => {
    const data = await call("/api/mfa/setup");
    if (data) setSetup({ qr: data.qr, secret: data.secret });
  };

  const confirm = async (e) => {
    e.preventDefault();
    const data = await call("/api/mfa/enable", { code });
    if (data) {
      setRecoveryCodes(data.recoveryCodes);
      setSetup(null);
      setCode("");
      toast.success("Two-step verification enabled");
      loadStatus();
    }
  };

  const disable = async (e) => {
    e.preventDefault();
    const data = await call("/api/mfa/disable", { code });
    if (data) {
      setCode("");
      toast.success("Two-step verification disabled");
      loadStatus();
    }
  };

  if (!status || status.unavailable) return null;

  return (
    <div className={cardCls}>
      <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
        <ShieldCheck size={20} className="text-orange-500" />
        <h3 className="text-lg font-black text-slate-800">Two-step verification</h3>
        <span
          className={`ml-auto text-[10px] font-bold uppercase tracking-widest ${status.enabled ? "text-emerald-600" : "text-slate-400"}`}
        >
          {status.enabled ? "On" : "Off"}
        </span>
      </div>

      {recoveryCodes && (
        <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50/50 p-4">
          <p className="text-sm font-bold text-slate-800">Save your recovery codes</p>
          <p className="text-xs text-slate-600 mt-1">
            Each code works once if you lose access to your authenticator app. They will not be shown again.
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm text-slate-800">
            {recoveryCodes.map((c) => (
              <li key={c} className="bg-white border border-slate-100 rounded px-2 py-1">
                {c}
              </li>
            ))}
          </ul>
          <button type="button" className={`${ghostBtn} mt-4`} onClick={() => setRecoveryCodes(null)}>
            I have saved them
          </button>
        </div>
      )}

      {!status.enabled && !setup && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <p className="text-sm text-slate-600 flex-1">
            Add a second step to your login with an authenticator app (Google Authenticator, Authy, Microsoft Authenticator).
          </p>
          <button type="button" className={primaryBtn} onClick={startSetup} disabled={busy}>
            Enable
          </button>
        </div>
      )}

      {!status.enabled && setup && (
        <form onSubmit={confirm} className="space-y-4">
          <p className="text-sm text-slate-600">Scan this QR code with your authenticator app, then enter the 6-digit code.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setup.qr} alt="Scan to add MessMate to your authenticator app" width={180} height={180} className="rounded-xl border border-slate-100" />
          <p className="text-xs text-slate-500">
            Can&apos;t scan? Enter this key manually: <span className="font-mono text-slate-800">{setup.secret}</span>
          </p>
          <input
            className={inputCls}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            placeholder="6-digit code"
            required
          />
          <div className="flex gap-3">
            <button type="submit" className={primaryBtn} disabled={busy}>
              Verify &amp; enable
            </button>
            <button type="button" className={ghostBtn} onClick={() => setSetup(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {status.enabled && (
        <form onSubmit={disable} className="space-y-4">
          <p className="text-sm text-slate-600">
            Recovery codes left: <b>{status.recoveryCodesLeft}</b>. To turn this off, enter a current code (or a recovery code).
          </p>
          <input
            className={inputCls}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="one-time-code"
            maxLength={16}
            placeholder="Authenticator or recovery code"
            required
          />
          <button type="submit" className={ghostBtn} disabled={busy}>
            Disable
          </button>
        </form>
      )}
    </div>
  );
}
