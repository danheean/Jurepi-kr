# Transparent Background Maker — Remove Solid-Color Backgrounds Locally — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Transparent Background Maker** (배경 투명 만들기) — client-side single-color background removal. Users upload an image (PNG/JPEG/WebP), select or auto-detect the background color, adjust tolerance and feathering, and download a transparent PNG. 100% local processing, zero network upload, zero external dependencies (native canvas only). Privacy-first: the image is processed and discarded locally.
> Internal service codename: `transparent-background`. Registry id: `transparent-background`. Public URL slug: `/[locale]/tools/transparent-background`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/converter/qr-code/SPEC.md`](qr-code/SPEC.md)

```xml
<project_specification>

<project_name>Transparent Background Maker — Client-Side Color-Based Background Removal (Jurepi tool, codename transparent-background, registry id transparent-background)</project_name>

<overview>
The Transparent Background Maker solves a practical problem: users upload an image with a solid or near-solid background (white product photo, logo on cream, scanned document, etc.) and instantly remove the background by color matching. The tool detects the background color from the image corners, allows manual override via eyedropper or hex input, tunes removal tolerance (0–100 for fuzzy matching), and optionally feathers edges for anti-aliasing. The result downloads as a transparent PNG. All processing happens on the user's device (canvas API only); no upload, no server, no external ML model. The selling point is privacy and speed — instant one-click removal for simple use cases.

CRITICAL (no external dependencies, canvas-only): 100% client-side using native HTML5 canvas. No @imgly, no WASM, no third-party ML. The algorithm is a pure pixel-iteration loop: for each pixel, calculate color distance to the background color; if within tolerance, set alpha to 0 (or blend alpha via feather). Deterministic, fast (tens of ms on modern devices), and requires <1MB memory.

CRITICAL (out-of-scope clarity): this tool does NOT tackle complex photos (faces, objects with interior colors matching the background, soft edges). Jurepi's honest pitch: "Simple single-color backgrounds like product shots, logos, scans, screenshots." AI-powered detailed cutouts (person silhouettes, intricate edge refinement) are future_considerations (Phase 2, requires a licensed external service or open-source ML model that fits the 25MiB Worker size limit).

CRITICAL (usability-first, SPA): per the platform rule, the tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. Upload → color selection/detection → tolerance adjustment → preview → download all happen via local React state with NO route navigation. The tool is statically generated (SSG) for SEO; the interactive encoder is a single client-component island.
</overview>

