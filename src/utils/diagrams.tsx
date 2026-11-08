import React from 'react';
import { DiagramKind } from '../types';

export function renderTechnicalDiagram(kind: DiagramKind, caption?: string): React.ReactNode {
  switch (kind) {
    case 'fbd':
      return (
        <svg viewBox="0 0 280 180" className="w-full h-auto max-w-[280px] stroke-current">
          <rect x="100" y="70" width="80" height="50" fill="#f1f5f9" stroke="#334155" strokeWidth="2" />
          <text x="140" y="100" textAnchor="middle" fill="#0f172a" fontSize="13" fontFamily="monospace">mass m</text>
          {/* Normal force arrow upwards */}
          <line x1="140" y1="70" x2="140" y2="25" stroke="#e11d48" strokeWidth="2" markerEnd="url(#arrow-crimson)" />
          <polygon points="140,20 136,28 144,28" fill="#e11d48" />
          <text x="150" y="32" fill="#e11d48" fontSize="12" fontWeight="bold">N</text>
          {/* Gravity arrow downwards */}
          <line x1="140" y1="120" x2="140" y2="165" stroke="#c2410c" strokeWidth="2" />
          <polygon points="140,170 136,162 144,162" fill="#c2410c" />
          <text x="150" y="165" fill="#c2410c" fontSize="12" fontWeight="bold">mg</text>
          {/* Applied force right */}
          <line x1="180" y1="95" x2="235" y2="95" stroke="#0e7490" strokeWidth="2" />
          <polygon points="240,95 232,91 232,99" fill="#0e7490" />
          <text x="245" y="99" fill="#0e7490" fontSize="12" fontWeight="bold">F_app</text>
          {/* Friction left */}
          <line x1="100" y1="115" x2="45" y2="115" stroke="#b45309" strokeWidth="2" />
          <polygon points="40,115 48,111 48,119" fill="#b45309" />
          <text x="20" y="119" fill="#b45309" fontSize="12" fontWeight="bold">f_k</text>
        </svg>
      );

    case 'circuit':
      return (
        <svg viewBox="0 0 280 180" className="w-full h-auto max-w-[280px]">
          {/* Loop wire */}
          <rect x="40" y="30" width="200" height="120" fill="none" stroke="#334155" strokeWidth="2" rx="4" />
          {/* Battery DC on left */}
          <rect x="36" y="70" width="8" height="40" fill="#ffffff" />
          <line x1="30" y1="80" x2="50" y2="80" stroke="#0e7490" strokeWidth="3" />
          <line x1="34" y1="100" x2="46" y2="100" stroke="#0e7490" strokeWidth="2" />
          <text x="12" y="94" fill="#0e7490" fontSize="12" fontWeight="bold">V₀</text>
          {/* Resistor R1 on top */}
          <rect x="110" y="24" width="60" height="12" fill="#ffffff" stroke="#e11d48" strokeWidth="1.5" />
          <text x="140" y="20" textAnchor="middle" fill="#e11d48" fontSize="11" fontWeight="bold">R₁ = 10Ω</text>
          {/* Capacitor C on bottom */}
          <rect x="125" y="144" width="30" height="12" fill="#ffffff" />
          <line x1="135" y1="140" x2="135" y2="160" stroke="#c2410c" strokeWidth="2.5" />
          <line x1="145" y1="140" x2="145" y2="160" stroke="#c2410c" strokeWidth="2.5" />
          <text x="140" y="174" textAnchor="middle" fill="#c2410c" fontSize="11" fontWeight="bold">C = 5μF</text>
        </svg>
      );

    case 'graph':
      return (
        <svg viewBox="0 0 280 180" className="w-full h-auto max-w-[280px]">
          {/* Grid lines */}
          <line x1="40" y1="40" x2="250" y2="40" stroke="#e2e8f0" strokeDasharray="3 3" />
          <line x1="40" y1="80" x2="250" y2="80" stroke="#e2e8f0" strokeDasharray="3 3" />
          <line x1="40" y1="120" x2="250" y2="120" stroke="#e2e8f0" strokeDasharray="3 3" />
          {/* Axes */}
          <line x1="40" y1="150" x2="260" y2="150" stroke="#475569" strokeWidth="2" />
          <line x1="40" y1="150" x2="40" y2="20" stroke="#475569" strokeWidth="2" />
          {/* Arrow heads */}
          <polygon points="260,150 252,146 252,154" fill="#475569" />
          <polygon points="40,20 36,28 44,28" fill="#475569" />
          <text x="255" y="168" fill="#475569" fontSize="11">Time (s)</text>
          <text x="18" y="25" fill="#475569" fontSize="11">v (m/s)</text>
          {/* Velocity curve */}
          <path d="M 40 150 Q 100 40 240 60" fill="none" stroke="#e11d48" strokeWidth="2.5" />
          <circle cx="100" cy="95" r="4" fill="#c2410c" />
          <text x="110" y="95" fill="#c2410c" fontSize="10">v_max</text>
        </svg>
      );

    case 'wave':
      return (
        <svg viewBox="0 0 280 180" className="w-full h-auto max-w-[280px]">
          <line x1="30" y1="90" x2="260" y2="90" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 2" />
          {/* Sinusoidal wave */}
          <path
            d="M 30 90 Q 60 30 90 90 T 150 90 T 210 90 T 260 90"
            fill="none"
            stroke="#0e7490"
            strokeWidth="2.5"
          />
          {/* Wavelength lambda */}
          <line x1="90" y1="25" x2="210" y2="25" stroke="#e11d48" strokeWidth="1.5" />
          <text x="150" y="20" textAnchor="middle" fill="#e11d48" fontSize="11" fontWeight="bold">λ = 12 cm</text>
          {/* Amplitude */}
          <line x1="60" y1="90" x2="60" y2="40" stroke="#c2410c" strokeWidth="1.5" />
          <text x="68" y="65" fill="#c2410c" fontSize="10">A = 2 mm</text>
        </svg>
      );

    case 'geometry':
      return (
        <svg viewBox="0 0 280 180" className="w-full h-auto max-w-[280px]">
          {/* Triangle */}
          <polygon points="140,30 50,150 230,150" fill="#f8fafc" stroke="#334155" strokeWidth="2" />
          <text x="140" y="24" textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="bold">A</text>
          <text x="40" y="160" fill="#0f172a" fontSize="12" fontWeight="bold">B</text>
          <text x="235" y="160" fill="#0f172a" fontSize="12" fontWeight="bold">C</text>
          {/* Altitude */}
          <line x1="140" y1="30" x2="140" y2="150" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="3 3" />
          <rect x="140" y="140" width="10" height="10" fill="none" stroke="#e11d48" strokeWidth="1" />
          <text x="148" y="90" fill="#e11d48" fontSize="11">h = 8 cm</text>
        </svg>
      );

    case 'lens':
      return (
        <svg viewBox="0 0 280 180" className="w-full h-auto max-w-[280px]">
          {/* Principal axis */}
          <line x1="20" y1="90" x2="260" y2="90" stroke="#64748b" strokeWidth="1.5" />
          {/* Convex lens */}
          <path d="M 140 20 Q 160 90 140 160 Q 120 90 140 20 Z" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" opacity="0.8" />
          {/* Object arrow */}
          <line x1="60" y1="90" x2="60" y2="45" stroke="#c2410c" strokeWidth="2" />
          <polygon points="60,40 56,48 64,48" fill="#c2410c" />
          <text x="50" y="38" fill="#c2410c" fontSize="11" fontWeight="bold">Obj</text>
          {/* Focal points */}
          <circle cx="100" cy="90" r="3" fill="#334155" />
          <text x="100" y="105" textAnchor="middle" fill="#334155" fontSize="10">F₁</text>
          <circle cx="180" cy="90" r="3" fill="#334155" />
          <text x="180" y="105" textAnchor="middle" fill="#334155" fontSize="10">F₂</text>
          {/* Refracted rays */}
          <line x1="60" y1="45" x2="140" y2="45" stroke="#e11d48" strokeWidth="1.2" />
          <line x1="140" y1="45" x2="220" y2="135" stroke="#e11d48" strokeWidth="1.2" />
          <line x1="60" y1="45" x2="220" y2="135" stroke="#e11d48" strokeWidth="1.2" />
          {/* Inverted image */}
          <line x1="220" y1="90" x2="220" y2="135" stroke="#0e7490" strokeWidth="2" />
          <polygon points="220,140 216,132 224,132" fill="#0e7490" />
          <text x="215" y="155" fill="#0e7490" fontSize="11" fontWeight="bold">Img</text>
        </svg>
      );

    default:
      return null;
  }
}
