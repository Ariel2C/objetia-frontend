"use client";

import React, { useEffect, useRef, useState } from "react";

interface CurveSegment {
  text: [number, number, number, number, number, number]; // [x1, y1, cx, cy, x2, y2]
  sq: [number, number, number, number, number, number];   // [x1, y1, cx, cy, x2, y2]
}

const shiftX = 6.5;
function p(x1: number, y1: number, cx: number, cy: number, x2: number, y2: number): [number, number, number, number, number, number] {
  return [x1 + shiftX, y1, cx + shiftX, cy, x2 + shiftX, y2];
}
function s(x1: number, y1: number, cx: number, cy: number, x2: number, y2: number): [number, number, number, number, number, number] {
  return [x1, y1, cx, cy, x2, y2];
}

// 4 Cuadrados Huecos exteriores (2 arriba, 2 abajo) - Tamaño 30x30 total (13.5x13.5 c/u con 3px de gap)
const tl_top = s(85, 9, 91.75, 9, 98.5, 9);
const tl_right = s(98.5, 9, 98.5, 15.75, 98.5, 22.5);
const tl_bot = s(98.5, 22.5, 91.75, 22.5, 85, 22.5);
const tl_left = s(85, 22.5, 85, 15.75, 85, 9);

const tr_top = s(101.5, 9, 108.25, 9, 115, 9);
const tr_right = s(115, 9, 115, 15.75, 115, 22.5);
const tr_bot = s(115, 22.5, 108.25, 22.5, 101.5, 22.5);
const tr_left = s(101.5, 22.5, 101.5, 15.75, 101.5, 9);

const bl_top = s(85, 25.5, 91.75, 25.5, 98.5, 25.5);
const bl_right = s(98.5, 25.5, 98.5, 32.25, 98.5, 39);
const bl_bot = s(98.5, 39, 91.75, 39, 85, 39);
const bl_left = s(85, 39, 85, 32.25, 85, 25.5);

const br_top = s(101.5, 25.5, 108.25, 25.5, 115, 25.5);
const br_right = s(115, 25.5, 115, 32.25, 115, 39);
const br_bot = s(115, 39, 108.25, 39, 101.5, 39);
const br_left = s(101.5, 39, 101.5, 32.25, 101.5, 25.5);

