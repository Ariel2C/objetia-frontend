"use client";

import React, { useEffect, useRef, useState } from "react";

interface CurveSegment {
  text: [number, number, number, number, number, number]; // [x1, y1, cx, cy, x2, y2]
  sq: [number, number, number, number, number, number];   // [x1, y1, cx, cy, x2, y2]
}

const shiftX = 3.75;
function p(x1: number, y1: number, cx: number, cy: number, x2: number, y2: number): [number, number, number, number, number, number] {
  return [x1 + shiftX, y1, cx + shiftX, cy, x2 + shiftX, y2];
}
function s(x1: number, y1: number, cx: number, cy: number, x2: number, y2: number): [number, number, number, number, number, number] {
  return [x1, y1, cx, cy, x2, y2];
}

// 4 Cuadrados Huecos exteriores (2 arriba, 2 abajo) - Tamaño 29x29 total (13x13 c/u con 3px de gap) centrados en (100, 20)
const tl_top = s(85.5, 5.5, 92, 5.5, 98.5, 5.5);
const tl_right = s(98.5, 5.5, 98.5, 12, 98.5, 18.5);
const tl_bot = s(98.5, 18.5, 92, 18.5, 85.5, 18.5);
const tl_left = s(85.5, 18.5, 85.5, 12, 85.5, 5.5);

const tr_top = s(101.5, 5.5, 108, 5.5, 114.5, 5.5);
const tr_right = s(114.5, 5.5, 114.5, 12, 114.5, 18.5);
const tr_bot = s(114.5, 18.5, 108, 18.5, 101.5, 18.5);
const tr_left = s(101.5, 18.5, 101.5, 12, 101.5, 5.5);

const bl_top = s(85.5, 21.5, 92, 21.5, 98.5, 21.5);
const bl_right = s(98.5, 21.5, 98.5, 28, 98.5, 34.5);
const bl_bot = s(98.5, 34.5, 92, 34.5, 85.5, 34.5);
const bl_left = s(85.5, 34.5, 85.5, 28, 85.5, 21.5);

const br_top = s(101.5, 21.5, 108, 21.5, 114.5, 21.5);
const br_right = s(114.5, 21.5, 114.5, 28, 114.5, 34.5);
const br_bot = s(114.5, 34.5, 108, 34.5, 101.5, 34.5);
const br_left = s(101.5, 34.5, 101.5, 28, 101.5, 21.5);

// 27 segmentos de curvas bezier cuadráticas (Q)
// Más finitas (1.9px) y un poco más chicas para integrarse sin vacíos excesivos
const MORPH_SEGMENTS: CurveSegment[] = [
  // --- M (Top-Left) ---
  { text: p(46, 26.5, 46, 20, 46, 13.5), sq: tl_left },
  { text: p(46, 13.5, 48.25, 17.5, 50.5, 21.5), sq: tl_top },
  { text: p(50.5, 21.5, 52.75, 17.5, 55, 13.5), sq: tl_right },
  { text: p(55, 13.5, 55, 20, 55, 26.5), sq: tl_bot },
  // --- I (Top-Left) ---
  { text: p(60, 13.5, 60, 20, 60, 26.5), sq: tl_top },

  // --- O (Top-Right - 4 arcos suaves) ---
  { text: p(72.75, 13.5, 77.5, 13.5, 77.5, 20), sq: tr_top },
  { text: p(77.5, 20, 77.5, 26.5, 72.75, 26.5), sq: tr_right },
  { text: p(72.75, 26.5, 68, 26.5, 68, 20), sq: tr_bot },
  { text: p(68, 20, 68, 13.5, 72.75, 13.5), sq: tr_left },

  // --- B (Top-Right) ---
  { text: p(82, 13.5, 82, 20, 82, 26.5), sq: tr_left },
  { text: p(82, 13.5, 89.5, 13.5, 89.5, 16.75), sq: tr_top },
  { text: p(89.5, 16.75, 89.5, 20, 82, 20), sq: tr_right },
  { text: p(82, 20, 90.5, 20, 90.5, 23.25), sq: tr_right },
  { text: p(90.5, 23.25, 90.5, 26.5, 82, 26.5), sq: tr_bot },

  // --- J (Bottom-Left) ---
  { text: p(102.5, 13.5, 102.5, 17.5, 102.5, 21.5), sq: bl_right },
  { text: p(102.5, 21.5, 102.5, 26.5, 98.75, 26.5), sq: bl_bot },
  { text: p(98.75, 26.5, 95, 26.5, 95, 21.5), sq: bl_left },

  // --- E (Bottom-Left) ---
  { text: p(107, 13.5, 107, 20, 107, 26.5), sq: bl_left },
  { text: p(107, 13.5, 111, 13.5, 115, 13.5), sq: bl_top },
  { text: p(107, 20, 110.25, 20, 113.5, 20), sq: bl_bot },
  { text: p(107, 26.5, 111, 26.5, 115, 26.5), sq: bl_bot },

  // --- T (Bottom-Right) ---
  { text: p(119, 13.5, 123.5, 13.5, 128, 13.5), sq: br_top },
  { text: p(123.5, 13.5, 123.5, 20, 123.5, 26.5), sq: br_left },

  // --- I (Bottom-Right) ---
  { text: p(132.5, 13.5, 132.5, 20, 132.5, 26.5), sq: br_left },

  // --- A (Bottom-Right) ---
  { text: p(137, 26.5, 138.5, 20, 141.75, 13.5), sq: br_bot },
  { text: p(141.75, 13.5, 145, 20, 146.5, 26.5), sq: br_right },
  { text: p(138.5, 22, 141.75, 22, 145, 22), sq: br_top },
];

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

interface MiObjetiaMorphProps {
  color?: string;
}

export default function MiObjetiaMorph({ color = "#ffffff" }: MiObjetiaMorphProps) {
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
        // Fase 2: Transformación fluida hacia los 4 cuadrados huecos (1.2s)
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
    <div className="w-full flex items-center justify-center select-none">
      <svg
        viewBox="0 0 200 40"
        className="w-full h-8 overflow-visible"
        shapeRendering="geometricPrecision"
      >
        {/* GRUPO PRINCIPAL: Gira 90° en 2D limpio sobre el centro (100, 20) */}
        <g transform={`rotate(${rotation} 100 20)`}>
          {/* 4 CUADRADOS HUECOS SIN RELLENO (2 ARRIBA, 2 ABAJO) */}
          <g opacity={squareOutlineOpacity} stroke={color} strokeWidth="1.9" fill="none">
            {/* 2 Arriba */}
            <rect x="85.5" y="5.5" width="13" height="13" rx="2.5" />
            <rect x="101.5" y="5.5" width="13" height="13" rx="2.5" />
            {/* 2 Abajo */}
            <rect x="85.5" y="21.5" width="13" height="13" rx="2.5" />
            <rect x="101.5" y="21.5" width="13" height="13" rx="2.5" />
          </g>

          {/* LÍNEAS VECTORIALES FINAS Y REDONDEADAS QUE CONVERGEN EN LOS 4 BORDES */}
          <g stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none">
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
