"use client";

import React, { useEffect, useRef, useState } from "react";

interface CurveSegment {
  text: [number, number, number, number, number, number]; // [x1, y1, cx, cy, x2, y2]
  sq: [number, number, number, number, number, number];   // [x1, y1, cx, cy, x2, y2]
}

const shiftX = 3.5;
function p(x1: number, y1: number, cx: number, cy: number, x2: number, y2: number): [number, number, number, number, number, number] {
  return [x1 + shiftX, y1, cx + shiftX, cy, x2 + shiftX, y2];
}
function s(x1: number, y1: number, cx: number, cy: number, x2: number, y2: number): [number, number, number, number, number, number] {
  return [x1, y1, cx, cy, x2, y2];
}

// 27 segmentos de curvas bezier cuadráticas (Q)
// Letras gruesas, con curvas redondeadas orgánicas y todo en blanco puro (#ffffff)
const MORPH_SEGMENTS: CurveSegment[] = [
  // --- LETRA 'M' (Cuadrante Superior Izquierdo) ---
  { text: p(24, 34, 24, 24, 24, 14), sq: s(85, 22.5, 85, 16.25, 85, 9) },           // M tallo izq -> borde izq TL
  { text: p(24, 14, 27.5, 20, 31, 26), sq: s(85, 9, 91.75, 9, 98.5, 9) },            // M diagonal 1 -> borde sup TL
  { text: p(31, 26, 34.5, 20, 38, 14), sq: s(98.5, 9, 98.5, 16.25, 98.5, 22.5) },   // M diagonal 2 -> borde der TL
  { text: p(38, 14, 38, 24, 38, 34), sq: s(98.5, 22.5, 91.75, 22.5, 85, 22.5) },   // M tallo der -> borde inf TL

  // --- LETRA 'I' ---
  { text: p(46, 14, 46, 24, 46, 34), sq: s(88.5, 15.75, 91.75, 15.75, 95, 15.75) }, // I -> detalle interior TL

  // --- LETRA 'O' (Cuadrante Superior Derecho - 4 arcos curvos suaves) ---
  { text: p(65, 14, 72, 14, 72, 24), sq: s(101.5, 9, 108.25, 9, 115, 9) },           // O curva sup-der -> borde sup TR
  { text: p(72, 24, 72, 34, 65, 34), sq: s(115, 9, 115, 16.25, 115, 22.5) },         // O curva inf-der -> borde der TR
  { text: p(65, 34, 58, 34, 58, 24), sq: s(115, 22.5, 108.25, 22.5, 101.5, 22.5) },  // O curva inf-izq -> borde inf TR
  { text: p(58, 24, 58, 14, 65, 14), sq: s(101.5, 22.5, 101.5, 16.25, 101.5, 9) },  // O curva sup-izq -> borde izq TR

  // --- LETRA 'B' (Curvas redondeadas dobles) ---
  { text: p(78, 14, 78, 24, 78, 34), sq: s(105, 15.75, 108.25, 15.75, 111.5, 15.75) }, // B espina -> detalle interior TR
  { text: p(78, 14, 88, 14, 88, 19), sq: s(100, 9, 100, 15.75, 100, 22.5) },            // B lóbulo sup arco 1 -> divisor vert sup
  { text: p(88, 19, 88, 24, 78, 24), sq: s(85, 24, 91.75, 24, 98.5, 24) },              // B lóbulo sup arco 2 -> divisor horiz izq
  { text: p(78, 24, 89, 24, 89, 29), sq: s(85, 39, 85, 32.25, 85, 25.5) },              // B lóbulo inf arco 1 -> borde izq BL
  { text: p(89, 29, 89, 34, 78, 34), sq: s(85, 25.5, 91.75, 25.5, 98.5, 25.5) },        // B lóbulo inf arco 2 -> borde sup BL

  // --- LETRA 'J' (Curva inferior redondeada) ---
  { text: p(107, 14, 107, 20, 107, 26), sq: s(98.5, 25.5, 98.5, 32.25, 98.5, 39) },   // J tallo -> borde der BL
  { text: p(107, 26, 107, 34, 101.5, 34), sq: s(98.5, 39, 91.75, 39, 85, 39) },        // J arco der -> borde inf BL
  { text: p(101.5, 34, 96, 34, 96, 26), sq: s(88.5, 32.25, 91.75, 32.25, 95, 32.25) },// J arco izq -> detalle interior BL

  // --- LETRA 'E' ---
  { text: p(113, 14, 113, 24, 113, 34), sq: s(100, 25.5, 100, 32.25, 100, 39) },       // E espina -> divisor vert inf
  { text: p(113, 14, 119, 14, 125, 14), sq: s(101.5, 24, 108.25, 24, 115, 24) },        // E sup -> divisor horiz der
  { text: p(113, 24, 118, 24, 123, 24), sq: s(105, 32.25, 108.25, 32.25, 111.5, 32.25) },// E medio -> detalle interior BR
  { text: p(113, 34, 119, 34, 125, 34), sq: s(101.5, 25.5, 108.25, 25.5, 115, 25.5) },  // E inf -> borde sup BR

  // --- LETRA 'T' ---
  { text: p(130, 14, 136.5, 14, 143, 14), sq: s(115, 25.5, 115, 32.25, 115, 39) },     // T barra sup -> borde der BR
  { text: p(136.5, 14, 136.5, 24, 136.5, 34), sq: s(115, 39, 108.25, 39, 101.5, 39) }, // T tallo -> borde inf BR

  // --- LETRA 'I' ---
  { text: p(149, 14, 149, 24, 149, 34), sq: s(101.5, 39, 101.5, 32.25, 101.5, 25.5) },  // I tallo -> borde izq BR

  // --- LETRA 'A' (Cúspide y patas curvadas suaves) ---
  { text: p(155, 34, 157, 24, 162, 14), sq: s(87.5, 11.5, 91.75, 15.75, 96, 20) },      // A pata izq -> acento TL
  { text: p(162, 14, 167, 24, 169, 34), sq: s(104, 11.5, 108.25, 15.75, 112.5, 20) },   // A pata der -> acento TR
  { text: p(157.5, 27, 162, 27, 166.5, 27), sq: s(104, 28, 108.25, 32.25, 112.5, 36.5) },// A travesaño -> acento BR
];

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export default function MiObjetiaMorph() {
  const [frame, setFrame] = useState({
    t: 0,
    rotation: 0,
    squareFillOpacity: 0,
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
      let squareFillOpacity = 0;

      if (elapsed < 1800) {
        // Fase 1: Reposo como palabra redondeada MI OBJETIA (1.8s)
        t = 0;
        rotation = 0;
        squareFillOpacity = 0;
      } else if (elapsed < 3000) {
        // Fase 2: Transformación fluida de trazos hacia el cuadrado grande (1.2s)
        const p = (elapsed - 1800) / 1200;
        t = easeInOutCubic(p);
        rotation = 0;
        squareFillOpacity = Math.max(0, (p - 0.7) / 0.3);
      } else if (elapsed < 4200) {
        // Fase 3: Cuadrado grande de 4 cuadrados en reposo / rotación 2D pura (1.2s)
        t = 1;
        squareFillOpacity = 1;
        const p = (elapsed - 3000) / 1200;
        rotation = easeInOutCubic(p) * 90;
      } else if (elapsed < 5400) {
        // Fase 4: Transformación fluida de vuelta hacia las letras redondeadas (1.2s)
        const p = (elapsed - 4200) / 1200;
        t = 1 - easeInOutCubic(p);
        rotation = (1 - easeInOutCubic(Math.min(1, p * 1.3))) * 90;
        squareFillOpacity = Math.max(0, 1 - p * 3);
      } else {
        // Fase 5: Asentamiento final antes de reiniciar ciclo
        t = 0;
        rotation = 0;
        squareFillOpacity = 0;
      }

      setFrame({ t, rotation, squareFillOpacity });
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const { t, rotation, squareFillOpacity } = frame;

  return (
    <div className="w-full flex items-center justify-center select-none py-1">
      <svg
        viewBox="0 0 200 48"
        className="w-full h-10 overflow-visible"
        shapeRendering="geometricPrecision"
      >
        {/* GRUPO PRINCIPAL: Gira 90° en 2D limpio sobre el centro (100, 24) */}
        <g transform={`rotate(${rotation} 100 24)`}>
          {/* FONDOS BLANCOS 2D DE LOS 4 CUADRADOS (Se revelan con suavidad al ensamblarse) */}
          <g opacity={squareFillOpacity}>
            {/* Cuadrante 1: Top-Left */}
            <rect x="85" y="9" width="13.5" height="13.5" rx="3" fill="#ffffff" />
            {/* Cuadrante 2: Top-Right */}
            <rect x="101.5" y="9" width="13.5" height="13.5" rx="3" fill="#ffffff" />
            {/* Cuadrante 3: Bottom-Left */}
            <rect x="85" y="25.5" width="13.5" height="13.5" rx="3" fill="#ffffff" />
            {/* Cuadrante 4: Bottom-Right */}
            <rect x="101.5" y="25.5" width="13.5" height="13.5" rx="3" fill="#ffffff" />
          </g>

          {/* LÍNEAS VECTORIALES GRUESAS Y REDONDEADAS EN BLANCO PURO (#ffffff) */}
          <g stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
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
