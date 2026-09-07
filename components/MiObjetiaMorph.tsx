"use client";

import React, { useEffect, useRef, useState } from "react";

interface LineDef {
  text: [number, number, number, number];
  sq: [number, number, number, number];
  color: string;
}

// 26 líneas vectoriales exactas que dibujan "M I   O B J E T I A"
// y se transforman fluidamente en el cuadrado grande de 4 cuadrados pequeños
const MORPH_LINES: LineDef[] = [
  // --- LETRA 'M' (Cuadrante Superior Izquierdo) ---
  { text: [30, 33, 30, 15], sq: [81, 22.5, 81, 10], color: "#87a9ff" },       // M tallo izq -> borde izq TL
  { text: [30, 15, 36, 25], sq: [81, 10, 93.5, 10], color: "#87a9ff" },       // M diagonal 1 -> borde sup TL
  { text: [36, 25, 42, 15], sq: [93.5, 10, 93.5, 22.5], color: "#87a9ff" },   // M diagonal 2 -> borde der TL
  { text: [42, 15, 42, 33], sq: [93.5, 22.5, 81, 22.5], color: "#87a9ff" },   // M tallo der -> borde inf TL
  // --- LETRA 'I' ---
  { text: [48, 15, 48, 33], sq: [84.5, 16.25, 90, 16.25], color: "#87a9ff" }, // I -> detalle interior TL

  // --- LETRA 'O' (Cuadrante Superior Derecho) ---
  { text: [58, 15, 70, 15], sq: [96.5, 10, 109, 10], color: "#ffffff" },       // O sup -> borde sup TR
  { text: [70, 15, 70, 33], sq: [109, 10, 109, 22.5], color: "#ffffff" },      // O der -> borde der TR
  { text: [70, 33, 58, 33], sq: [109, 22.5, 96.5, 22.5], color: "#ffffff" },   // O inf -> borde inf TR
  { text: [58, 33, 58, 15], sq: [96.5, 22.5, 96.5, 10], color: "#ffffff" },   // O izq -> borde izq TR

  // --- LETRA 'B' ---
  { text: [76, 15, 76, 33], sq: [100, 16.25, 105.5, 16.25], color: "#ffffff" },// B espina -> detalle interior TR
  { text: [76, 15, 87, 19], sq: [95, 10, 95, 22.5], color: "#ffffff" },        // B barra sup -> divisor central sup
  { text: [76, 24, 86, 24], sq: [87.25, 12, 87.25, 20.5], color: "#87a9ff" },  // B barra media -> acento TL
  { text: [76, 33, 87, 29], sq: [102.75, 12, 102.75, 20.5], color: "#ffffff" },// B barra inf -> acento TR

  // --- LETRA 'J' (Cuadrante Inferior Izquierdo) ---
  { text: [102, 15, 102, 33], sq: [93.5, 25.5, 93.5, 38], color: "#ffffff" },  // J espina -> borde der BL
  { text: [102, 33, 93, 33], sq: [81, 24, 93.5, 24], color: "#ffffff" },       // J base -> divisor horizontal izq
  { text: [93, 33, 93, 27], sq: [95, 25.5, 95, 38], color: "#ffffff" },        // J gancho -> divisor central inf

  // --- LETRA 'E' ---
  { text: [108, 15, 108, 33], sq: [81, 38, 81, 25.5], color: "#ffffff" },      // E espina -> borde izq BL
  { text: [108, 15, 118, 15], sq: [81, 25.5, 93.5, 25.5], color: "#ffffff" },  // E sup -> borde sup BL
  { text: [108, 24, 116, 24], sq: [84.5, 31.75, 90, 31.75], color: "#ffffff" },// E mid -> detalle interior BL
  { text: [108, 33, 118, 33], sq: [93.5, 38, 81, 38], color: "#ffffff" },      // E inf -> borde inf BL

  // --- LETRA 'T' (Cuadrante Inferior Derecho) ---
  { text: [124, 15, 136, 15], sq: [96.5, 25.5, 109, 25.5], color: "#ffffff" }, // T barra -> borde sup BR
  { text: [130, 15, 130, 33], sq: [96.5, 38, 96.5, 25.5], color: "#ffffff" }, // T tallo -> borde izq BR

  // --- LETRA 'I' ---
  { text: [142, 15, 142, 33], sq: [100, 31.75, 105.5, 31.75], color: "#87a9ff" }, // I -> detalle interior BR

  // --- LETRA 'A' ---
  { text: [148, 33, 154, 15], sq: [109, 38, 96.5, 38], color: "#87a9ff" },     // A pierna izq -> borde inf BR
  { text: [154, 15, 160, 33], sq: [109, 25.5, 109, 38], color: "#87a9ff" },    // A pierna der -> borde der BR
  { text: [150, 26, 158, 26], sq: [96.5, 24, 109, 24], color: "#87a9ff" },     // A travesaño -> divisor horizontal der
];

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export default function MiObjetiaMorph() {
  const [frame, setFrame] = useState({
    t: 0,
    rotation: 0,
    squareFillOpacity: 0,
    textFillOpacity: 1,
  });

  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const CYCLE = 5600; // 5.6s ciclo completo
    let start: number | null = null;

    const animate = (timestamp: number) => {
      if (start === null) start = timestamp;
      const elapsed = (timestamp - start) % CYCLE;

      let t = 0;
      let rotation = 0;
      let squareFillOpacity = 0;
      let textFillOpacity = 1;

      if (elapsed < 1600) {
        // Fase 1: Reposo como palabra MI OBJETIA (1.6s)
        t = 0;
        rotation = 0;
        squareFillOpacity = 0;
        textFillOpacity = 1;
      } else if (elapsed < 2800) {
        // Fase 2: Transformación fluida de palabra a cuadrado grande (1.2s)
        const p = (elapsed - 1600) / 1200;
        t = easeInOutCubic(p);
        rotation = 0;
        textFillOpacity = Math.max(0, 1 - p * 3.5);
        squareFillOpacity = Math.max(0, (p - 0.6) / 0.4);
      } else if (elapsed < 4100) {
        // Fase 3: Cuadrado grande de 4 cuadrados en reposo / giro 2D nítido (1.3s)
        t = 1;
        textFillOpacity = 0;
        squareFillOpacity = 1;
        const p = (elapsed - 2800) / 1300;
        rotation = easeInOutCubic(p) * 90;
      } else if (elapsed < 5300) {
        // Fase 4: Transformación fluida de vuelta a la palabra MI OBJETIA (1.2s)
        const p = (elapsed - 4100) / 1200;
        t = 1 - easeInOutCubic(p);
        rotation = (1 - easeInOutCubic(Math.min(1, p * 1.4))) * 90;
        squareFillOpacity = Math.max(0, 1 - p * 3);
        textFillOpacity = Math.max(0, (p - 0.65) / 0.35);
      } else {
        // Fase 5: Asentamiento
        t = 0;
        rotation = 0;
        squareFillOpacity = 0;
        textFillOpacity = 1;
      }

      setFrame({ t, rotation, squareFillOpacity, textFillOpacity });
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const { t, rotation, squareFillOpacity, textFillOpacity } = frame;

  return (
    <div className="w-full flex items-center justify-center select-none py-1">
      <svg
        viewBox="0 0 190 48"
        className="w-full h-10 overflow-visible"
        shapeRendering="geometricPrecision"
      >
        {/* GRUPO PRINCIPAL: Gira 90 grados alrededor del centro cuando es cuadrado */}
        <g transform={`rotate(${rotation} 95 24)`}>
          {/* FONDOS SÓLIDOS 2D DE LOS 4 CUADRADOS (Se revelan con fluidez al completarse el cuadrado grande) */}
          <g opacity={squareFillOpacity}>
            {/* Cuadrante 1: Top-Left (Azul Objetia) */}
            <rect x="81" y="10" width="12.5" height="12.5" rx="2.5" fill="#87a9ff" />
            {/* Cuadrante 2: Top-Right (Plata nítido) */}
            <rect x="96.5" y="10" width="12.5" height="12.5" rx="2.5" fill="#e3e3e3" />
            {/* Cuadrante 3: Bottom-Left (Plata nítido) */}
            <rect x="81" y="25.5" width="12.5" height="12.5" rx="2.5" fill="#e3e3e3" />
            {/* Cuadrante 4: Bottom-Right (Azul Objetia) */}
            <rect x="96.5" y="25.5" width="12.5" height="12.5" rx="2.5" fill="#87a9ff" />
          </g>

          {/* LÍNEAS VECTORIALES NATIVAS: Se desplazan y rotan fluidamente entre las letras y el cuadrado */}
          <g strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {MORPH_LINES.map((l, i) => {
              const x1 = l.text[0] + (l.sq[0] - l.text[0]) * t;
              const y1 = l.text[1] + (l.sq[1] - l.text[1]) * t;
              const x2 = l.text[2] + (l.sq[2] - l.text[2]) * t;
              const y2 = l.text[3] + (l.sq[3] - l.text[3]) * t;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={l.color}
                />
              );
            })}
          </g>
        </g>

        {/* TEXTO DE ALTA DEFINICIÓN EN REPOSO (Fundido microscópico para máxima nitidez tipográfica) */}
        <g opacity={textFillOpacity} className="pointer-events-none transition-opacity">
          <text
            x="48"
            y="28"
            textAnchor="end"
            fill="#87a9ff"
            className="font-black text-[13px] tracking-[0.2em] uppercase font-sans"
            style={{ letterSpacing: "0.22em" }}
          >
            MI
          </text>
          <text
            x="58"
            y="28"
            textAnchor="start"
            fill="#ffffff"
            className="font-black text-[13px] tracking-[0.2em] uppercase font-sans"
            style={{ letterSpacing: "0.22em" }}
          >
            OBJETIA
          </text>
        </g>
      </svg>
    </div>
  );
}
