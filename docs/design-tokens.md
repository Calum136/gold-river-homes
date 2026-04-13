# Design Tokens

Extracted from https://www.supremehomes.ca/retailers/gold-river-homes/

## Colors

### Backgrounds
| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--bg-primary` | `#111415` | `rgb(17,20,21)` | Main page background |
| `--bg-secondary` | `#141718` | `rgb(20,23,24)` | Card/section backgrounds |
| `--bg-tertiary` | `#0F1214` | `rgb(15,18,20)` | Deeper sections |
| `--bg-elevated` | `#171D23` | `rgb(23,29,35)` | Elevated cards, inputs |
| `--bg-overlay` | `rgba(0,0,0,0.75)` | — | Overlays, modals |

### Accent / Gold
| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--gold-primary` | `#97764E` | `rgb(151,118,78)` | Buttons, primary CTA |
| `--gold-bright` | `#C4882A` | `rgb(196,136,42)` | Highlights, hover states |
| `--gold-dark` | `#27140F` | `rgb(39,20,15)` | Gold-tinted dark sections |

### Text
| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--text-primary` | `#E8DCCC` | `rgb(232,220,204)` | Main body text |
| `--text-secondary` | `#D8CAB8` | `rgb(216,202,184)` | Secondary text |
| `--text-muted` | `rgba(232,220,204,0.66)` | — | Muted labels |
| `--text-white` | `#FFFFFF` | `rgb(255,255,255)` | Headings, button text |

## Typography

### Font Families
| Token | Font | Usage |
|-------|------|-------|
| `--font-display` | `Playfair Display` | Hero headings, section titles |
| `--font-body` | `Poppins` | Body text, labels, inputs |
| `--font-accent` | `Teko` | Accent headings, badges |
| `--font-secondary` | `Roboto Slab` | Secondary headings |

### Font Sizes (Desktop)
- Hero: 48-64px (Playfair Display)
- Section heading: 32-40px (Playfair Display)
- Sub-heading: 20-24px (Poppins 600)
- Body: 16px (Poppins 400)
- Small: 14px (Poppins 400)
- Label: 12-13px (Poppins 500, uppercase)

## Buttons
- Primary: `bg: #97764E`, `color: white`, `text-transform: uppercase`, `letter-spacing: 1px`
- Hover: `bg: #C4882A`
- Border radius: `0px` (sharp corners) or `2px`
- Padding: `12px 28px`

## Layout
- Nav: Sticky top, dark background (`#111415`), Supreme logo left, links center-right
- Menu items: `uppercase`, `Poppins`, `font-weight: 500`, `letter-spacing: 1-2px`
- Sections: Full-width, generous vertical padding (80-120px)
- Max content width: ~1200px