<platform_integration>
  - Route: /[locale]/tools/transparent-background (SSG; registry slug "transparent-background", id "transparent-background", status "coming_soon", accent "sky", category "converter").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder.
  - Consumes: i18n namespace `tools.transparent-background.*` (UI chrome: labels, buttons, error messages, how-to, FAQ).
  - Platform dependency (SMALL): the `'converter'` category already exists in `ToolCategory` with the `sky` accent and the "변환 도구"/"Converter" label. The only platform change is adding ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Image upload via file picker or drag-and-drop (client FileReader, no network upload).
    - Automatic background color detection from image corners (corner-detect: dominant color from four corners, majority rule).
    - Manual background color selection via eyedropper (click image to sample) or hex input (type color code).
    - Tolerance slider (0–100): higher tolerance = more similar colors removed; low = strict color match only.
    - Feather control (0–20 pixels): edge smoothing by linearly blending alpha near the color boundary (anti-alias, no hard cutout).
    - Removal mode selector: flood-fill (seed from corners, only connected areas removed) vs. global (all matching pixels removed regardless of connectivity).
    - Preview over checkerboard transparency backdrop (visual feedback).
    - Preserve existing alpha: if the input PNG already has transparency, merge new transparency with it (bitwise AND).
    - Download result as transparent PNG (via canvas.toBlob).
    - Copy to clipboard: result canvas as PNG image.
    - Input format support: PNG, JPEG, WebP (auto-detect via MIME type, file extension fallback).
    - Edge case handling: very large images (auto-downscale to 4096px longest edge), already-transparent images, very small tolerance (near-pixel-perfect match).
    - SEO long-form ("Remove image backgrounds locally", "When to use color-based removal") + FAQ (FAQPage JSON-LD) + SoftwareApplication JSON-LD.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - AI/ML-based background removal (complex photos, person segmentation, soft edge detection). See future_considerations.
    - Manual refine brush / draw-to-remove (Phase 2).
    - Batch processing (Phase 2).
    - Background replacement (solid color or image overlay). Phase 2.
    - Video background removal.
    - Face-aware masking or person-specific refinement.
    - Any server-side processing, account sync, or cloud storage.
  </out_of_scope>
  <future_considerations>
    - AI/ML background removal (Phase 2) — integrate a lightweight open-source model or a licensed service (if it fits the 25MiB Cloudflare Worker limit) for complex photos.
    - Manual refine brush (Phase 2) — paint areas to keep/remove post-removal.
    - Background replacement (Phase 2) — solid color or image fill for transparent areas.
    - Batch processing (Phase 2) — upload multiple images, queue removal.
    - Feather presets (Phase 2) — named presets (crisp, soft, silky) vs. manual slider.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <color_processing>Native canvas API (getImageData, putImageData). Color distance calculation in RGB space (simple Euclidean distance sufficient for user-visible results). Pure JavaScript; no WASM, no external library.</color_processing>
    <image_loading>canvas API for image loading, downscaling (preserve aspect ratio), format detection (MIME type + extension). FileReader.readAsArrayBuffer → Image() onload → canvas context.</image_loading>
    <corner_detection>Sample pixels from four corners (top-left, top-right, bottom-left, bottom-right) — default ~5% of image dimensions inset from edge. Find dominant color via RGB-space clustering (simple histogram). Return top color as the detected background.</corner_detection>
    <tolerance_calc>Color distance = sqrt((R1-R2)² + (G1-G2)² + (B1-B2)²) normalized to 0–255 scale. Tolerance slider maps 0–100 to 0–distance-max (e.g., 0–85 for practical detection). Pixel removed if distance <= tolerance.</tolerance_calc>
    <feathering>For pixels near the boundary (distance within [tolerance-feather_width, tolerance]), blend alpha linearly: alpha = 1 - (distance - (tolerance - feather_width)) / feather_width. Creates smooth anti-alias edge.</feathering>
    <flood_fill_mode>Seed from detected corners; use a simple BFS/DFS to mark connected same-color regions for removal. Non-seed areas of the same color (e.g., text inside an object that matches the background) are preserved. Computationally cheap (marks reachable pixels only).</flood_fill_mode>
    <state_management>React local state (image data, detection result, tolerance, feather, mode, preview visible). localStorage for user prefs (last tolerance, feather, mode). NO external state library — tool state is self-contained in one component.</state_management>
    <download_export>canvas.toBlob({ type: 'image/png' }) → Blob → a.download trigger. Fallback: if toBlob slow, canvas dataURL → Blob conversion.</download_export>
    <clipboard>navigator.clipboard.write([ClipboardItem]) for PNG copy. Fallback: silent fail (copy is secondary).</clipboard>
    <animation>Native CSS transitions only: eyedropper hover glow, tolerance slider thumb, preview fade (all gated by prefers-reduced-motion). No animation library.</animation>
  </module_specific>
  <libraries>
    <none_required>Zero external dependencies for the core algorithm. All image processing is canvas + TypeScript.</none_required>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/transparent-background/
