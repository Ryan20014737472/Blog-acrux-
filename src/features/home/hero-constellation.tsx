// Decorative geometry follows the supplied mark; the official image stays intact.
const branches = [
  { id: "top", points: [[425, 620], [635, 165], [725, 356]] },
  { id: "right", points: [[810, 550], [988, 934], [875, 888]] },
  { id: "bottom", points: [[320, 855], [281, 934], [632, 782], [690, 813]] },
] as const;

const stars = [
  { x: 563, y: 502, size: 26, accent: false },
  { x: 714, y: 471, size: 26, accent: false },
  { x: 658, y: 649, size: 22, accent: true },
  { x: 745, y: 649, size: 25, accent: false },
  { x: 478, y: 765, size: 26, accent: false },
] as const;

export function HeroConstellation() {
  return (
    <svg
      aria-hidden="true"
      className="acrux-constellation block h-auto w-full overflow-visible"
      fill="none"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      viewBox="220 100 830 900"
    >
      <g stroke="var(--acrux-white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={16}>
        {branches.map((branch) => (
          <path
            className="acrux-constellation-line"
            d={branch.points.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" ")}
            key={branch.id}
          />
        ))}
      </g>
      <g fill="var(--acrux-white)">
        {branches.flatMap((branch) => [branch.points[0], branch.points[branch.points.length - 1]]).map(([x, y]) => (
          <circle className="acrux-constellation-node" cx={x} cy={y} key={`${x}-${y}`} r={26} />
        ))}
      </g>
      {stars.map(({ x, y, size, accent }) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          <path
            className="acrux-constellation-star"
            d={`M 0 ${-size} Q ${size * 0.24} ${-size * 0.24} ${size} 0 Q ${size * 0.24} ${size * 0.24} 0 ${size} Q ${-size * 0.24} ${size * 0.24} ${-size} 0 Q ${-size * 0.24} ${-size * 0.24} 0 ${-size} Z`}
            fill={accent ? "var(--acrux-yellow)" : "var(--acrux-white)"}
          />
        </g>
      ))}
    </svg>
  );
}
