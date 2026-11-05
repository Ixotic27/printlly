# Motion pack import status

Updated 2026-10-11.

Source: `C:\Users\HP\Downloads\Printlly_Motion_Pack\Printlly_Motion_Pack`.

Figma: https://www.figma.com/design/GLk1d6IiNCnsEFIEIVogwm?node-id=63-3

## Verified in Figma

- Page `13 Motion Pack — partial import` (62:2).
- Twenty GIF layers are organized in a 5-column, 4-row auto-layout gallery (63:3), 2688 × 2144, 32 px gaps, cream background.
- Prototype playback renders artwork, but several named states display repeated poses. These imports have NOT passed artwork validation. The gallery is labelled `20 GIF imports / artwork mismatch — review required`.
- The source `animated-gif/20-admin-review.gif` decodes to the expected clipboard mascot with magnifier badge. Its final frame differs from the gallery's displayed pose. The cause of the Figma mismatch has not been established.

## Still pending

- 20 animated WebP files, 9 pose PNG files, 20 reduced-motion PNG files, Overview.png and Overview.gif: 51 media files.
- `MOTION_PACK_REMAINING_UPLOAD.txt` contains all 51 quoted absolute paths for one native file-picker selection. This selection was also copied to the browser clipboard.
- The documented browser filechooser event times out even after the user enabled extension file-URL access. Do not ask them to toggle that setting again or imply the full pack is uploaded.
- Figma does not provide general folder/archive storage for README.md, Preview.html and the three handoff JSON files. Those five support files remain in the source folder; their contents are not imported.
- Imported assets are not yet placed throughout product screens or validated as reduced-motion alternatives.

## Next action

In the Figma editor, use Place image/video (Ctrl+Shift+K), paste the prepared selection into the native dialog's File name field, and choose Open. Verify that all 51 files are accepted; animated WebP playback must be checked independently. Organize the resulting layers into separate galleries and correct the existing GIF artwork mismatch before using them in product workflows.

This operation changes no backend or application code and introduces no new backend contract gaps.
