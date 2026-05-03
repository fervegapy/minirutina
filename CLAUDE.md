# CLAUDE.md — Minirutina

## What is Minirutina

Minirutina is a Paraguayan e-commerce for personalized printed routine boards for children aged 2–10. Parents customize a board (choosing their child's name, activity icons, and accent color), the order is received via WhatsApp/email, printed on 300g coated cardstock with matte lamination, and delivered to the door. The three products are daily routine boards, weekly planner boards, and reward tracker boards.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS v4 with `@theme inline` in `globals.css` |
| Components | shadcn/ui v4 (base-ui primitives) |
| Database | Supabase (Postgres, anon key, no typed generics) |
| Language | TypeScript |
| Font | Nunito (Google Fonts, loaded via `next/font`) |
| Deployment | Vercel (auto-deploy on push to `main`) |

---

## Folder Structure

```
app/
  page.tsx                          # Landing page
  layout.tsx                        # Root layout (font, metadata)
  productos/[slug]/page.tsx         # Product detail page (rutinas | semana | recompensas)
  personalizar/
    rutinas/page.tsx                # Rutinas customizer (4 steps)
    semana/page.tsx                 # Semana customizer (4 steps)
    recompensas/page.tsx            # Recompensas customizer (6 steps)
  checkout/page.tsx                 # Order form + sticky price bar
  confirmacion/page.tsx             # Post-order confirmation page
  admin/page.tsx                    # Internal orders dashboard

components/
  landing/                          # Landing page sections (Hero, Productos, ComoFunciona, Testimonial, FAQ, Footer, Header)
  customizer/
    IconPicker.tsx                  # Reusable icon grid picker + icon emoji map + ICONOS_* arrays
    ColorPicker.tsx                 # Accent color selector
    StepIndicator.tsx               # Progress bar
    PreviewRutinas.tsx              # Stacked card preview (mañana / siesta / noche)
    PreviewSemana.tsx               # Two-section sticker chart preview
    PreviewRecompensas.tsx          # Reward board preview
  checkout/
    LocationPicker.tsx              # Cascading Departamento → Ciudad → Barrio (delpi.dev API)
  admin/
    PedidosTable.tsx                # Orders table
  ui/                               # shadcn components (button, input, card, accordion, badge, separator)

lib/
  productos.ts                      # Product definitions (slug, name, price, FAQs, etc.)
  supabase.ts                       # Supabase client (createClient, anon key)
  utils.ts                          # cn() helper

types/
  pedido.ts                         # Pedido, PersonalizacionRutinas/Semana/Recompensas, EstadoPedido types

supabase/
  precios.sql                       # SQL to create and seed the precios table (run manually in Supabase dashboard)
```

---

## Products & Customizer Routes

| Product | Slug | Customizer route | Steps |
|---|---|---|---|
| Tablero de Rutinas | `rutinas` | `/personalizar/rutinas` | Nombre → Color → Mañana → Siesta → Noche → Vista previa |
| Plan de la Semana | `semana` | `/personalizar/semana` | Nombre → Color → Figuritas (up to 10 icons, same for every day) → Vista previa |
| Tablero de Recompensas | `recompensas` | `/personalizar/recompensas` | Nombre → Color → Sticker → Cantidad → Recompensa → Vista previa |

Product metadata (name, tagline, price, FAQs, benefits) lives in `lib/productos.ts`. Prices are also stored in Supabase `precios` table and fetched dynamically at checkout; hardcoded values are fallbacks.

---

## Data Model

### `pedidos` table (Supabase)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | auto-generated |
| `created_at` | timestamptz | auto-generated |
| `producto` | text | `rutinas` \| `semana` \| `recompensas` |
| `nombre_nino` | text | child's name |
| `color_acento` | text | hex color string |
| `personalizacion` | jsonb | product-specific (see types below) |
| `tipo_entrega` | text | `fisico` \| `digital` |
| `modalidad` | text | `pickup` \| `delivery` (fisico only) |
| `email` | text | |
| `whatsapp` | text | |
| `direccion` | text nullable | delivery address (departamento/ciudad/barrio + calle) |
| `estado` | text | `pendiente` \| `pagado` \| `enviado` |
| `archivo_url` | text nullable | future: generated PNG URL |

### `precios` table (Supabase)

| Column | Type |
|---|---|
| `producto` | text PK |
| `precio_impreso` | int (Gs.) |
| `precio_digital` | int (Gs.) |
| `updated_at` | timestamptz |

### Personalizacion shapes (jsonb)

```ts
// rutinas
{ manana: string[], siesta: string[], noche: string[] }

// semana
{ figuritas: string[] }   // icon IDs, same set printed for all 7 days

// recompensas
{ pasos: number, recompensa: string, sticker: string }
```

---

## Design System Tokens

Defined in `app/globals.css` via `@theme inline`:

| Token | Value | Usage |
|---|---|---|
| `background` | `#fffef6` | Warm cream — page background |
| `foreground` | `#233933` | Deep green-gray — all text |
| `primary` | `#ecbc5d` | Golden mustard — CTA buttons |
| `border` | `#e5e7eb` | Light gray — card borders |
| `--radius` | `0.75rem` | Base border radius |
| Font | Nunito, 700 bold default | Rounded, friendly |

Per-product accent colors (used for card headers, icon highlights):

| Product | Color |
|---|---|
| Rutinas | `#a8c5a0` (sage green) |
| Semana | `#a8c8e8` (sky blue) |
| Recompensas | `#f5d78e` (soft yellow) |

---

## Key Decisions Already Made

- **Placeholder previews**: The customizer shows an in-browser React preview (emoji icons, colored blocks). These are representative, not pixel-perfect reproductions of the printed output.
- **External payment**: There is no payment gateway integrated. The checkout form collects order details, saves to Supabase, and redirects to WhatsApp or shows a bank transfer confirmation. Payment is confirmed manually.
- **No user auth**: Customers don't create accounts. Orders are identified by contact info (email + WhatsApp). The admin panel at `/admin` has no auth (internal use only for now).
- **PNG download post-pay**: After payment is confirmed, the plan is to generate a PNG file (the actual print-ready board) and store the URL in `archivo_url`. This is not yet implemented — currently orders are fulfilled manually by the team.
- **Pickup location**: Pickup is free and based in Villamorra, Asunción. Delivery costs Gs. 35.000 and uses the delpi.dev API for Paraguay's Departamento → Ciudad → Barrio cascading dropdowns.
- **All prices in Guaraníes (Gs.)**: Formatted with `toLocaleString("es-PY")`.
- **Icon system**: Icons are emoji mapped in `getIconEmoji()` inside `IconPicker.tsx`. No custom illustrations yet — emoji serve as placeholder icons throughout customizers and previews.

---

## What's Pending

- **Real PNG generation**: A server-side renderer (e.g. Satori, Puppeteer, or a canvas-based approach) that generates a print-ready PNG/PDF from the order's personalization data. URL stored in `pedidos.archivo_url`.
- **Payment integration**: Bancard or equivalent Paraguayan payment gateway, or at minimum an automated WhatsApp flow triggered on form submit.
- **Real icons/illustrations**: Replace emoji with custom-designed SVG icons for each activity. The `getIconEmoji()` map in `IconPicker.tsx` is the integration point — swap emoji strings for `<img>` or `<svg>` references there.
- **Admin auth**: Protect `/admin` with Supabase Auth or a simple password gate.
- **Order status updates**: A way for the team to mark orders as `pagado` / `enviado` and notify the customer.

---

## Rules

1. **Always use shadcn components** (`components/ui/`) for any interactive element. Don't reach for raw HTML inputs, buttons, or selects.
2. **Spanish, Latin American neutral** — no Argentina-specific voseo constructions in UI copy (use "vos" forms sparingly and only where natural for Paraguay). No references to Argentina.
3. **Mobile-first** — design for 375px width first. Max content width is `max-w-lg` (512px) in customizers, `max-w-3xl` in landing sections.
4. **No shadows, no gradients** — flat design only. Use borders (`border border-[#e5e7eb]`) and background tints (`colorAcento + "33"`) for depth.
5. **Minimum button height 40px** — all interactive tap targets must be at least `h-10` (40px).
6. **Prices always in Guaraníes** — format as `Gs. X.XXX` using `toLocaleString("es-PY")`. Never use `$` or `USD`.
7. **Supabase client is untyped** — use `supabase` from `lib/supabase.ts` directly, no generic type parameters.
