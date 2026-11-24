import { useState } from "react";
import { Cable, Gamepad2, Lightbulb, RotateCcw } from "lucide-react";
import { Kicker, SlideLayout, delay } from "./SlideLayout";
import { cn } from "@/lib/utils";

/** Bulb drawing; `level` 0..1 is its brightness (P/P_nominal). */
function Bulb({ level, broken = false, size = 120 }: { level: number; broken?: boolean; size?: number }) {
  return (
    <svg width={size} height={size * 1.35} viewBox="0 0 100 135" aria-hidden>
      <circle cx="50" cy="45" r="44" className="fill-led transition-opacity duration-500" style={{ opacity: broken ? 0 : level * 0.35 }} />
      <path d="M50 8a34 34 0 0 0-20 61c5 4 7 9 7 15h26c0-6 2-11 7-15A34 34 0 0 0 50 8z"
        className={cn("stroke-foreground/70 transition-colors duration-500", level > 0 && !broken ? "fill-led" : "fill-secondary")}
        style={{ fillOpacity: broken ? 0.3 : 0.25 + level * 0.75 }} strokeWidth="3" />
      {broken ? (
        <path d="M38 40l24 24M62 40L38 64" className="stroke-destructive" strokeWidth="6" strokeLinecap="round" />
      ) : (
        <path d="M40 70l5-22 5 12 5-12 5 22" fill="none" className="stroke-foreground/60" strokeWidth="3" />
      )}
      <rect x="36" y="86" width="28" height="10" rx="3" className="fill-muted-foreground" />
      <rect x="38" y="98" width="24" height="10" rx="3" className="fill-muted-foreground" />
      <rect x="43" y="110" width="14" height="8" rx="3" className="fill-foreground/60" />
    </svg>
  );
}

function CompareCard({ title, rows, tone, d }: { title: string; rows: string[]; tone: "primary" | "led"; d: number }) {
  return (
    <div className="glass-card a-rise rounded-[32px] p-10" style={delay(d)}>
      <h3 className={cn("text-[44px] font-extrabold", tone === "primary" ? "text-primary" : "text-led")}>{title}</h3>
      <ul className="mt-6 space-y-4 text-[28px] leading-snug">
        {rows.map((r) => (
          <li key={r} className="flex gap-4"><span className={tone === "primary" ? "text-primary" : "text-led"}>●</span><span>{r}</span></li>
        ))}
      </ul>
    </div>
  );
}

/* Series vs parallel connections — theory */
export function CircuitsSlide() {
  return (
    <SlideLayout>
      <div className="absolute inset-x-[110px] top-[90px]">
        <Kicker><Cable className="h-6 w-6" /> Էլեկտրական շղթաներ</Kicker>
        <h2 className="slide-title a-rise mt-6" style={delay(120)}>
          Հաջորդաբար և <span className="text-gradient-energy">զուգահեռ</span> միացում
        </h2>
        <div className="mt-12 grid grid-cols-2 gap-10">
          <CompareCard d={250} tone="primary" title="Հաջորդաբար" rows={[
            "Հոսանքը նույնն է բոլոր սարքերում՝ I = I₁ = I₂",
            "Լարումը բաժանվում է՝ U = U₁ + U₂",
            "Դիմադրությունը գումարվում է՝ R = R₁ + R₂",
            "Մեկ լամպը այրվի՝ բոլորը կմարեն",
            "Օրինակ՝ տոնածառի հին գիրլյանդա",
          ]} />
          <CompareCard d={400} tone="led" title="Զուգահեռ" rows={[
            "Լարումը նույնն է բոլոր սարքերում՝ U = U₁ = U₂",
            "Հոսանքը բաժանվում է՝ I = I₁ + I₂",
            "1/R = 1/R₁ + 1/R₂",
            "Յուրաքանչյուր սարք աշխատում է առանձին",
            "Օրինակ՝ տան վարդակներն ու լամպերը",
          ]} />
        </div>
      </div>
    </SlideLayout>
  );
}

export type Mode = "series" | "parallel" | "mixed";
export const SOURCE_U = 12; // V
export const BULB_R = 6; // Ω, each bulb: 12 V → 2 A, 24 W nominal
const P_NOM = (SOURCE_U * SOURCE_U) / BULB_R;

export type BulbState = { u: number; i: number; p: number };
export type Circuit = { r: number; i: number; bulbs: BulbState[] };

const off = (n: number): Circuit => ({ r: Infinity, i: 0, bulbs: Array.from({ length: n }, () => ({ u: 0, i: 0, p: 0 })) });
const st = (i: number): BulbState => ({ u: i * BULB_R, i, p: i * i * BULB_R });

/** Ohm's law for identical bulbs; a removed bulb is an open circuit. Mixed: bulb 1 in series with the others in parallel. */
export function solveCircuit(mode: Mode, broken: boolean[], U = SOURCE_U): Circuit {
  const n = broken.length;
  if (mode === "series") {
    if (broken.some(Boolean)) return off(n);
    const r = n * BULB_R, i = U / r;
    return { r, i, bulbs: broken.map(() => st(i)) };
  }
  if (mode === "parallel") {
    const k = broken.filter((b) => !b).length;
    if (!k) return off(n);
    const i1 = U / BULB_R;
    return { r: BULB_R / k, i: i1 * k, bulbs: broken.map((b) => st(b ? 0 : i1)) };
  }
  const k = broken.slice(1).filter((b) => !b).length;
  if (broken[0] || !k) return off(n);
  const r = BULB_R + BULB_R / k, i = U / r;
  return { r, i, bulbs: broken.map((b, j) => st(j === 0 ? i : b ? 0 : i / k)) };
}

const fmt = (x: number, d = 2) => (Number.isFinite(x) ? String(+x.toFixed(d)) : "∞");

