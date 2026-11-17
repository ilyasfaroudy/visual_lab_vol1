# 2026-11-10 — Three laboratories / presentation update

- Wider surface-aligned Dual Identity with layered relief.
- Independent Generative Laboratory with nine systems, projects, PNG and silent WebM.
- Material Resonance and actual GPU particle typography; shared type layout.
- Content relief, layered feedback, structural connections and smooth glass activation.
- Intaglio Engraving and Edge Lens photo processors.
- Persisted generative and hero settings; legacy schema retained.

# 2026-11-09 — Dual Identity / Intelligent Response / Direct Interaction

- Surface-bound hero reveal, clean shell and recovery.
- Shared envelopes, event gating and independent response controls.
- Stable structural activation and throttled live feedback.
- Four local force modes in five systems, separate camera control.
- Selective Dither and Shadow Fragmentation.
- Additive settings persistence, targeted regression checks.

## Обновление — 09.11.2026

Hero: исправлено направление вертикального наклона, добавлены поля SDF для устранения выступа над бровью, осветлён жемчужно-хромовый материал.
Карточки HOME автоматически подключают `public/assets/brand/photo_visual_lab_preview.png` и `audio_visual_lab_preview.png`, когда файлы появятся; до этого показывают штатную композицию.

AUDIO: Spectral Bloom (пространственные нити), Phase Torus (объёмная узловая поверхность), горизонтальная многослойная Voice Sculpture и TYPE RIBBON SCULPTURE. Усилены начальные настройки существующих семейств. Signal Lines сохраняет бордово-розовую палитру. Пространственные сцены поддерживают drag, wheel, стрелки и RESET VIEW; ракурс сохраняется в проекте.
CAPTURE PNG сохраняет кадр в выбранном размере записи с текущим ракурсом. Фото: RISO DUOTONE, CONTOUR FOIL, LIQUID MARBLING; уточнено действие контраста Adaptive Mosaic и Pixel Flow.

Проверены только новые/изменённые части: девять GPU-вариантов, три фотопроцессора, направление hero, камера мышью/клавишами, экспорт PNG 1920×1080. В интерактивном предпросмотре 480×270 наблюдалось около 52–59 FPS. Новые аудиосцены проверялись с DEMO-сигналом; это не повторная проверка всех аудиофайлов, кодеков или длительной записи 4K.

# 2026-11-08 — Material / live control update

- Live modulation thumbs, base markers, mapped ranges, source activity, keyboard/pointer editing and independent reset.
- GPU spatial particle renderer with pre-integrated Lorenz attractor and bounded neighbour graph.
- Volumetric SDF hero with bevels, studio metal and independent eye apertures.
- Folded membranes, chrome reflections, coherent erosion, spectral history terrain, source-gradient media and TYPE PLANET.
- Four additional photo processors and resolution-relative detail for the newer families.
- Existing saved project identifiers retained.


## Финальное визуальное усиление

Типографика теперь содержит девять пространственных и полноэкранных режимов: вращающийся цилиндр (Flow), пересекающиеся цилиндры (Orbit), перспективный тоннель (Tunnel), текстовая стена (Wall), деформируемая сетка (Stretch/Signal), рекурсивные надписи (Feedback), хроматические складки и фрагментация. Spatial Repetition управляет плотностью. Пользовательские текст и шрифты сохранены. Всего 54 художественных варианта. Точечная GPU-проверка девяти новых текстовых режимов пройдена; старый аудит повторно не запускался.

HOME: движение взгляда усилено более чем вдвое; добавлен заметный перспективный наклон всей экструдированной формы, динамическая глубина торцов и движущиеся отражения. Это 2.5D vector-mask rendering с перспективой, а не импортированная полигональная модель глаз. Оригинальные SVG сохранены.

# v4.0 — 2026-11-07

