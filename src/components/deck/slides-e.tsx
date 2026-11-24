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

type Mode = "series" | "parallel";

/** Brightness of each identical bulb: series → P/n², parallel → P. */
export function bulbLevels(mode: Mode, broken: boolean[]): number[] {
  const n = broken.length;
  if (mode === "parallel") return broken.map((b) => (b ? 0 : 1));
  if (broken.some(Boolean)) return broken.map(() => 0);
  return broken.map(() => 1 / (n * n));
}

/* Interactive game: build a series or parallel circuit and unscrew bulbs */
export function BulbGameSlide() {
  const [mode, setMode] = useState<Mode>("series");
  const [broken, setBroken] = useState<boolean[]>([false, false, false]);
  const levels = bulbLevels(mode, broken);
  const total = Math.round(levels.reduce((a, b) => a + b, 0) * 100);
  const btn = (active: boolean) =>
    cn("rounded-full border px-8 py-4 text-[28px] font-bold transition-colors",
      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/40 text-foreground hover:bg-secondary");
  return (
    <SlideLayout>
      <div className="absolute inset-x-[110px] top-[80px]">
        <Kicker tone="led"><Gamepad2 className="h-6 w-6" /> Խաղ</Kicker>
        <h2 className="slide-title a-rise mt-5" style={delay(120)}>Միացրու <span className="text-gradient-energy">լամպերը</span></h2>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button className={btn(mode === "series")} onClick={() => setMode("series")}>Հաջորդաբար</button>
          <button className={btn(mode === "parallel")} onClick={() => setMode("parallel")}>Զուգահեռ</button>
          <span className="mx-4 text-[26px] text-muted-foreground">Լամպեր՝</span>
          {[2, 3, 4].map((n) => (
            <button key={n} className={btn(broken.length === n)} onClick={() => setBroken(Array(n).fill(false))}>{n}</button>
          ))}
          <button className={btn(false)} onClick={() => setBroken(broken.map(() => false))} aria-label="Վերականգնել">
            <RotateCcw className="h-7 w-7" />
          </button>
        </div>

        <div className="glass-card mt-10 rounded-[36px] px-12 py-8">
          {mode === "series" ? (
            <div className="flex items-end justify-center gap-0">
              {broken.map((b, i) => (
                <div key={i} className="flex items-end">
                  <div className="mb-[30px] h-[8px] w-[90px] rounded-full bg-energy" />
                  <button onClick={() => setBroken(broken.map((x, j) => (j === i ? !x : x)))} aria-label={`Լամպ ${i + 1}`}>
                    <Bulb level={levels[i] ?? 0} broken={b} />
                  </button>
                </div>
              ))}
              <div className="mb-[30px] h-[8px] w-[90px] rounded-full bg-energy" />
            </div>
          ) : (
            <div className="flex items-stretch justify-center">
              <div className="w-[8px] rounded-full bg-energy" />
              <div className="flex flex-col gap-4">
                {broken.map((b, i) => (
                  <div key={i} className="flex items-center">
                    <div className="h-[8px] w-[160px] bg-energy" />
                    <button onClick={() => setBroken(broken.map((x, j) => (j === i ? !x : x)))} aria-label={`Լամպ ${i + 1}`} className="-my-2">
                      <Bulb level={levels[i] ?? 0} broken={b} size={broken.length > 3 ? 70 : 90} />
                    </button>
                    <div className="h-[8px] w-[160px] bg-energy" />
                  </div>
                ))}
              </div>
              <div className="w-[8px] rounded-full bg-energy" />
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between text-[28px]">
          <span className="flex items-center gap-3 text-muted-foreground">
            <Lightbulb className="h-8 w-8 text-led" /> Սեղմիր լամպին՝ այն պտուտակից հանելու համար
          </span>
          <span>
            Ընդհանուր լույս՝ <b className="slide-num text-primary">{total}%</b>
            <span className="text-muted-foreground"> (1 լամպի համեմատ)</span>
          </span>
        </div>
      </div>
    </SlideLayout>
  );
}
