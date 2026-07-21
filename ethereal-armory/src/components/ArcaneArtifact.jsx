import { useEffect, useRef } from "react";

const fragmentOrbits = ["north", "east", "south", "west", "far"];
const crystalFaces = ["front", "right", "back", "left"];

export default function ArcaneArtifact() {
  const stageRef = useRef(null);
  const frameRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const handleVisibility = () => {
      stage.dataset.paused = String(document.visibilityState === "hidden");
    };
    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelAnimationFrame(frameRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  function handlePointerMove(event) {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const stage = stageRef.current;
    if (!stage) return;
    const bounds = stage.getBoundingClientRect();
    pointerRef.current = {
      x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
      y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
    };
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      stage.style.setProperty("--pointer-x", `${pointerRef.current.x * 4}deg`);
      stage.style.setProperty("--pointer-y", `${pointerRef.current.y * -3}deg`);
    });
  }

  function resetPointer() {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty("--pointer-x", "0deg");
    stage.style.setProperty("--pointer-y", "0deg");
  }

  return (
    <div
      className="artifact-stage artifact-advanced"
      ref={stageRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      role="img"
      aria-label="A dimensional Voidglass Reliquary with a faceted crystal, engraved rings, and orbiting fragments"
      data-paused="false"
    >
      <div className="artifact-sigil" aria-hidden="true" />
      <div className="artifact-perspective" aria-hidden="true">
        <div className="artifact-assembly">
          <div className="artifact-ring artifact-ring-back is-outer"><span /></div>
          <div className="artifact-ring artifact-ring-back is-canted"><span /></div>

          {fragmentOrbits.map((orbit, index) => (
            <span className={`artifact-orbit is-${orbit}`} key={orbit} style={{ "--orbit-index": index }}>
              <span className="artifact-fragment" />
            </span>
          ))}

          <div className="artifact-frame">
            <span className="artifact-frame-cap is-top" />
            <span className="artifact-frame-rail is-left" />
            <span className="artifact-frame-rail is-right" />
            <span className="artifact-frame-cap is-bottom" />
          </div>

          <div className="artifact-crystal">
            <span className="artifact-core" />
            {crystalFaces.map((face) => <span className={`artifact-crystal-face is-${face}`} key={face} />)}
            <span className="artifact-crystal-highlight" />
          </div>

          <div className="artifact-ring artifact-ring-front is-outer"><span /></div>
          <div className="artifact-ring artifact-ring-front is-canted"><span /></div>
          <div className="artifact-ring is-inner"><span /></div>
        </div>
      </div>
      <span className="artifact-ground" aria-hidden="true" />
    </div>
  );
}
