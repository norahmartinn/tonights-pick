## Change

In `src/routes/auth.tsx`, replace the current mascot on the sign-in screen with the same one used on the home hero, and reposition it so it looks like it's sitting on top of the white card (feet resting on the card's top edge).

## Details

1. Swap the import
   - Remove: `import mascot from "@/assets/mascot.png"`
   - Add: `import mascotHero from "@/assets/mascot-hero-cool.png"` (same asset used on the home page)

2. Reposition the mascot image
   - Move it out of the card and place it just above the card, anchored to the card's top-right area, so its feet visually rest on the card's top border.
   - Wrap the card in a `relative` container; render the mascot as a sibling absolutely positioned with something like `absolute right-4 -top-16 w-24 h-24 sm:w-28 sm:h-28` and no rotation.
   - Remove `overflow-hidden` from the card so the mascot isn't clipped, and drop the previous `-top-6 -right-6 rotate-12` styling.
   - Keep it decorative: `alt=""`, `pointer-events-none`, `select-none`.

3. No changes to auth logic, layout of form fields, colors, or copy.

## Out of scope

- Home page, other routes, and asset generation (reusing the existing `mascot-hero-cool.png`).
