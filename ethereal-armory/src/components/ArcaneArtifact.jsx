import { useEffect, useRef } from "react";

const fragments = ["north", "east", "south", "west", "far"];

export default function ArcaneArtifact() {
  const stageRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  function handlePointerMove(event) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const stage = stageRef.current;
    if (!stage) return;
    const bounds = stage.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      stage.style.setProperty("--pointer-x", `${x * 4}deg`);
      stage.style.setProperty("--pointer-y", `${y * -3}deg`);
    });
  }

  function resetPointer() {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty("--pointer-x", "0deg");
    stage.style.setProperty("--pointer-y", "0deg");
  }

  return (
    <div
      className="artifact-stage"
      ref={stageRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      role="img"
      aria-label="An original rotating voidglass reliquary surrounded by orbiting arcane fragments"
    >
      <div className="artifact-sigil" aria-hidden="true" />
      <div className="artifact-perspective" aria-hidden="true">
        <div className="artifact-assembly">
          <span className="artifact-halo artifact-halo-outer" />
          <span className="artifact-halo artifact-halo-inner" />
          <svg className="artifact-relic" viewBox="0 0 240 420" focusable="false">
            <defs>
              <linearGradient id="relic-metal" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f1d69a" />
                <stop offset=".28" stopColor="#6c4d27" />
                <stop offset=".62" stopColor="#d2ad68" />
                <stop offset="1" stopColor="#3d2a1a" />
              </linearGradient>
              <linearGradient id="relic-glass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#e4c9ef" stopOpacity=".92" />
                <stop offset=".42" stopColor="#76508c" stopOpacity=".7" />
                <stop offset="1" stopColor="#171522" stopOpacity=".96" />
              </linearGradient>
            </defs>
            <path d="M120 18 202 128 165 318 120 402 75 318 38 128Z" fill="url(#relic-glass)" stroke="url(#relic-metal)" strokeWidth="5" />
            <path d="m120 18 25 111-25 273-25-273Z" fill="#f0d4f5" fillOpacity=".15" stroke="#efd08f" strokeOpacity=".3" />
            <path d="M38 128 120 166l82-38M75 318l45-40 45 40" fill="none" stroke="#f2d898" strokeOpacity=".64" strokeWidth="3" />
            <path d="m58 109 62 19 62-19M83 338l37-24 37 24" fill="none" stroke="#291c31" strokeWidth="13" />
            <path d="M120 72v58M120 278v76M70 129l50 37 50-37" fill="none" stroke="#f4e8c7" strokeOpacity=".4" strokeWidth="2" />
          </svg>
          {fragments.map((position, index) => <span className={`artifact-fragment is-${position}`} key={position} style={{ "--fragment-index": index }} />)}
        </div>
      </div>
      <span className="artifact-ground" aria-hidden="true" />
    </div>
  );
}