Обновление на месте: GPU specialization + bounded program cache, separate feedback/display pipeline,
stable WebGL canvas, reusable buffers, true 3D parametric mesh, normal-based fluid/glass,
antialiased filaments, 51 curated looks, audio response curves/gain/threshold, tempo estimate,
editable Director boundaries, Signal Duet, Material DNA, typography layout/local font loading,
five new photo algorithms, combined content masks, mask preview, exposure/gamma,
real scene thumbnails, configurable recording resolution/FPS, cloned recording tracks,
capture memory limit, hidden-tab save, GPU context recovery, mobile aspect correction.

Original SVG files and project schema 2 are retained. See README for verification and limitations.

---

## v3.1 — Visual depth
Improved scene shader complexity; audio waveform/spectrum data textures, new VOICE SCULPTURE, audio-driven line count, six photo presets, preserved-logo gaze direction and editorial typography. Tested WebGL rendering with software GPU; hardware performance unverified.

# SEKRET TOOLS LAB — CHANGELOG

## v3.0.0 — 04.11.2026

This version **continues** the existing v0.2.0 JavaScript/CSS app. Source modules, 26 IMAGE presets, 11 AUDIO scenes, legacy code, SVG brand assets, old project settings and export entry points are retained.

### Product-level features
- **Reactive Masking (IMAGE LAB):** Shadows, midtones, highlights, contours, saturation and desaturation, with adjustable threshold/feather and inversion. Mask is evaluated against the input to each individual effect pass, including after earlier effects.
- **Reactive Masking (AUDIO / MEDIA REACTIVE):** Shader-based region selection on uploaded video/photo, with assignable frequency source for mask threshold and a Canvas 2D approximation.
- **Lab Bridge:** MAKE REACTIVE sends the current processed image into AUDIO LAB as an actual PNG File, assigns it as the media texture, and saves metadata describing the source composition. The source image is baked for the bridge; the individual IMAGE filters aren't continuously animated there.
- **Sound Director:** Decodes MP3/WAV waveform, computes coarse energy segments, builds an editable arrangement with per-section labels, reactive intensity and supplemental visual system. On WebGL, scenes are crossfaded in the shader without replacing the recording canvas; on Canvas 2D, compositing is simplified. It is a heuristic, not a musicological song-structure model.
- **MP4:** Browser-native MediaRecorder where supported, otherwise a local FFmpeg conversion endpoint using WebM intermediate. Source audio is recorded alongside video; output is encoded H.264/AAC when FFmpeg is present.
- **Export:** Default MATCH PREVIEW mode uses the exact same processing resolution as the canvas (WYSIWYG composition) and can resize the result; HD REPROCESS separately works from source pixels with honest differences in pixel-based effects.
- **HOME:** Sharper SVG treatment, restrained burgundy lighting and local gaze distortion in the WebGL hero, HOME-only burgundy liquid lens; more usable labels and compact footer.
- **IMAGE card:** renamed to PHOTO LAB; navigation keeps the internal `image` project ID for backward compatibility.

### Performance / QA
- Texture media updates use texSubImage2D when dimensions are unchanged; video frames are skipped if time is unchanged.
- CPU fallback mask computation works on a bounded low-resolution mask.
- Audio frequency band signal is automatically normalized with decaying peak estimates.
- Added Node.js tests for masks, song structure and v2 code compatibility.
- Node checks, static build and browser Canvas 2D smoke workflow are used in QA. GPU hero/WebGL shader execution could not be verified in the restricted test browser.

### Known limitations
- Sound Director analyzes audio files under ~70 MB that the browser can decode; it does not analyze the structure of a separate soundtrack embedded in every video format.
- With media effects in Lab Bridge, editing earlier IMAGE parameters requires returning to IMAGE LAB and bridging again.
- MP4 needs compatible native browser recording support or FFmpeg on the machine running SEKRET's Node local server. The static `dist/` deployment has no local transcoding endpoint.
- Canvas 2D fallback and WebGL rendering are not pixel-identical; performance depends on the graphics device.
- The sound arrangement and simulation still use realtime capture; this is not frame-accurate offline video rendering.
