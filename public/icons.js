const iconMap = [
  { keywords: ['broom', 'temizlik', 'süpürge'], svg: 'broom' },
  { keywords: ['vacuum', 'süpürge', 'cleaning'], svg: 'vacuum' },
  { keywords: ['iron', 'ütü'], svg: 'iron' },
  { keywords: ['coffee', 'kahve'], svg: 'coffee' },
  { keywords: ['kettle', 'su ısıtıcısı', 'demlik'], svg: 'kettle' },
  { keywords: ['toaster', 'tost'], svg: 'toaster' },
  { keywords: ['blender', 'blender'], svg: 'blender' },
  { keywords: ['light', 'ampul', 'lamba'], svg: 'bulb' },
  { keywords: ['curtain', 'perde'], svg: 'curtain' },
  { keywords: ['towel', 'havlu'], svg: 'towel' },
  { keywords: ['rug', 'halı', 'paspas'], svg: 'rug' },
  { keywords: ['plant', 'bitki', 'saksı'], svg: 'plant' },
  { keywords: ['tree', 'ağaç', 'bitki'], svg: 'tree' },
  { keywords: ['pot', 'saksı'], svg: 'pot' },
  { keywords: ['key', 'kilit', 'anahtar'], svg: 'key' },
  { keywords: ['tool', 'alet', 'takım'], svg: 'toolbox' },
  { keywords: ['shelf', 'raf', 'ürün'], svg: 'shelf' },
  { keywords: ['tv', 'televizyon'], svg: 'tv' },
  { keywords: ['bed', 'yatak'], svg: 'bed' },
  { keywords: ['pillow', 'yastık'], svg: 'pillow' },
  { keywords: ['cookware', 'tencere', 'pişirme'], svg: 'cookware' },
  { keywords: ['container', 'kap', 'depolama'], svg: 'container' },
  { keywords: ['hanger', 'askılık'], svg: 'hanger' },
  { keywords: ['shoe', 'ayakkılık', 'ayakkabı'], svg: 'shoe' },
  { keywords: ['first aid', 'ilk yardım'], svg: 'firstaid' },
  { keywords: ['trash', 'çöp', 'kutusu'], svg: 'trash' }
];

