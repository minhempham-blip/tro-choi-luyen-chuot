import React from 'react';

export const CartoonBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-amber-50">
      {/* Background SVG Scenery */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
      >
        <defs>
          {/* Rainbow Gradient */}
          <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
            <stop offset="20%" stopColor="#fb923c" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#facc15" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#4ade80" stopOpacity="0.8" />
            <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
          </linearGradient>

          {/* Grassy Hill Gradients */}
          <linearGradient id="hillFar" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="hillNear" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>

          {/* Orange Fruit Gradient */}
          <radialGradient id="orangeFruit" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="40%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </radialGradient>
        </defs>

        {/* --- SUN AT TOP (Smiling cheerful sun) --- */}
        <g transform="translate(160, 95)" className="animate-spin" style={{ animationDuration: '60s' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              x1="0"
              y1="0"
              x2="0"
              y2="-68"
              stroke="#fbbf24"
              strokeWidth="6"
              strokeLinecap="round"
              transform={`rotate(${i * 30})`}
            />
          ))}
        </g>
        <g transform="translate(160, 95)">
          <circle cx="0" cy="0" r="46" fill="#facc15" stroke="#f59e0b" strokeWidth="4" />
          {/* Cheerful face */}
          <circle cx="-14" cy="-8" r="5" fill="#78350f" />
          <circle cx="14" cy="-8" r="5" fill="#78350f" />
          {/* Rosy cheeks */}
          <circle cx="-22" cy="6" r="7" fill="#f87171" opacity="0.6" />
          <circle cx="22" cy="6" r="7" fill="#f87171" opacity="0.6" />
          {/* Smile */}
          <path d="M -16 6 Q 0 24 16 6" fill="none" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* --- RAINBOW ON UPPER RIGHT --- */}
        <g opacity="0.85">
          <path
            d="M 980 -50 A 420 420 0 0 1 1480 450"
            fill="none"
            stroke="url(#rainbowGrad)"
            strokeWidth="48"
            strokeLinecap="round"
          />
        </g>

        {/* --- FLOATING CLOUDS --- */}
        <g fill="#ffffff" opacity="0.92">
          {/* Cloud 1 */}
          <g transform="translate(360, 70)">
            <ellipse cx="60" cy="30" rx="45" ry="24" />
            <ellipse cx="95" cy="22" rx="36" ry="22" />
            <ellipse cx="30" cy="34" rx="28" ry="18" />
          </g>
          {/* Cloud 2 */}
          <g transform="translate(820, 110)">
            <ellipse cx="60" cy="30" rx="55" ry="26" />
            <ellipse cx="105" cy="20" rx="40" ry="22" />
            <ellipse cx="25" cy="32" rx="32" ry="18" />
          </g>
        </g>

        {/* --- ORANGE TREE ON THE LEFT --- */}
        <g transform="translate(0, 360)">
          {/* Trunk */}
          <path
            d="M 40 400 Q 80 200 110 80 Q 90 20 60 -40 Q 140 20 150 120 Q 170 240 180 400 Z"
            fill="#854d0e"
            stroke="#713f12"
            strokeWidth="3"
          />
          {/* Foliage Canopy Clusters */}
          <ellipse cx="110" cy="-60" rx="90" ry="75" fill="#15803d" />
          <ellipse cx="50" cy="-10" rx="75" ry="65" fill="#16a34a" />
          <ellipse cx="180" cy="-30" rx="80" ry="70" fill="#22c55e" />
          <ellipse cx="120" cy="40" rx="85" ry="65" fill="#16a34a" />

          {/* Ripe Oranges hanging */}
          {[
            { cx: 70, cy: -70 },
            { cx: 130, cy: -80 },
            { cx: 175, cy: -40 },
            { cx: 90, cy: -20 },
            { cx: 150, cy: 10 },
            { cx: 55, cy: 20 },
            { cx: 110, cy: 50 },
          ].map((pos, i) => (
            <g key={i}>
              {/* stem */}
              <line x1={pos.cx} y1={pos.cy - 16} x2={pos.cx} y2={pos.cy - 10} stroke="#3f6212" strokeWidth="3" />
              {/* leaf */}
              <ellipse cx={pos.cx + 5} cy={pos.cy - 16} rx="6" ry="3" fill="#65a30d" transform={`rotate(-20 ${pos.cx} ${pos.cy})`} />
              {/* orange */}
              <circle cx={pos.cx} cy={pos.cy} r="14" fill="url(#orangeFruit)" stroke="#c2410c" strokeWidth="2" />
            </g>
          ))}
        </g>

        {/* --- ROLLING GREEN HILLS AT BOTTOM --- */}
        {/* Distant hill */}
        <path
          d="M -50 900 L -50 720 Q 350 640 750 710 T 1500 700 L 1500 900 Z"
          fill="url(#hillFar)"
        />
        {/* Near hill */}
        <path
          d="M -50 900 L -50 770 Q 420 680 920 780 T 1500 750 L 1500 900 Z"
          fill="url(#hillNear)"
        />

        {/* --- FLOWERS ON THE MEADOW --- */}
        {[
          { x: 260, y: 810, color: '#f43f5e' },
          { x: 340, y: 840, color: '#eab308' },
          { x: 490, y: 820, color: '#ec4899' },
          { x: 620, y: 850, color: '#3b82f6' },
          { x: 780, y: 830, color: '#f97316' },
          { x: 910, y: 860, color: '#a855f7' },
          { x: 1080, y: 830, color: '#ef4444' },
          { x: 1220, y: 850, color: '#facc15' },
          { x: 1350, y: 820, color: '#ec4899' },
        ].map((fl, i) => (
          <g key={i} transform={`translate(${fl.x}, ${fl.y})`}>
            {/* stem */}
            <path d="M 0 0 Q 3 15 2 25" stroke="#15803d" strokeWidth="3" fill="none" />
            {/* petals */}
            {Array.from({ length: 5 }).map((_, p) => (
              <circle
                key={p}
                cx={Math.cos((p * 72 * Math.PI) / 180) * 8}
                cy={Math.sin((p * 72 * Math.PI) / 180) * 8}
                r="6"
                fill={fl.color}
              />
            ))}
            {/* center */}
            <circle cx="0" cy="0" r="5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
          </g>
        ))}
      </svg>

      {/* Foreground Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-3 sm:p-5">
        {children}
      </div>
    </div>
  );
};
