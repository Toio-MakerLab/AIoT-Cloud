export function colorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Keep saturation/lightness in a readable range
  const h = Math.abs(hash) % 360;
  return hslToHex(h, 60, 45);
}

function hslToHex(h: number, s: number, l: number): string {
  const a = (s * Math.min(l, 100 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * (color / 100))
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