// 27 segmentos de curvas bezier cuadráticas (Q)
// Texto un poco más chico, redondeado y grueso, que viaja limpiamente a los bordes de los 4 cuadrados huecos
const MORPH_SEGMENTS: CurveSegment[] = [
  // --- M (Top-Left) ---
  { text: p(35, 32, 35, 24, 35, 16), sq: tl_left },
  { text: p(35, 16, 37.75, 21, 40.5, 26), sq: tl_top },
  { text: p(40.5, 26, 43.25, 21, 46, 16), sq: tl_right },
  { text: p(46, 16, 46, 24, 46, 32), sq: tl_bot },
  // --- I (Top-Left) ---
  { text: p(52, 16, 52, 24, 52, 32), sq: tl_top },

  // --- O (Top-Right - 4 arcos suaves) ---
  { text: p(66.5, 16, 72, 16, 72, 24), sq: tr_top },
  { text: p(72, 24, 72, 32, 66.5, 32), sq: tr_right },
  { text: p(66.5, 32, 61, 32, 61, 24), sq: tr_bot },
  { text: p(61, 24, 61, 16, 66.5, 16), sq: tr_left },

  // --- B (Top-Right) ---
  { text: p(77, 16, 77, 24, 77, 32), sq: tr_left },
  { text: p(77, 16, 86, 16, 86, 20), sq: tr_top },
  { text: p(86, 20, 86, 24, 77, 24), sq: tr_right },
  { text: p(77, 24, 87, 24, 87, 28), sq: tr_right },
  { text: p(87, 28, 87, 32, 77, 32), sq: tr_bot },

  // --- J (Bottom-Left) ---
  { text: p(101, 16, 101, 21, 101, 26), sq: bl_right },
  { text: p(101, 26, 101, 32, 96.5, 32), sq: bl_bot },
  { text: p(96.5, 32, 92, 32, 92, 26), sq: bl_left },

  // --- E (Bottom-Left) ---
  { text: p(106, 16, 106, 24, 106, 32), sq: bl_left },
  { text: p(106, 16, 110.75, 16, 115.5, 16), sq: bl_top },
  { text: p(106, 24, 110, 24, 114, 24), sq: bl_bot },
  { text: p(106, 32, 110.75, 32, 115.5, 32), sq: bl_bot },

  // --- T (Bottom-Right) ---
  { text: p(120.5, 16, 125.75, 16, 131, 16), sq: br_top },
  { text: p(125.75, 16, 125.75, 24, 125.75, 32), sq: br_left },

  // --- I (Bottom-Right) ---
  { text: p(136, 16, 136, 24, 136, 32), sq: br_left },

  // --- A (Bottom-Right) ---
  { text: p(141, 32, 142.5, 24, 146.5, 16), sq: br_bot },
  { text: p(146.5, 16, 150.5, 24, 152, 32), sq: br_right },
  { text: p(143, 26.5, 146.5, 26.5, 150, 26.5), sq: br_top },
];

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export default function MiObjetiaMorph() {
  const [frame, setFrame] = useState({
    t: 0,
    rotation: 0,
    squareOutlineOpacity: 0,
  });

  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const CYCLE = 5600; // 5.6s ciclo completo fluido
    let start: number | null = null;

    const animate = (timestamp: number) => {
      if (start === null) start = timestamp;
      const elapsed = (timestamp - start) % CYCLE;

      let t = 0;
      let rotation = 0;
      let squareOutlineOpacity = 0;

      if (elapsed < 1800) {
        // Fase 1: Reposo como palabra redondeada MI OBJETIA (1.8s)
        t = 0;
        rotation = 0;
        squareOutlineOpacity = 0;
      } else if (elapsed < 3000) {
        // Fase 2: Transformación fluida de trazos hacia los 4 cuadrados huecos (1.2s)
        const p = (elapsed - 1800) / 1200;
        t = easeInOutCubic(p);
        rotation = 0;
        squareOutlineOpacity = Math.max(0, (p - 0.6) / 0.4);
      } else if (elapsed < 4200) {
        // Fase 3: Cuadrado grande (4 cuadrados huecos) en reposo / rotación 2D pura (1.2s)
        t = 1;
        squareOutlineOpacity = 1;
        const p = (elapsed - 3000) / 1200;
        rotation = easeInOutCubic(p) * 90;
      } else if (elapsed < 5400) {
        // Fase 4: Transformación fluida de vuelta hacia las letras redondeadas (1.2s)
        const p = (elapsed - 4200) / 1200;
        t = 1 - easeInOutCubic(p);
        rotation = (1 - easeInOutCubic(Math.min(1, p * 1.3))) * 90;
        squareOutlineOpacity = Math.max(0, 1 - p * 2.5);
      } else {
        // Fase 5: Asentamiento final antes de reiniciar ciclo
        t = 0;
        rotation = 0;
        squareOutlineOpacity = 0;
      }

      setFrame({ t, rotation, squareOutlineOpacity });
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const { t, rotation, squareOutlineOpacity } = frame;

  return (
    <div className="w-full flex items-center justify-center select-none py-1">
      <svg
        viewBox="0 0 200 48"
        className="w-full h-10 overflow-visible"
        shapeRendering="geometricPrecision"
      >
        {/* GRUPO PRINCIPAL: Gira 90° en 2D limpio sobre el centro (100, 24) */}
        <g transform={`rotate(${rotation} 100 24)`}>
          {/* 4 CUADRADOS HUECOS SIN RELLENO (2 ARRIBA, 2 ABAJO - ICONO PANEL DE CONTROL / LAYOUTGRID) */}
          <g opacity={squareOutlineOpacity} stroke="#ffffff" strokeWidth="2.5" fill="none">
            {/* 2 Arriba */}
            <rect x="85" y="9" width="13.5" height="13.5" rx="3" />
            <rect x="101.5" y="9" width="13.5" height="13.5" rx="3" />
            {/* 2 Abajo */}
            <rect x="85" y="25.5" width="13.5" height="13.5" rx="3" />
            <rect x="101.5" y="25.5" width="13.5" height="13.5" rx="3" />
          </g>

          {/* LÍNEAS VECTORIALES REDONDEADAS EN BLANCO PURO (#ffffff) QUE CONVERGEN EN LOS 4 BORDES */}
          <g stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {MORPH_SEGMENTS.map((seg, i) => {
              const x1 = seg.text[0] + (seg.sq[0] - seg.text[0]) * t;
              const y1 = seg.text[1] + (seg.sq[1] - seg.text[1]) * t;
              const cx = seg.text[2] + (seg.sq[2] - seg.text[2]) * t;
              const cy = seg.text[3] + (seg.sq[3] - seg.text[3]) * t;
              const x2 = seg.text[4] + (seg.sq[4] - seg.text[4]) * t;
              const y2 = seg.text[5] + (seg.sq[5] - seg.text[5]) * t;

              const d = `M ${x1.toFixed(2)} ${y1.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;

              return <path key={i} d={d} />;
            })}
          </g>
        </g>
      </svg>
    </div>
  );
}
