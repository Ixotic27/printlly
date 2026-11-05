# Printlly matching-style mascot motion pack

9 new matching-style poses and 20 distinct animated assets. Made using built-in image generation from the approved mascot reference, then animated as whole illustrations with separate UI badges. These are actual multi-frame animations, not static screens. They retain the original visual language; generated poses are not pixel-identical copies.

## Files
- poses-png/: nine original generated RGBA images, 1240 x 1269.
- animated-gif/: 20 transparent GIFs, 512 x 512, 2 seconds, 24 fps, play once. GIF uses binary transparency; use WebP or PNG where smooth alpha edges matter.
- animated-webp/: 20 lossless animated WebP assets with full alpha, 512 x 512, 2 seconds, play once.
- reduced-motion-png/: 20 settled static PNGs. Use whenever reduced motion is enabled, for tiny cards, or when the app does not support an animation format.
- Preview.html: self-contained gallery. Replay any clip, switch to still images, or download the WebP/PNG. Overview GIF is a looping review-only collage.
- handoff/motion-manifest.json: exact page mapping and file names.
- handoff/generation-prompts.json: prompts used to generate the poses.
- handoff/validation.json: decoded frame/duration/alpha checks.

## Page mapping
- 01-welcome: Website hero, onboarding, sign-in
- 02-verification: Phone code verification; distinct from pickup code
- 03-upload-empty: Document upload empty state
- 04-upload-progress: Upload progress, while upload is actually running
- 05-upload-complete: Upload completed
- 06-print-settings: Copies, colour, sides and paper options
- 07-shop-search: Shop selection and location search
- 08-shop-selected: Selected shop confirmation
- 09-payment-processing: Checkout payment in progress
- 10-payment-success: Confirmed successful payment
- 11-order-pending: Order status: pending
- 12-order-accepted: Order status: accepted
- 13-ready-for-pickup: Order status: ready_for_pickup; server-issued pickup ticket
- 14-order-completed: Order status: completed
- 15-retry-error: Upload, network or payment failure with retry
- 16-order-cancelled: Order status: cancelled
- 17-order-expired: Order status: expired or verification expiry
- 18-empty-dashboard: No orders, no search results or initial dashboard
- 19-partner-dashboard: Partner dashboard and task completion
- 20-admin-review: Admin review and moderation

## Upload and use
1. Extract this ZIP. Upload the named files in animated-gif/ for animated placements; upload poses-png/ or reduced-motion-png/ for still artwork.
2. Place each asset beside its matching page state according to the mapping above. Preview the animation in your target application; its editor may show a resting frame only.
3. Play once on page entry or after the named action. Show the final still after the clip ends. Do not restart on every re-render.
4. Loading spinners only represent a real upload/payment operation. If it lasts longer than two seconds, keep the ordinary app loading indicator running; this illustration must not imply completion.
5. Use reduced-motion PNGs when the user prefers reduced motion. Keep real messages, order states, errors and progress in native UI text; these illustrations communicate no authoritative status by themselves.
6. Website: welcome; mobile customer: 01–18; partner: 11–17 and 19; admin: 15–20.
7. In React Native/Expo or Flutter, verify the actual renderer's GIF/WebP support, alpha, and one-shot playback before shipping. These are raster assets, not Lottie or independently rigged arm/face animations.

## Existing Figma motion
Actual manual timeline tracks were added to the approved sign-in mascot, sending ticket, verification/recovery states and success check in the existing file. Reduced-motion frames retain no transform animation. Native tracks were read back successfully, but the server video download returned an unavailable asset, so Figma playback could not be visually verified in this session. New generated poses have not been uploaded or placed in Figma.

Production OTP behavior remains outside this artwork work. Pickup confirmation uses a server-issued code after payment and must stay distinct from login verification. Order states: pending, accepted, ready_for_pickup, completed, cancelled, expired.