function Wire({ v = false, len }: { v?: boolean; len: number }) {
  return <div className="rounded-full bg-energy" style={v ? { width: 8, height: len } : { height: 8, width: len }} />;
}

function BulbCell({ idx, s, broken, onToggle, size }: { idx: number; s: BulbState; broken: boolean; onToggle: () => void; size: number }) {
  return (
    <button onClick={onToggle} aria-label={`Լամպ ${idx + 1}`} className="flex items-center gap-3">
      <Bulb level={Math.min(1, s.p / P_NOM)} broken={broken} size={size} />
      <div className="slide-num w-[150px] text-left text-[22px] leading-tight">
        <div className="font-bold text-led">L{idx + 1}</div>
        <div>U = {fmt(s.u)} Վ</div>
        <div>I = {fmt(s.i)} Ա</div>
        <div>P = {fmt(s.p, 1)} Վտ</div>
      </div>
    </button>
  );
}

function Battery() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2">
        <div className="h-[90px] w-[10px] rounded bg-foreground" />
        <div className="h-[50px] w-[10px] rounded bg-foreground/70" />
      </div>
      <div className="slide-num mt-2 text-[24px] font-bold">{SOURCE_U} Վ</div>
    </div>
  );
}

function ParallelGroup({ ids, c, broken, toggle, size }: { ids: number[]; c: Circuit; broken: boolean[]; toggle: (i: number) => void; size: number }) {
  return (
    <div className="flex items-stretch">
      <Wire v len={0} />
      <div className="flex flex-col justify-center gap-3 border-x-[8px] border-primary px-0 py-1">
        {ids.map((i) => (
          <div key={i} className="flex items-center">
            <Wire len={40} />
            <BulbCell idx={i} s={c.bulbs[i]!} broken={!!broken[i]} onToggle={() => toggle(i)} size={size} />
            <Wire len={20} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* Interactive circuit lab: series, parallel or mixed, with real U, I, P per bulb */
export function BulbGameSlide() {
  const [mode, setMode] = useState<Mode>("series");
  const [broken, setBroken] = useState<boolean[]>([false, false, false]);
  const c = solveCircuit(mode, broken);
  const toggle = (i: number) => setBroken(broken.map((x, j) => (j === i ? !x : x)));
  const choose = (m: Mode) => { setMode(m); if (m === "mixed" && broken.length < 3) setBroken([false, false, false]); };
  const btn = (active: boolean) =>
    cn("rounded-full border px-7 py-3 text-[26px] font-bold transition-colors",
      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/40 text-foreground hover:bg-secondary");
  const ids = broken.map((_, i) => i);
  const size = mode !== "series" && broken.length > 3 ? 56 : 70;
  const totalP = c.bulbs.reduce((a, b) => a + b.p, 0);
  return (
    <SlideLayout>
      <div className="absolute inset-x-[100px] top-[70px]">
        <Kicker tone="led"><Gamepad2 className="h-6 w-6" /> Լաբորատորիա</Kicker>
        <h2 className="slide-title a-rise mt-4" style={delay(120)}>Հավաքիր <span className="text-gradient-energy">շղթան</span></h2>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button className={btn(mode === "series")} onClick={() => choose("series")}>Հաջորդաբար</button>
          <button className={btn(mode === "parallel")} onClick={() => choose("parallel")}>Զուգահեռ</button>
          <button className={btn(mode === "mixed")} onClick={() => choose("mixed")}>Խառը</button>
          <span className="mx-3 text-[24px] text-muted-foreground">Լամպեր՝</span>
          {[2, 3, 4].map((n) => (
            <button key={n} disabled={mode === "mixed" && n < 3} className={cn(btn(broken.length === n), "disabled:opacity-30")} onClick={() => setBroken(Array(n).fill(false))}>{n}</button>
          ))}
          <button className={btn(false)} onClick={() => setBroken(broken.map(() => false))} aria-label="Վերականգնել"><RotateCcw className="h-7 w-7" /></button>
        </div>

        <div className="glass-card mt-6 flex h-[460px] items-center justify-center gap-0 rounded-[36px] px-10">
          <Battery />
          <Wire len={50} />
          {mode === "series" && ids.map((i) => (
            <div key={i} className="flex items-center">
              <BulbCell idx={i} s={c.bulbs[i]!} broken={!!broken[i]} onToggle={() => toggle(i)} size={size} />
              <Wire len={30} />
            </div>
          ))}
          {mode === "parallel" && <ParallelGroup ids={ids} c={c} broken={broken} toggle={toggle} size={size} />}
          {mode === "mixed" && (
            <>
              <BulbCell idx={0} s={c.bulbs[0]!} broken={!!broken[0]} onToggle={() => toggle(0)} size={size} />
              <Wire len={30} />
              <ParallelGroup ids={ids.slice(1)} c={c} broken={broken} toggle={toggle} size={size} />
            </>
          )}
          <Wire len={50} />
          <span className="text-[26px] text-muted-foreground">↩</span>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-6 text-[26px]">
          {[["R ընդհ.", `${fmt(c.r)} Օմ`], ["I ընդհ.", `${fmt(c.i)} Ա`], ["P ընդհ.", `${fmt(totalP, 1)} Վտ`], ["Մեկ լամպ", `${BULB_R} Օմ`]].map(([k, v]) => (
            <div key={k} className="glass-card rounded-[20px] px-6 py-3">
              <div className="text-muted-foreground">{k}</div>
              <div className="slide-num font-bold text-primary">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3 text-[24px] text-muted-foreground">
          <Lightbulb className="h-7 w-7 text-led" /> Սեղմիր լամպին՝ հանելու կամ նորից պտուտակելու համար
        </div>
      </div>
    </SlideLayout>
  );
}
