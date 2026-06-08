<!-- SEED: re-run /impeccable document once there's code to capture the actual tokens and components. -->
---
name: Personal Blob
description: Personal website for essays and project showcase — Bauhaus-informed minimalism.
---

# Design System: Personal Blob

## 1. Overview

**Creative North Star: "The Bauhaus Cabinet"**

A personal website that treats content display as a structural art. Every page is a composition of geometric fields: strong color blocks holding text, negative space as an active design element, and typography so sharply kerned it becomes the primary ornament. The design takes its cues from Bauhaus poster language — asymmetric grids, primary-color accents against near-white fields, and a single saturated color claiming a third of the surface without apology.

The atmosphere is calm but assertive. This is not a "personal blog" in the cozy sense; it's a curated exhibition of writing and work, where the frame is as deliberate as the pieces inside. Essays read in generous measure on warm-white fields. Project pages open with full-bleed color blocks that establish territory before content resolves.

**Key Characteristics:**
- Geometric composition: asymmetrical grids, orthogonal lines, right angles
- One committed accent color owns 30–60% of key surfaces; the rest is tinted neutral
- Typography is the interface — weight and scale contrast, never decorative type
- White space is structural, not empty
- Choreographed entrances: scroll reveals and transitions that feel architectural, not playful
- No SaaS tropes: no soft shadows, no rounded corners on purpose, no gradient buttons

## 2. Colors

**The Committed Field Rule.** One saturated accent owns a third of the visible area or more on key surfaces (hero, section headers, project cards). Its prevalence is the point — this is a Bauhaus palette, not a "one accent ≤10%" restraint. All other surfaces stay in tinted neutral territory.

### Primary (Committed Accent)
- **Bauhaus Red** `[to be resolved during implementation]`: The committed field color. Used on hero block backgrounds, section divider panels, project-page full-bleed headers, interactive element hover states. Approximate hue: a warm vermilion or deep cadmium red in the tradition of Bauhaus poster work. Not orange, not crimson.

### Neutral
- **Warm Paper** `[to be resolved during implementation]`: Primary background for reading surfaces. A near-white tinted warm — like uncoated off-white printing stock. Not `#fff`.
- **Ink Black** `[to be resolved during implementation]`: Primary text color on warm paper surfaces. A deep near-black with the slightest warmth (chroma ≤0.01). Not `#000`.
- **Flint** `[to be resolved during implementation]`: Secondary text, metadata, captions, borders.
- **Reversed Inscription** `[to be resolved during implementation]`: Text on the committed accent field — near-white, high contrast.

### Named Rules
**The One Color Rule.** The primary accent is a single hue. No secondary accent, no tertiary palette. The visual tension comes from scale and placement decisions about that one color, not from adding more colors.

**The No-Line Rule.** No `border-left` or `border-right` stripes. When separation is needed, use a full block of the primary accent, a background tint shift, or nothing.

## 3. Typography

**Display & Body Font:** A single geometric sans-serif `[to be chosen at implementation]`
**Mono Font:** `[to be chosen at implementation, for code snippets in essays]`

**Character:** A frontal, constructed sans-serif with circular O's and sharp terminals. The face carries the same structural honesty as the layout — no calligraphic pretense, no humanist warmth. Letterforms are built, not drawn.

### Hierarchy
- **Display** (ExtraBold, `clamp(3.5rem, 8vw, 6rem)`, tight `0.95`): Hero titles and section numerals. The only use of the heaviest weight. Always paired with generous negative space around it.
- **Headline** (Bold, `clamp(1.75rem, 3.5vw, 2.75rem)`, `1.15`): Article titles, section headings.
- **Title** (SemiBold, `clamp(1.25rem, 2.5vw, 1.75rem)`, `1.3`): Subheadings, project card titles.
- **Body** (Regular, `clamp(1rem, 1.25vw, 1.125rem)`, `1.7`): Essay text. Max line length: 65–75ch.
- **Label** (Medium, `0.75rem`, `1`, `0.05em` tracking, uppercase): Navigation, metadata, dates, tags.
- **Caption** (Regular, `0.875rem`, `1.4`): Image captions, footnotes, secondary metadata.

### Named Rules
**The Weight-Only Emphasis Rule.** No italics. No underlines. Emphasis is expressed via weight shifts (Regular → SemiBold) within the same family.

## 4. Elevation

Flat by default; depth is conveyed through color blocking and scale contrast, not through shadows. Surfaces stack via tonal layering (warm paper → flint-tinted fields) rather than `box-shadow`. The sole exception: hover elevation on interactive elements uses a crisp, subtle lift — `translateY(-2px)` with no accompanying shadow.

## 5. Components

`[Components to be documented during Scan mode after implementation]`

## 6. Do's and Don'ts

### Do:
- **Do** use the committed accent color in large fields (hero backgrounds, section dividers, project-page headers) where it occupies 30–60% of the visible area.
- **Do** use generous whitespace between content blocks. Breathing room is a feature.
- **Do** use weight contrast (Display: ExtraBold vs. Body: Regular) as the primary hierarchy tool.
- **Do** keep body text within a 65–75ch measure.
- **Do** choreograph entrance sequences: content reveals on scroll with deliberate, architectural timing.

### Don't:
- **Don't** use gradient text, glassmorphism, or side-stripe borders.
- **Don't** look like a modern tech/SaaS company — no soft shadows, rounded buttons, gradient accents, or "friendly startup" visual language.
- **Don't** use the hero-metric template (big number + small label + gradient accent).
- **Don't** use identical card grids for content listing. Vary composition.
- **Don't** use italics or underlines for emphasis. Use weight.
- **Don't** use black (`#000`) or white (`#fff`). Tint every neutral toward warmth.
- **Don't** animate layout properties (width, height, top, left, padding, margin).
- **Don't** pack content densely. If a section feels sparse, it's probably right.
