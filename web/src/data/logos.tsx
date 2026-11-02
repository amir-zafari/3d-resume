// Logos in public/logos, keyed for data/works.ts and data/tour.ts. `bg` is the chip behind a logo
// that would vanish on white (light marks); the rest sit on white.
export const LOGOS = {
  barcelon: { file: 'barcelon.png', bg: '#111111' },
  artifex: { file: 'artifex.svg' },
  atari: { file: 'atari.png' },
  drkamandi: { file: 'drkamandi.png' },
  fruitord: { file: 'fruitord.png' },
  vakilbashi: { file: 'vakilbashi.svg' },
  see5: { file: 'see5.png' },
  webello: { file: 'webello.png' },
  yazan: { file: 'yazan.png' },
} satisfies Record<string, { file: string; bg?: string }>

export type LogoKey = keyof typeof LOGOS

export function Logo({ name, className }: { name?: LogoKey; className: string }) {
  if (!name) return null
  const logo: { file: string; bg?: string } = LOGOS[name]
  return <img className={className} src={`${import.meta.env.BASE_URL}logos/${logo.file}`} alt="" loading="lazy" style={logo.bg ? { background: logo.bg } : undefined} />
}