│   ├── schema.ts                      # Input/output zod types (ImageData, RemovalOptions, RemovalResult)
│   ├── color-distance.ts              # euclideanDistance(rgb1, rgb2): number — pure function
│   ├── corner-detect.ts               # detectBackgroundColor(imageData): RGB — sample corners, find dominant
│   ├── transparency.ts                # applyTransparency(imageData, bgColor, tolerance, feather, mode): ImageData — core removal logic
│   ├── feather.ts                     # featherAlpha(pixels, tolerance, feather_width): void — anti-alias edges
│   └── export.ts                      # canvasToBlob(canvas): Promise<Blob> — download adapter
├── components/tools/transparent-background/
│   ├── TransparentBackgroundMaker.tsx  # Orchestrator (Client Component) — owns state + useTransparencyRemover() owner
│   ├── useTransparencyRemover.ts       # Hook: image load + corner detect + removal + localStorage persistence
│   ├── ImageUpload.tsx                 # File input + drag-and-drop area (accepts images)
│   ├── BackgroundColorPicker.tsx       # Auto-detect button + eyedropper + hex input + color preview
│   ├── EyedropperCursor.tsx            # Click image to sample color (visual feedback: crosshair, sampled-color swatch)
│   ├── RemovalControls.tsx             # Tolerance slider (0–100) + feather slider (0–20px) + mode selector (flood-fill vs global)
│   ├── PreviewCanvas.tsx               # Canvas over checkerboard backdrop, real-time render
│   ├── ExportButton.tsx                # "Download PNG" + "Copy to Clipboard"
│   ├── TransparentBgIntro.tsx          # H1 + lead (SEO; server-render where possible)
│   ├── TransparentBgHowTo.tsx          # "How to remove solid-color backgrounds" (SEO long-form)
│   ├── TransparentBgFaq.tsx            # Q&A + FAQPage JSON-LD
│   └── data/
│       └── (no generated artifact)
└── i18n/messages/{ko,en}.json         # tools.transparent-background.* UI chrome

tests/
├── lib/transparent-background/
│   ├── color-distance.test.ts         # Euclidean distance calc
│   ├── corner-detect.test.ts          # Corner sampling, dominant color
│   ├── transparency.test.ts           # Pixel removal (tolerance, feather, flood-fill)
│   └── export.test.ts                 # Canvas → blob conversion
└── e2e/
    └── transparent-background-*.spec.ts # Upload, detect, adjust tolerance, download, accessibility
</file_structure>

