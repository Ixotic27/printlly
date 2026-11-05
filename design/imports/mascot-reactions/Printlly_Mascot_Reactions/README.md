# Printlly mascot reactions

Nine individual transparent illustrations using the approved Printlly paper mascot.
Duolingo informs expressive body language, not the character design. Cream paper,
plum outlines and limbs, purple/lime satchel, apricot cheeks/shoes remain consistent.

## Delivery

- `assets/`: original generated PNGs, approximately 1240×1269 RGBA.
- `optimized/`: compact palette PNGs, longest edge192px, ~12–14KB each; use for96px slots.
- `reaction-overview.png`: visual index only; never use as a whole-screen image.
- `screen-mapping.json`: exact Figma IDs for components and affected screens.
- `reactions.json`: error families, mood and recovery rules for Codex.
- `MascotReaction.tsx`: small React Native image component with static asset imports.

Figma variants: https://www.figma.com/design/GLk1d6IiNCnsEFIEIVogwm?node-id=347-547
Payment example: https://www.figma.com/design/GLk1d6IiNCnsEFIEIVogwm?node-id=78-9354
App outage: https://www.figma.com/design/GLk1d6IiNCnsEFIEIVogwm?node-id=351-5676
Website outage: https://www.figma.com/design/GLk1d6IiNCnsEFIEIVogwm?node-id=351-30061

## Applied design work

36 existing customer screens updated:12 states across Light,Dark,Reduced motion.
18 missing app fallbacks added:offline,outage,missing page,session ended,
shop unavailable,unsupported file in those three themes.
12 website fallbacks added:offline,outage,missing page at1440/390px in Light/Dark.
Previous status graphics are archived on their respective pages.

The nine assets sit in reusable editable Figma component variants. The artwork
itself is raster PNG, not vector paths or a face-animation rig. Screens remain
editable; they have not been flattened into images. No mascot is offered as a
customer profile picture. Existing human/admin avatar eligibility remains intact.

## Layout and behavior

Keep the mascot attached to the status heading:96px beside the title in the app,
96px on mobile web,144px on desktop web. Keep the recovery action prominent.
Avoid a separate illustration banner, repeated price summaries or giant empty
hero areas. Do not insert a mascot into every validation field or failed chat bubble.
Field errors keep inline text and focus; chat failures keep message-level retry.

All poses are static, lightweight fallbacks. No looping GIF/video is required.
Future blink/gesture animation needs separate frames or a rig; moving this PNG
does not animate its expression. Reduced motion always remains static.

Load only the current state's image; do not preload all nine at app launch.
Original PNGs support higher-density desktop export; optimized PNGs suit compact
mobile slots. Preserve alpha and aspect ratio. No file-size limit is invented.

## Codex implementation instructions

Read PRODUCT.md,design/REDESIGN_BRIEF.md,docs/REDESIGN_BACKEND_GAPS.md and AGENTS.md.
Use the existing React Native/Expo and React/Vite projects. Reuse the supplied
components/assets. Preserve authentication,payment,upload and order contracts.

Classify using the actual error/result from the existing API. A network failure
while confirming payment is UNKNOWN/PENDING, never a conclusive payment failure.
Only server-confirmed paid reveals a pickup code; paid does not mean ready.
Never say not charged without verified evidence. Do not automatically retry a
payment. Preserve successful files on partial upload failures. Only the server's
allowed extensions,limits,availability and retry-after information are authoritative.

Figma recovery buttons demonstrate a successful recovery path. In the app,Retry
must perform the real request,show loading,remain in error on failure and navigate
only after success. Session recovery goes to login; shop recovery goes to nearby
shops; unsupported upload goes to the file picker. Offline pages retain local work.
No new backend endpoint or backend code was created by this design update.

Partner/admin can reuse the same service,offline,access and session components
inside their own application chrome. Their exhaustive error-screen rollout has
not been performed. Generic network,timeout,rate-limit,403,404 and5xx mappings are
handoff rules, not evidence that the backend emits any particular payload.

## Validation

All nine originals have genuine transparency and fully framed visible artwork.
54 mobile screens were structurally checked for art/title overflow and forbidden
unverified payment copy; no issues found. All12 web layouts fit their viewports.
Rendered examples were inspected for payment,partial upload,OTP,outage and dark
themes. Live recovery requests,device performance and end-to-end prototypes have
not been tested in the application repository.