const baseSvg = {
  broom: `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M16 60L52 24L58 30L22 66Z" fill="#FFC93C" stroke="#1B1A3A" stroke-width="3"/><path d="M55 30L66 18L71 23L60 35Z" fill="#2BB673" stroke="#1B1A3A" stroke-width="3"/><path d="M20 66H58" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/><path d="M20 64L8 72" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/></svg>`,
  vacuum: `<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="20" y="22" width="32" height="40" rx="8" fill="#26B5E8" stroke="#1B1A3A" stroke-width="3"/><rect x="27" y="18" width="18" height="10" rx="4" fill="#FF5FA2" stroke="#1B1A3A" stroke-width="3"/><path d="M28 62L18 72" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/><path d="M52 62L62 72" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/><circle cx="38" cy="52" r="8" fill="#fff" stroke="#1B1A3A" stroke-width="3"/></svg>`,
  iron: `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M15 28H52C59 28 64 33 64 40V50H15V28Z" fill="#C3D6FF" stroke="#1B1A3A" stroke-width="3"/><path d="M13 50H64L72 62H22Z" fill="#FF8A3D" stroke="#1B1A3A" stroke-width="3"/><path d="M28 22V15" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/><path d="M45 22V15" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/></svg>`,
  coffee: `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M20 30H52C58 30 62 34 62 40V50C62 56 57 60 52 60H28C22 60 18 56 18 50V40C18 34 22 30 20 30Z" fill="#8B5CF6" stroke="#1B1A3A" stroke-width="3"/><path d="M62 36H66C70 36 72 39 72 43C72 47 70 50 66 50H62" fill="none" stroke="#1B1A3A" stroke-width="3"/><path d="M22 28V20" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/><path d="M34 25V16" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/><path d="M46 28V18" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/></svg>`,
  kettle: `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M22 28H54C59 28 62 31 62 36V50C62 58 56 64 48 64H30C22 64 16 58 16 50V36C16 31 19 28 22 28Z" fill="#FF5FA2" stroke="#1B1A3A" stroke-width="3"/><path d="M62 38H68C71 38 74 41 74 45C74 49 71 52 68 52H62" fill="none" stroke="#1B1A3A" stroke-width="3"/><path d="M28 22V15" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/><path d="M44 20V12" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/></svg>`,
  toaster: `<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="18" y="22" width="44" height="36" rx="8" fill="#A3D133" stroke="#1B1A3A" stroke-width="3"/><rect x="24" y="28" width="32" height="16" rx="5" fill="#fff" stroke="#1B1A3A" stroke-width="3"/><path d="M28 58H52" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/><rect x="30" y="14" width="8" height="8" rx="2" fill="#FFC93C" stroke="#1B1A3A" stroke-width="3"/><rect x="42" y="14" width="8" height="8" rx="2" fill="#FFC93C" stroke="#1B1A3A" stroke-width="3"/></svg>`,
  blender: `<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="22" y="14" width="36" height="42" rx="7" fill="#26B5E8" stroke="#1B1A3A" stroke-width="3"/><rect x="30" y="8" width="20" height="8" rx="4" fill="#FF8A3D" stroke="#1B1A3A" stroke-width="3"/><path d="M26 56H54" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/><rect x="34" y="58" width="12" height="10" rx="4" fill="#F5D277" stroke="#1B1A3A" stroke-width="3"/></svg>`,
  bulb: `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M28 34C28 24 36 18 40 18C46 18 54 24 54 34C54 42 49 48 44 52V56H36V52C31 48 28 42 28 34Z" fill="#FFC93C" stroke="#1B1A3A" stroke-width="3"/><path d="M38 56H42V62H38Z" fill="#1B1A3A"/><path d="M30 62H50" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/></svg>`,
  curtain: `<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="18" y="16" width="10" height="48" fill="#FF5FA2" stroke="#1B1A3A" stroke-width="3"/><rect x="52" y="16" width="10" height="48" fill="#FF5FA2" stroke="#1B1A3A" stroke-width="3"/><path d="M26 18V64M54 18V64" stroke="#1B1A3A" stroke-width="3"/><path d="M28 28H52" stroke="#1B1A3A" stroke-width="3"/></svg>`,
  towel: `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M18 22H54C60 22 64 26 64 32V54C64 60 60 64 54 64H18C12 64 8 60 8 54V32C8 26 12 22 18 22Z" fill="#26B5E8" stroke="#1B1A3A" stroke-width="3"/><path d="M18 32H54" stroke="#fff" stroke-width="3"/><path d="M18 42H54" stroke="#fff" stroke-width="3"/><path d="M18 52H44" stroke="#fff" stroke-width="3"/></svg>`,
  rug: `<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="12" y="22" width="56" height="36" rx="8" fill="#8B5CF6" stroke="#1B1A3A" stroke-width="3"/><path d="M20 32H60" stroke="#fff" stroke-width="3"/><path d="M20 48H60" stroke="#fff" stroke-width="3"/></svg>`,
  plant: `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M40 22C47 22 52 28 52 36C52 47 44 54 40 60C36 54 28 47 28 36C28 28 33 22 40 22Z" fill="#2BB673" stroke="#1B1A3A" stroke-width="3"/><path d="M40 60V74" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/><path d="M30 72H50" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/><rect x="32" y="62" width="16" height="8" rx="3" fill="#FFC93C" stroke="#1B1A3A" stroke-width="3"/></svg>`,
  tree: `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M40 10C46 18 50 22 50 28C50 36 46 40 40 42C34 40 30 36 30 28C30 22 34 18 40 10Z" fill="#2BB673" stroke="#1B1A3A" stroke-width="3"/><path d="M33 34H47L52 50H28L33 34Z" fill="#8B5CF6" stroke="#1B1A3A" stroke-width="3"/><path d="M40 50V66" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/></svg>`,
  pot: `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M24 30H56L52 58C51 62 48 64 44 64H36C32 64 29 62 28 58L24 30Z" fill="#FF8A3D" stroke="#1B1A3A" stroke-width="3"/><path d="M26 26H54" stroke="#1B1A3A" stroke-width="4"/><path d="M28 22H52" stroke="#1B1A3A" stroke-width="4"/></svg>`,
  key: `<svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="30" cy="32" r="14" fill="#FFC93C" stroke="#1B1A3A" stroke-width="3"/><path d="M42 32H68V40H42Z" fill="#FF5FA2" stroke="#1B1A3A" stroke-width="3"/><path d="M46 44V62" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/><path d="M62 44V62" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/></svg>`,
  toolbox: `<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="18" y="28" width="44" height="30" rx="7" fill="#A3D133" stroke="#1B1A3A" stroke-width="3"/><path d="M26 28V18H54V28" stroke="#1B1A3A" stroke-width="3" fill="none"/><path d="M28 36H52" stroke="#1B1A3A" stroke-width="3"/><circle cx="32" cy="42" r="3" fill="#1B1A3A"/><circle cx="48" cy="42" r="3" fill="#1B1A3A"/></svg>`,
  shelf: `<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="14" y="28" width="52" height="8" fill="#8B5CF6" stroke="#1B1A3A" stroke-width="3"/><rect x="18" y="36" width="12" height="22" fill="#FF5FA2" stroke="#1B1A3A" stroke-width="3"/><rect x="34" y="36" width="12" height="22" fill="#26B5E8" stroke="#1B1A3A" stroke-width="3"/><rect x="50" y="36" width="12" height="22" fill="#FFC93C" stroke="#1B1A3A" stroke-width="3"/></svg>`,
  tv: `<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="14" y="18" width="52" height="36" rx="5" fill="#26B5E8" stroke="#1B1A3A" stroke-width="3"/><path d="M22 62H58" stroke="#1B1A3A" stroke-width="4"/><path d="M40 54V66" stroke="#1B1A3A" stroke-width="4"/></svg>`,
  bed: `<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="16" y="34" width="48" height="20" rx="6" fill="#FF5FA2" stroke="#1B1A3A" stroke-width="3"/><path d="M16 36V26H30V36" fill="none" stroke="#1B1A3A" stroke-width="3"/><path d="M30 36H50" stroke="#1B1A3A" stroke-width="3"/><path d="M18 54V66" stroke="#1B1A3A" stroke-width="4"/><path d="M62 54V66" stroke="#1B1A3A" stroke-width="4"/></svg>`,
  pillow: `<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="16" y="32" width="48" height="22" rx="6" fill="#F6D0E2" stroke="#1B1A3A" stroke-width="3"/><path d="M24 32V22H54V32" stroke="#1B1A3A" stroke-width="3"/></svg>`,
  cookware: `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M18 28H62V36C62 42 58 46 52 46H28C22 46 18 42 18 36V28Z" fill="#FF8A3D" stroke="#1B1A3A" stroke-width="3"/><path d="M24 20V24M40 20V24M56 20V24" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/><path d="M28 44V60M52 44V60" stroke="#1B1A3A" stroke-width="4" stroke-linecap="round"/></svg>`,
  container: `<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="18" y="26" width="44" height="30" rx="7" fill="#26B5E8" stroke="#1B1A3A" stroke-width="3"/><path d="M26 26V18H54V26" stroke="#1B1A3A" stroke-width="3"/><path d="M26 40H54" stroke="#1B1A3A" stroke-width="3"/></svg>`,
  hanger: `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M40 16C44 16 48 20 48 24C48 28 44 32 40 32C36 32 32 28 32 24C32 20 36 16 40 16Z" fill="#FFC93C" stroke="#1B1A3A" stroke-width="3"/><path d="M28 32L40 40L58 28" stroke="#1B1A3A" stroke-width="4"/><path d="M26 38H54V62H26Z" fill="#FF5FA2" stroke="#1B1A3A" stroke-width="3"/></svg>`,
  shoe: `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M18 56H60L66 42H48L40 34H28L18 56Z" fill="#A3D133" stroke="#1B1A3A" stroke-width="3"/><path d="M28 38H42" stroke="#1B1A3A" stroke-width="3"/></svg>`,
  firstaid: `<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="22" y="18" width="36" height="46" rx="8" fill="#FF5FA2" stroke="#1B1A3A" stroke-width="3"/><path d="M40 28V52M28 40H52" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>`,
  trash: `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M24 28H56L54 62C54 66 51 68 46 68H34C29 68 26 66 26 62L24 28Z" fill="#8B5CF6" stroke="#1B1A3A" stroke-width="3"/><path d="M32 22H48L52 28H28L32 22Z" fill="#FFC93C" stroke="#1B1A3A" stroke-width="3"/><path d="M36 34V58M44 34V58" stroke="#fff" stroke-width="4"/><path d="M20 28H60" stroke="#1B1A3A" stroke-width="4"/></svg>`,
  default: `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M16 58C18 35 32 20 40 20C48 20 62 35 64 58Z" fill="#FFC93C" stroke="#1B1A3A" stroke-width="3"/><rect x="24" y="58" width="32" height="8" fill="#1B1A3A"/></svg>`
};

export function resolveIconSvg(name = '') {
  const text = String(name).toLowerCase();
  const match = iconMap.find((item) => item.keywords.some((keyword) => text.includes(keyword)));
  return baseSvg[match?.svg || 'default'];
}