<core_data_entities>
  <image_data note="input state">
    - file: File (original image from upload)
    - dataUrl: string (base64 for preview)
    - canvas: HTMLCanvasElement (raw image rendered on canvas)
    - width: number | height: number (original dimensions)
    - downscaled: boolean (if longest edge > 4096px, mark as downscaled + warn user)
  </image_data>
  <removal_options note="user customization">
    - bgColor: { r, g, b } (detected or user-selected)
    - tolerance: number (0–100, maps to 0–85 distance in RGB space)
    - feather: number (0–20, pixels for edge smoothing)
    - mode: 'flood-fill' | 'global' (default flood-fill)
  </removal_options>
  <removal_result note="output state">
    - resultCanvas: HTMLCanvasElement (image with transparent background)
    - resultBlob: Blob (PNG-encoded, created on export)
    - processingTimeMs: number (for performance logging)
  </removal_result>
  <processing_state note="UI state machine">
    - phase: 'idle' | 'uploading' | 'detecting' | 'removing' | 'done' | 'error'
    - progress: number (0–100, for detection and removal progress)
    - error?: string (error message to display)
  </processing_state>
  <localstorage_key>jurepi-transparent-background (store: { tolerance, feather, mode, lastBgColor? })</localstorage_key>
  <constants>
    - DOWNSCALE_THRESHOLD_PX = 4096 (longest edge cap)
    - CORNER_INSET_RATIO = 0.05 (5% from edge for corner detection)
    - TOLERANCE_MAX_DISTANCE = 85 (maps slider 100 to RGB distance 85)
    - FEATHER_MAX_PX = 20
    - CHUNK_SIZE = 65536 (pixels per rAF frame for progressive processing on large images)
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/transparent-background" page="TransparentBackgroundMaker (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry live tools only (`registry.filter(s => s.status === 'live')` × locales) — the route does NOT exist while status is "coming_soon"; flip to "live" at launch to emit it.</note>
</route_definitions>

<component_hierarchy>
  <transparent_background_maker>                          <!-- "use client"; owns image + options + processing state -->
    <transparent_bg_intro />                              <!-- H1 + lead (server-render where possible) -->
    <removal_layout>                                      <!-- Stacked: upload → color pick → controls → preview → export -->
      <image_upload />                                    <!-- File picker + drag-and-drop -->
      <background_color_picker />                         <!-- Auto-detect + eyedropper + hex input -->
      <eyedropper_cursor />                               <!-- Visual feedback (cursor crosshair + sampled color) -->
      <removal_controls />                                <!-- Tolerance + feather + mode selector -->
      <preview_canvas />                                  <!-- Canvas over checkerboard, real-time render (debounced) -->
      <export_button />                                   <!-- Download + copy (active when done) -->
    </removal_layout>
    <transparent_bg_how_to />                             <!-- SEO long-form -->
    <transparent_bg_faq />                                <!-- FAQPage JSON-LD -->
  </transparent_background_maker>
  <note>SPA: upload → detect → adjust → preview → download all in one component, local state (no route nav).</note>
</component_hierarchy>

<pages_and_interfaces>
  <transparent_bg_intro>
    - Eyebrow: "변환 도구" / "CONVERTER TOOL" — 12px/700/0.6px, var(--accent-sky).
    - H1: "배경 투명 만들기" / "Transparent Background Maker" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 2–3 sentences, body-lg 18px var(--text-secondary): "단색 배경 제거 · 로컬 처리 · 이미지 업로드 안됨" / "Remove solid backgrounds instantly. 100% local. Your image stays on your device."
  </transparent_bg_intro>

  <image_upload>
    - Dashed box (2px var(--hairline-strong), 4px var(--radius-lg)), bg var(--surface-sunken).
    - "Click to upload" text center + file input (accept="image/png,image/jpeg,image/webp"). Drag-and-drop highlight on dragover.
    - Leading icon: lucide Upload (24px var(--text-muted)).
    - Accepted formats shown: PNG, JPEG, WebP.
    - After upload: image name + dimensions + file size shown below.
  </image_upload>

  <background_color_picker>
    - "Background Color" label + three controls:
      1. Auto-detect button ("자동 감지" / "Auto-Detect") — samples corners, shows detected color swatch.
      2. Eyedropper button ("색 가져오기" / "Pick Color") — enters eyedropper mode (cursor changes, click image to sample).
      3. Hex input (#RRGGBB) — fallback, direct color code entry.
    - Current background color displayed as a large swatch (60×60px, rounded var(--radius-md), border var(--hairline)).
    - If no background detected (e.g., first upload), default to white (#ffffff).
  </background_color_picker>

  <eyedropper_cursor>
    - Visible only when eyedropper mode active.
    - Cursor changes to crosshair (CSS cursor: crosshair).
    - On hover over image: show a small preview circle (24×24px) of the color under cursor.
    - On click: sample color, exit eyedropper mode, update background color swatch.
    - Escape key or click outside image exits mode.
  </eyedropper_cursor>

  <removal_controls>
    - Tolerance Slider (0–100, default 50):
      Label: "Tolerance (how similar colors to remove)" / "유사도 (얼마나 유사한 색을 제거할지)".
      Display: "Tolerance: 50" (numeric feedback).
      Slider styling: var(--accent-sky) fill, 44px height for touch. Debounced output (100ms).
    - Feather Slider (0–20px, default 2):
      Label: "Feather (edge smoothness)" / "페더링 (가장자리 부드러움)".
      Display: "Feather: 2px".
      Slider styling: var(--accent-sky).
    - Mode Selector (pill buttons):
      [Flood-Fill] (default) [Global] — side-by-side radio. "Flood-fill keeps colors inside objects; Global removes all matching colors."
  </removal_controls>

  <preview_canvas>
    - Canvas element (responsive to image size, max 100% container width). Transparent result rendered as RGBA.
    - Checkerboard backdrop (8×8px gray/white tiles, --accent-sky at 8% opacity). Canvas sits on top, rounded var(--radius-lg), border var(--hairline).
    - Visible during detection and after removal. Shows "Detecting background color..." spinner during corner-detect phase.
    - Dimensions label below: "Original: 1920×1080 → Will export as transparent PNG".
  </preview_canvas>

  <export_button>
    - "Download PNG" (primary button, var(--brand), 44px min-height). Centered.
    - "Copy to Clipboard" (secondary button, gray) — copies result canvas as PNG to clipboard.
    - Active only after phase === 'done'; disabled with tooltip "Upload and configure an image first".
    - On click, canvas.toBlob → Blob → a.download trigger (filename: "transparent-${Date.now()}.png").
    - Toast on success: "Downloaded!" or "Copied to clipboard!" (1600ms). On fail: "Download failed, try again" (persistent).
  </export_button>
</pages_and_interfaces>

<core_functionality>
  <image_upload>
    - Accept PNG, JPEG, WebP (file extension + MIME type validate).
    - Read via FileReader.readAsArrayBuffer → detect format.
    - Render in canvas to get dimensions.
    - If longest edge > 4096px, downscale (preserve aspect ratio, use canvas.drawImage).
    - Store canvas + dimensions in state.
  </image_upload>
  <corner_detection>
    - Extract ImageData from canvas. Sample ~5% inset from each corner.
    - For each corner sample: build RGB histogram (64 buckets per channel).
    - Aggregate histograms from four corners; find peak RGB value (dominant color).
    - Return { r, g, b } as detected background color.
    - Store in state; display in color swatch.
  </corner_detection>
  <color_removal note="main algorithm">
    - Input: original ImageData, bgColor { r, g, b }, tolerance (0–100), feather (0–20), mode (flood-fill|global).
    - Convert tolerance 0–100 to distance 0–85.
    - If mode === 'flood-fill': BFS from detected corners, mark all connected same-color pixels as "remove candidate".
    - If mode === 'global': mark all pixels where euclideanDistance(pixel, bgColor) <= tolerance as "remove candidate".
    - For each candidate:
      - If feather > 0: check if pixel is within feather_width pixels of the boundary. If so, blend alpha.
      - Else: set alpha to 0.
    - Preserve existing alpha (multiply with new alpha).
    - For large images, process in chunks (65k pixels per rAF frame to keep UI responsive).
    - Return modified ImageData.
  </color_removal>
  <export note="client-side download">
    - canvas.toBlob({ type: 'image/png' }, callback) → Blob.
    - Trigger a.download with blob URL.
    - Filename: "transparent-${Date.now()}.png".
  </export>
  <clipboard note="secondary, silent fail">
    - navigator.clipboard.write([new ClipboardItem({ 'image/png': canvas.toBlob() })]).
    - Fallback: silent (copy is nice-to-have, not critical).
  </clipboard>
  <eyedropper note="manual color selection">
    - Click image to sample color at cursor position.
    - Convert pixel color from canvas getImageData to hex.
    - Exit eyedropper mode, update background color state.
  </eyedropper>
</core_functionality>

<error_handling>
  <unsupported_format>Toast: "PNG, JPEG, WebP 형식만 지원합니다. 업로드된 파일은 {type}" / "PNG, JPEG, WebP supported. Uploaded file is {type}" → clear upload.</unsupported_format>
  <corner_detect_fail>Rare. Fallback to white (#ffffff). Toast: "배경색 감지 실패, 흰색으로 설정했습니다." / "Failed to detect background. Using white as default."</corner_detect_fail>
  <very_large_image>If longest edge > 4096px, auto-downscale. Show notice: "이미지가 크므로 최장 변이 4096px로 축소되었습니다." / "Image downscaled to 4096px longest edge for performance."</very_large_image>
  <processing_timeout>If removal takes >5s on huge image, show progress bar. Allow user to cancel and re-upload smaller image.</processing_timeout>
  <download_fail>canvas.toBlob fail (rare). Toast: "다운로드 실패. 브라우저를 새로고침하고 다시 시도하세요." / "Download failed. Please refresh and try again."</download_fail>
  <error_boundary>Platform wraps tool; render fail → safe fallback without tool crash.</error_boundary>
  <note>No first-party network calls; no API error surface.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Category accent is SKY (var(--accent-sky) #38bdf8 / var(--accent-sky-soft) #ddf2fe) — "converter" category identity per DESIGN. Sliders, color picker buttons, preview border.
    - CTAs (export button) = brand honey-gold var(--brand) (primary action). Accent sky = identity, not action (DESIGN do/don't).
  </accent_usage>
  <surfaces>Upload area = var(--surface-sunken) 2px dashed; color swatch = white card + var(--hairline); preview canvas = var(--surface) + 1px var(--hairline); slider track = var(--accent-sky) at 20% opacity.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); upload label headline (20px)/700; slider labels body (16px) var(--text); feather/tolerance display 600 weight var(--text).</typography>
  <motion>Color swatch updates instant (no fade). Slider thumb drag (0ms on interact, 150ms on release). Eyedropper cursor crosshair fade 200ms. All gated by prefers-reduced-motion (instant, no transition).</motion>
  <accessibility>Upload = real file input (label + aria-label); sliders with aria-label + aria-valuetext (e.g., "Tolerance: 50 out of 100"); buttons 44px; focus-visible ring var(--focus-ring); eyedropper mode announced via aria-live.</accessibility>
  <responsive>
    - ≥1024px: upload + color pick + controls + preview stacked, width 100%.
    - <768px: same stack, narrower. Sliders full-width. Canvas scales with container (no overflow at 320px).
    - Checkerboard backdrop scales with canvas.
  </responsive>
  <atmosphere>Practical, focused "one-click removal": upload feels straightforward (dashed box), color detection is smart (auto-detect + eyedropper), tolerance slider is intuitive (real-time preview), result is crisp and clean. Not playful; efficient and precise.</atmosphere>
  <icons>lucide-react: Upload (upload area, 28px), Pipette (eyedropper, 24px), Download (export button, 20px), Copy (clipboard, 20px). Default currentColor, stroke 1.75. Registry card icon: `Zap`.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input note="images are user-provided, processed locally">
    - File type validated (MIME + extension). Malformed image files → load error (canvas context fail) caught silently.
    - Image data never sent over network (100% client-side processing).
  </input>
  <canvas_operations>
    - getImageData / putImageData are safe (no eval, no script execution).
    - Result canvas rendered to Blob (no HTML injection). Downloaded as binary PNG.
  </canvas_operations>
  <privacy>
    - Image never uploaded. Color removal is local (canvas). Result Blob never sent.
    - localStorage only stores user prefs (tolerance, feather, mode, last color). No analytics on image content.
    - State plainly documented in Intro / How-To / FAQ.
  </privacy>
  <clipboard>
    - Copy is user-initiated (clipboard.write on button click only). Browser permission auto-granted for same-origin.
  </clipboard>
  <note>No secrets, no network, no 3rd-party storage.</note>
</security_considerations>

<final_integration_test>
  <test_scenario_1>
    <description>Happy path: upload white-background image, auto-detect, adjust tolerance, download</description>
    <steps>
      1. Drag a PNG with white background (512×512px) onto upload area.
      2. Auto-detect button fires. Corners are sampled; dominant white is detected. Color swatch shows white.
      3. Tolerance slider at default 50. Preview renders image with white transparency.
      4. Click "Download PNG" → PNG downloads as "transparent-${ts}.png".
      5. Verify PNG has transparent areas (checkerboard visible through canvas area that was white).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Eyedropper mode: manual color selection</description>
    <steps>
      1. Upload image.
      2. Click eyedropper button. Cursor changes to crosshair.
      3. Move cursor over image; preview circle shows color under cursor.
      4. Click on cream area of image. Eyedropper exits; color swatch updates to cream.
      5. Tolerance adjusted; preview updates. Download PNG.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Feather smoothing + flood-fill mode</description>
    <steps>
      1. Upload image with solid background and text/logo.
      2. Toggle mode to [Flood-Fill]. Auto-detect background.
      3. Adjust feather slider to 5px. Tolerance 40. Preview shows edges smoothed (anti-alias).
      4. Flip to [Global] mode. All pixels matching background are removed (may clip internal colors if they match).
      5. Return to [Flood-Fill]. Download PNG.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Large image downscaling + error cases</description>
    <steps>
      1. Upload a 5000×4000px image.
      2. Image downscales to 4096×3276px. Notice shown: "downscaled to 4096px".
      3. Auto-detect, adjust tolerance, preview renders (responsive, no freeze).
      4. Try to copy to clipboard. If unsupported, silent fail (no false toast).
      5. Download PNG (smaller file size than original, but output quality preserved for the downscaled version).
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>a11y, i18n, SEO (JSON-LD)</description>
    <steps>
      1. Keyboard-only: Tab through file input → Auto-detect button → Tolerance slider (Arrow keys adjust) → Feather slider → Mode pills → Download.
      2. Focus-visible ring on all interactive elements.
      3. Sliders have aria-label + aria-valuetext.
      4. Switch locale ko ↔ en. Labels/buttons/how-to/FAQ all localized; image data unchanged.
      5. Build prod → /ko/tools/transparent-background and /en/tools/transparent-background unique title/description/canonical/hreflang. HTML has SoftwareApplication + FAQPage JSON-LD, how-to/FAQ not gated by "mounted".
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <functionality>Upload image → auto-detect or manual color pick → adjust tolerance + feather → select mode (flood-fill vs global) → live preview → download transparent PNG. Copy to clipboard works (or silent fail). No network upload.</functionality>
  <user_experience>Upload feels straightforward (drag-drop), auto-detect is smart, color picker (eyedropper) is intuitive, tolerance slider shows real-time preview, result visible over checkerboard, export is one-click. 44px tap targets. Keyboard operable (sliders with arrow keys, all buttons tabbable).</user_experience>
  <technical_quality>lib/transparent-background/* pure ≥80% unit coverage (color-distance, corner-detect, transparency, feather); UI debounced (100ms on slider), canvas operations chunked for large images (no jank); TS 0 errors; <800 lines per file; localStorage only stores prefs; zero external dependencies.</technical_quality>
  <visual_design>DESIGN.md compliant; sky accent identity + brand honey-gold CTA; practical, focused image tool (checkerboard backdrop, intuitive sliders, warm colors). Text-node render only (no HTML injection).</visual_design>
  <accessibility>Upload file input real; buttons 44px+ touch targets; focus-visible ring; sliders keyboard operable (Arrow keys); all text labels present; WCAG 2.1 AA.</accessibility>
  <performance>Image load instant, corner-detect <100ms, removal chunked (no main-thread jank), result Blob created only on export; CLS 0 (ad height reserved); LCP < 2.5s.</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). /[locale]/tools/transparent-background pre-rendered by platform generateStaticParams iterating registry (status "coming_soon"). Tool itself is SPA, no static artifact beyond the route shell.</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'converter' category + 'sky' accent already exist; no ToolCategory change needed.
    {
      id: 'transparent-background',
      slug: 'transparent-background',
      category: 'converter',
      icon: 'Zap',                  // lucide-react
      accent: 'sky',
      status: 'coming_soon',        // 'live' when module complete
      isNew: true,
      order: 16,                    // tune as desired
      keywords: ['배경제거','투명','배경투명','로컬','privacy','remove background','transparent','single-color','local'],
    },
    ```
    Also add slug→component branch (&lt;TransparentBackgroundMaker/&gt;) and generateMetadata branch (title/description/JSON-LD) in tool route alongside qr-code/ladder/qna-a-day. No new category label needed.
  </platform_registry_change>
  <critical_paths>
    1. Image upload: FileReader → canvas render → get dimensions.
    2. Corner detection: sample corners → dominant color → display swatch.
    3. Color removal: tolerance + feather + mode → pixel iteration → alpha blending.
    4. Export: canvas.toBlob → PNG download (or clipboard copy).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/transparent-background/{schema,color-distance,corner-detect,transparency,feather,export}.ts Vitest (RED→GREEN): zod types, RGB distance, corner sampling, removal logic, feather blend, blob export.
    2. useTransparencyRemover hook (image load + corner detect + removal + localStorage).
    3. components/tools/transparent-background/ presentational (upload, color picker, eyedropper, sliders, preview, export).
    4. TransparentBackgroundMaker.tsx orchestrator.
    5. Keyboard shortcuts, motion-reduce, a11y (axe, focus-visible).
    6. TransparentBgIntro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD via lib/seo.ts.
    7. Registry status→coming_soon; slug→component + generateMetadata branches; E2E 1–5; visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <testing_strategy>Pure Vitest ≥80% (color-distance, corner-detect, transparency, feather, export); component mocks for canvas (jsdom); E2E scenarios 1–5 (upload→detect→tolerance→download, eyedropper, flood-fill vs global, large image, JSON-LD); realistic test images (white background, cream background, logo on transparent).</testing_strategy>
  <tool_usage>Reader visual-gate: 320/768/1024 screenshots, no overflow, eyedropper crosshair visible, tolerance preview real-time, download works, checkerboard visible, JSON-LD primed HTML, privacy claim confirmed (no network calls in DevTools).</tool_usage>
</key_implementation_notes>

</project_specification>
```
