# SEKRET TOOLS LAB 4.0

Локальная творческая лаборатория для фотографии, звука и генеративной графики.
Обновление существующего проекта. Оригинальные брендовые SVG, предыдущие фотоэффекты,
SEKRET1 / SEKRET2, слои и перенос PHOTO → AUDIO сохранены.

## Запуск

Нужен Node.js 20+. Внешних npm-зависимостей нет. Фактический стек проекта — native ES modules,
Canvas 2D, WebGL и Web Audio, собственные сервер и сборщик; Vite не требуется.

```powershell
cd C:\Users\ASUS\Desktop\Figma\sekret_visual_lab
npm run dev
```

Откройте **http://127.0.0.1:5173**. `START_SEKRET.bat` также запускает приложение.
`file://` не поддерживается: ES modules и загрузка ресурсов требуют HTTP.

```powershell
npm run check
npm test
npm run build
npm run preview
```

Dev и preview используют один порт: сначала завершите предыдущий сервер.
`dist` — статический production-результат, без сторонних сервисов и установки пакетов.

## Быстрый творческий маршрут

1. PHOTO LABORATORY → Load Source → выберите фотоэффект.
2. Advanced / Source Settings → выберите область действия или комбинацию двух масок.
3. Make Reactive → изображение откроется в AUDIO LAB.
4. Material DNA → Extract Source DNA → выберите Particle Web, Ribbon Flow или Geometry Field.
5. Загрузите трек. Выберите Curated Look, затем настройте сигнал для нужного параметра.
6. Compose / Signal Duet включает вторую систему: Crossfade, Screen или Multiply.
7. Выберите формат, размер и FPS. Record начинает запись; повторное нажатие сохраняет файл.

## HOME

- Отдельные внутренние маски взгляда получены из исходного compound SVG; оригиналы не изменены.
- Зрачковые вырезы следуют указателю отдельно от внешней формы. Малый параллакс и сглаживание движения.
- Металлический свет, фаска, бордовый рефлекс и локальное оптическое преломление без нарисованного круга.
- Сохранены пропорции логотипа на узком экране. Текст отделён от глаз; обе лаборатории равноправны.
- Учитывается prefers-reduced-motion. В редакторах hero и его обработчики отключены.

## AUDIO LAB

15 семейств и 66 художественных вариантов. Curated Look задаёт исходные параметры; доступна дальнейшая
настройка без изменения сохранённых проектов. Карточки показывают реальные GPU-превью.

| Система | Технология / характер |
| --- | --- |
| Particle Web | Три слоя локальных сетей, постоянная топология ячеек, плавное включение узлов, локальные связи, глубина |
| Ribbon Flow | Три независимо деформируемых пучка волокон, многочастотное поле движения, кручение, сглаженные нити |
| Feedback Field | Ping-pong текстуры, рекурсивные zoom/rotation, перенос поля, затухание с учётом dt, threshold erosion |
| Fluid Blobs | Поле метаболов, аналитический градиент поверхности, освещение, блик, внутренние контуры |
| Geometry Field | Настоящий GPU mesh: плоскости, волновая поверхность, органическая сфера, тороид; perspective, depth buffer, normals, wireframe |
| Media Reactive | Реальный фото/видеоисточник, RGB displacement, блочная деформация, маска по содержимому |
| Reactive Typography | Flow, Particles, Stretch, Signal, Feedback, Chromatic; многострочный текст, шрифты, tracking, leading, alignment |
| Gradient Systems | Editorial Mesh, Spectral Gradient, Liquid Color Field, Threshold Field, Monochrome Topography |
| Liquid Glass | Метабольная линза, нормали, раздельное преломление каналов, Fresnel, отражение softbox, каустический акцент |
| Signal Lines | Сохранён исходный характер; улучшено сглаживание, доступны вариации гармоник и модуляция количества линий |
| Signal Corruption | Блочные разрывы, направленные полосы, контуры и сохраняющиеся цифровые следы |
| Voice Sculpture | Реальный waveform/spectrum, многослойная мембрана, тонкие внутренние линии и более прозрачный объём |

Не все системы являются физическими симуляциями: Particle Web — процедурное локальное поле,
Fluid Blobs — метаболы, а не Navier–Stokes. Geometry Field действительно использует трёхмерные вершины.

## Аудиомодуляция

Bass, Low, Low-Mid, Mid, High-Mid, High, Energy, Peak, Beat, FFT1–4,
Spectral Flux, Transient Accent, Rhythm Envelope и Waveform RMS.
У каждого параметра: base, source, strength, min/max, attack/release, add/multiply/replace,
invert, gain, threshold и linear/exponential/soft/smooth response.
Реальное модулированное значение видно рядом с ползунком.

Нормализация полос учитывает время и запас динамики; фон ниже порога не усиливается до максимума.
FFT вычисляется один раз, waveform/spectrum передаются в повторно используемые GPU-текстуры.
Количество нитей/связей меняется с плавным проявлением, без создания массивов частиц каждый кадр.

## Material DNA

Сначала загрузите Visual Source либо выполните Make Reactive из PHOTO.
Нажмите **Extract Source DNA**. Один анализ изображения 64×64 извлекает три тональные группы палитры,
контраст, яркость и выраженность краёв. Изображение далее служит пространственным полем:
тёмные области концентрируют узлы, яркостная структура изгибает ленты и деформирует mesh.
Influence управляет силой; переключатель отключает влияние структуры. Извлечённую палитру
можно затем редактировать отдельно. После перезапуска источник нужно relink; анализ и цвета сохраняются.
Это локальный анализ пикселей, не AI-сегментация и не генерация изображения по тексту.

## Compose и Sound Director

Signal Duet смешивает две системы в общем цветовом и параметрическом пространстве.
Это двухсистемная композиция, не произвольный node graph и не независимый многослойный таймлайн.
Media/Type требуют отдельного источника и доступны как основная система; их нельзя выбрать вторым слоем.
Liquid Glass преломляет загруженный источник, а при отсутствии источника — процедурный фон.
В режиме Compose оно смешивается со второй сценой; произвольная сцена пока не подаётся напрямую в линзу.

Sound Director анализирует декодируемый аудиофайл до 70 МБ, оценивает энергетику и BPM,
подбирает границы рядом с энергетическими переходами. Границы, сцена, метка и интенсивность редактируются.
BPM приблизительный: возможны ошибки половинного/двойного темпа. Метки INTRO/DROP и прочие — эвристика.
Активный Director имеет приоритет перед ручным Compose. Параметры сохраняются в проекте.

## PHOTO LAB

48 систем: сохранены существующие эффекты, добавлены Chrome Relief, Fiber Engraving, Contour Erosion, Glass Topography; доступны Adaptive Mosaic, Pixel Flow, Halftone Fracture,
Stipple Field и Lenticular Field. Adaptive Mosaic рекурсивно делит области по локальному содержимому;
Pixel Flow ориентирует смещения по яркостному градиенту; Stipple использует распределённые точки,
а Halftone Fracture — раздельные печатные сетки каналов.

Маски: All, Luminance, Shadows, Midtones, Highlights, Edges, Saturation, Low Saturation,
Hue Range и Local Contrast. Доступны threshold, feather, invert, strength, две области с Union/Intersection,
выбор hue и диагностический Preview Mask. Preview Mask не запекается в экспорт и Lab Bridge.
Маски применяются к изображению, входящему в данный эффект, то есть учитывают предыдущий стек.
Ползунок Amount — итоговая смесь эффекта; global color включает Hue/Saturation/Contrast/Brightness/Exposure/Gamma.

Поиск пресетов и кеш low-resolution превью. Hover показывает оригинал. Слои, blend modes,
порядок эффектов, seed, randomize и undo/redo сохранены. Независимая библиотека пользовательских пресетов
и избранное пока не добавлены: рабочие настройки сохраняйте как проект.

## Экспорт

PNG с альфа-каналом, JPEG, WebP; произвольная ширина до 8000 px, лимит 28 MP.
Match Preview использует тот же рендер и затем масштабирует результат: это честный WYSIWYG,
но масштабирование не создаёт дополнительной детализации. HD Reprocess пересчитывает исходные пиксели;
пиксельные узоры могут отличаться от preview. JPEG сводит прозрачность на белый фон.

WebM и настоящий MP4 — через поддерживаемый MediaRecorder MIME. Для MP4 со звуком проверяется AAC MIME.
Если браузер не поддерживает его, остаётся WebM; существующий локальный FFmpeg endpoint сохранён как
необязательная альтернатива. Установка FFmpeg не требуется для обычного WebM и нативного MP4.
Неподдерживаемый MP4 не переименовывается из WebM.

Запись: 720p/1080p/1440p/2160p, 24/30/60 FPS, выбранное соотношение сторон. Размер обозначает высоту кадра;
максимальная сторона ограничена возможностями renderer. Запись realtime: выбранный FPS — запрос кодеку,
а не гарантия скорости GPU. Держите вкладку видимой. При скрытии вкладки запись завершается и сохраняется.
При 224 МБ накопленных данных запись также автоматически сохраняется. Источник звука не останавливается
при завершении записи: используются клоны tracks. Смена сцены/размера блокируется на время записи.

## Производительность и надёжность

- Шейдер специализируется по активной сцене/паре; кеш до пяти программ.
- Canvas и WebGL-контекст сохраняются при смене панелей, пресетов и палитр.
- Feedback хранит цвет до display grading; экспозиция и гамма больше не накапливаются рекурсивно.
- Geometry buffers создаются один раз. Цветовые и сигнальные typed arrays переиспользуются.
- Performance/Balanced/Quality плюс уменьшение preview при низком FPS. Запись имеет отдельный размер.
- Невидимая вкладка не рендерит preview. Восстановление WebGL-контекста пересоздаёт ресурсы.
- Canvas2D fallback доступен при недоступном WebGL; он проще и не повторяет все новые GPU-материалы.

## Совместимость

SEKRET2 остаётся текущим кодом, схема JSON — 2, appVersion — 4.0.0.
Сохранён загрузчик SEKRET1. Новые optional fields: variants, compose, dna, typeLayout/typeFont,
recordFormat/recordSize/recordFPS, расширенные color/map/mask. Старые проекты получают defaults.
Исходные фото, музыка, видео и локальные шрифты не встраиваются в JSON: relink после открытия.
Lab Bridge передаёт PNG-снимок плюс метаданные стека; полноценного живого effect graph между редакторами нет.

## Проверка

`npm test` — 13 регрессионных тестов: маски, hue wrap, смеси, modulation, DNA, диапазоны пресетов,
project code, Sound Director, темп и mesh buffers.
Откройте **http://127.0.0.1:5173/tools/qa.html** для воспроизводимой GPU/codec-проверки.
Диагностическая страница использует только синтетические данные и не меняет autosave проекта.

В проверенной среде Windows / Chromium 157 / Intel UHD Graphics:
- 51 shader variant: компиляция и непустой результат, без GL errors;
- 37 фотоэффектов: обработка, размер, альфа;
- PNG/JPEG/WebP: encode/decode;
- WebM + audio и MP4 + audio: по две последовательные записи, decode и живой исходный track;
- MP4 из редактора: 1280×720, 18.345813 s, H.264 + AAC, повторно открыт как media source;
- PHOTO → маски → PNG → Bridge → DNA → mesh → Project Code restore: пройдено;
- Geometry Field: наблюдалось 57 FPS при 816×459. Это наблюдение одного режима, не гарантия 1080p60;
- HOME проверен при 390 px и на desktop.

Длительная запись 4K60, все браузеры/устройства, MP3 во всех кодировках, локальные шрифты после relink,
принудительная потеря WebGL-контекста и frame-accurate A/V sync не сертифицированы этим прогоном.
Настоящего offline-рендера с фиксированным timestep пока нет. Не обещайте универсальные 60 FPS.

## Структура

`src/home` — hero и входные карточки; `src/image` — фото, маски и эффекты;
`src/audio` — анализ, модуляция, WebGL, mesh, Material DNA, типографика и запись;
`src/project` — сохранение и миграция; `tools` — сервер, сборка, диагностика.
Точные исходные SVG сохранены, `sekret_eye_masks.svg` — отдельный производный asset.

Контакты: https://t.me/sekretiktg. Название дизайн-канала сохранено без выдуманной ссылки.
Все вычисления происходят локально; публикация и сторонние API не использовались.

## История: раннее визуальное усиление

Типографика теперь содержит девять пространственных и полноэкранных режимов: вращающийся цилиндр (Flow), пересекающиеся цилиндры (Orbit), перспективный тоннель (Tunnel), текстовая стена (Wall), деформируемая сетка (Stretch/Signal), рекурсивные надписи (Feedback), хроматические складки и фрагментация. Spatial Repetition управляет плотностью. Пользовательские текст и шрифты сохранены. Всего 54 художественных варианта. Точечная GPU-проверка девяти новых текстовых режимов пройдена; старый аудит повторно не запускался.

HOME: движение взгляда усилено более чем вдвое; добавлен заметный перспективный наклон всей экструдированной формы, динамическая глубина торцов и движущиеся отражения. Это 2.5D vector-mask rendering с перспективой, а не импортированная полигональная модель глаз. Оригинальные SVG сохранены.


## Обновление материалов и живого управления — 08.11.2026

Ползунок показывает вычисленное значение из того же кадра, что и рендер. Светлая отметка — ручная база; выделенный участок — диапазон. Перетаскивание или клавиши временно переключают параметр на редактирование базы. После отпускания управление возвращается сигналу. Для полного диапазона выберите REPLACE и STRENGTH 1. Модуляцию можно удалить отдельно от сброса базового значения.

Particle Web использует 9000 пространственных точек на предварительно интегрированном аттракторе Лоренца, пространственные соседства, GPU-деформацию и перспективу. Это процедурная геометрия, а не физическая симуляция частиц в реальном времени. Материал DNA сохраняет влияние на форму.

Hero — объёмная экструзия подписанного поля расстояний исходного векторного контура, с фасками и независимыми отверстиями глаз. Материал освещается процедурным студийным окружением; это не HDRI-файл и не полигональная модель.

Топографический режим Geometry хранит 96 срезов настоящего спектра, примерно 3.8 секунды при 25 срезах/с. При паузе история сохраняется; при смене источника сбрасывается. Без аудио используется явно обозначенный демонстрационный сигнал.

Мембраны, хром, контурный распад, замкнутые сигнальные формы, голосовое кольцо и типографическая сфера имеют отдельную структуру. Новые фотоэффекты используют яркостные градиенты и нормали; размер их деталей масштабируется относительно изображения. У очень мелких элементов на малом предпросмотре остаётся ограничение дискретизации.

В этом обновлении проверялись только изменённые рендеры, фотопроцессоры и управление. Старые результаты общего тестирования выше не являются новым прогоном.

## Обновление — 09.11.2026

Hero: исправлено направление вертикального наклона, добавлены поля SDF для устранения выступа над бровью, осветлён жемчужно-хромовый материал.
Карточки HOME автоматически подключают `public/assets/brand/photo_visual_lab_preview.png` и `audio_visual_lab_preview.png`, когда файлы появятся; до этого показывают штатную композицию.

AUDIO: Spectral Bloom (пространственные нити), Phase Torus (объёмная узловая поверхность), горизонтальная многослойная Voice Sculpture и TYPE RIBBON SCULPTURE. Усилены начальные настройки существующих семейств. Signal Lines сохраняет бордово-розовую палитру. Пространственные сцены поддерживают drag, wheel, стрелки и RESET VIEW; ракурс сохраняется в проекте.
CAPTURE PNG сохраняет кадр в выбранном размере записи с текущим ракурсом. Фото: RISO DUOTONE, CONTOUR FOIL, LIQUID MARBLING; уточнено действие контраста Adaptive Mosaic и Pixel Flow.

Проверены только новые/изменённые части: девять GPU-вариантов, три фотопроцессора, направление hero, камера мышью/клавишами, экспорт PNG 1920×1080. В интерактивном предпросмотре 480×270 наблюдалось около 52–59 FPS. Новые аудиосцены проверялись с DEMO-сигналом; это не повторная проверка всех аудиофайлов, кодеков или длительной записи 4K.


## Next generation interaction — 09.11.2026

### Dual Identity
Hero retains the original SVG-derived SDF volume. A CPU ray march samples the same signed fields and inverse model rotation as the GPU. Four local-space contacts fade out independently: the shell reveals procedural glyphs, grid seams and wine-colored fibers only on hit surfaces. Radius is derived from CSS pixels, projection and viewport scale. Recovery provides hover hysteresis. The neutral face is silver-white, the side walls graphite. Internal art direction lives in `DUAL_IDENTITY` in `src/home/Hero.js`; these fixed application defaults are not user project parameters.

### Musical response
`Modulator.beginFrame` computes normalized source activity and transient edges once. Continuous controls use exponential attack/release; Beat and Transient use a bounded attack/decay envelope. Smoothness changes time constants, Trigger Rate selects every 1/2/4 event or minimum custom interval, Intensity scales amplitude independently. Custom Interval gates incoming events; it does not synthesize beats. SNAPPY / SMOOTH / PULSE / FLOAT share the same engine. Gain, threshold, cooldown, curve, invert, range and modes remain advanced controls. Legacy Depth retains old mapping strength for compatibility.

Signal Lines, Ribbon Flow and Voice Sculpture use stable filament positions with opacity activation. Particle Web and Geometry retain preallocated GPU geometry and fractional visibility. Rendering receives continuous effective counts. Live thumb, separate marker, base marker, numeric output and activity use the computed values; control feedback is limited to 20 Hz. Dragging a value edits the base.

### Direct interaction
Particle Web, Ribbon Flow, Fluid Blobs, Geometry Field and Reactive Typography support ATTRACT, REPEL, DRAG and DISTORT. The particle renderer deforms vertices around a cursor ray; geometry supports indentation and a radial wave; fluid/ribbons/type use local field deformation. These are bounded procedural forces with inertial input and recovery, not a fluid dynamics solver or persistent particle integration.
ORBIT remains available for Particle Web, Geometry, Typography, Spectral Bloom and Phase Torus. Left drag performs the chosen operation; right drag rotates spatial scenes, wheel zooms, RESET VIEW restores the camera. Touch supports a single captured pointer; two-finger pan/pinch is not implemented.

### Photo
SELECTIVE DITHER uses luminance and local edges to select an ordered ink pattern. SHADOW FRAGMENTATION uses shadow energy and edge direction to displace tiles while protecting edges. Detail is expressed relative to image size; very fine features remain subject to preview sampling. There are now 46 photo systems; previous identifiers and effect stack are retained.

### Reuse and future recording
AudioGPU accepts ordinary values: time, parameters, signals, image, camera, interaction and stroke. InteractionController has no audio dependency, Modulator has no UI/GPU dependency. A future Generative Laboratory can drive this same interface with constant signals or an autonomous clock. No empty third card has been added.
Future interaction event contract: `{timestamp, type, coordinates:[u,v], strength, duration, targetScene}` with seconds relative to playback and normalized coordinates. Recording/replaying these events is not yet implemented. Current live capture records the rendered interaction; project reload restores settings, not gesture history.

### Compatibility and validation
Schema 2 remains additive: mappings persist smoothness, intensity, triggerRate, interval, cooldown and envelope settings; per-scene interaction mode and camera are saved. Legacy settings receive missing defaults. Base values, never live samples, are serialized. Schema 1 migration and Project Code roundtrip were exercised by `node tools/response-check.mjs`.
Focused checks: dt invariance at 30/120 Hz, sustained peak preservation, independent intensity, event rates 1/2/4/custom and bounded envelopes. GPU comparison tested all four forces in the five interactive scenes; seven changed scene renders and two new photo processors produced nonempty output without GL errors. Browser checks covered local hero reveal and recovery, response controls, mouse deformation, project save and PNG 1920×1080 capture. Performance observed about 36–41 FPS around 589×331–693×389 in this session; not a 4K guarantee. Full codec/long-recording/cross-device audit was not repeated.

HOME preview files remain `public/assets/brand/photo_visual_lab_preview.png` and `audio_visual_lab_preview.png`; recommended source 1920×1080, object-fit cover with fallback.

## Presentation update — 10.11.2026

Three working laboratories: PHOTO, AUDIO and GENERATIVE. The home screen has three equal cards, an immediate three-way navigator and a procedural preview for the third entry. Custom photo/audio previews still load from `public/assets/brand/`.

Hero reveal uses eight fading local-space contacts and three overlapping anisotropic patches per contact. The field follows the eye sweep, crosses bevels, and reveals a parallax-shifted structured interior with relief lighting. Neutral shell, original contour and gaze direction remain intact. `heroSettings` is stored in project files and sanitized through `heroConfig.js`; configuration is internal, without another home inspector.

GENERATIVE LABORATORY is an independent workspace using the shared GPU renderer. Nine systems work without a source file: Material Resonance, Particle Web, Ribbon Flow, Geometry Field, Reactive Typography, Gradient Systems, Liquid Glass, Spectral Bloom, Phase Torus. Controls: curated looks, base parameters, palettes, composition seed (deterministic phase offset), speed, pause/rewind, camera and applicable local forces. It supports PNG capture, silent WebM recording, aspect ratio, output height, recording FPS, project save/load, Project Code and undo/redo for captured edits. Scene changes, resets and parameter drags capture undo states; not every text/keyboard edit is separately grouped.

Material Resonance adds a ray-marched standing-wave surface with silver, engraved and wine treatments, shared by Audio and Generative. PARTICLE TYPE FIELD samples the actual typeset texture into GPU points and deforms them in 3D. Type size, multiline fitting, tracking, leading, alignment and local fonts work through a shared texture builder. Fonts must be relinked after reopening.

Existing systems received targeted refinements: structural connection activation in Particle Web; contour/lattice layering in Feedback Field; image-gradient relief in Media Reactive; quieter folded highlights in Gradients; fractional lens activation in Liquid Glass; structured code details in Signal Corruption. Signal Lines and the existing response engine retain their behavior. There are 15 audio families / 66 looks, 48 photo effects and 9 systems exposed in Generative.

Photo additions: INTAGLIO ENGRAVING (luminance-controlled crosshatching bent by content gradients) and EDGE LENS (gradient refraction and edge caustics). Existing identifiers, masks, layers and Bridge are retained.

Performance: shared cached shader programs, reused geometry and parameter buffers, no audio analysis in Generative, adaptive preview resolution, separate export resolution, inactive render loops stopped. Video recording stops on leaving the workspace or hiding the tab. Generative recordings are real WebM, not renamed MP4.

Validation this iteration: ten changed GPU looks rendered without GL errors; two new photo processors produced valid opaque output on the diagnostic image. Hero contact and larger reveal inspected in the browser. Generative entry, type field, pause, palette/parameter UI, export size, Project Code restoration and switching between Audio/Generative exercised. PNG output verified at 1920×1080 and 1280×720. A new 1280×720 WebM was decoded in Chromium into a nonempty video frame. Observed type preview around 33 FPS at 804×452 on this machine; no universal FPS claim. Old full audit and codec suite were not repeated.

Limitations: no gesture replay or offline frame-accurate renderer; local forces are procedural, not fluid dynamics. The new workspace exports silent WebM and PNG; audio/video export with sound remains in Audio Lab. Mobile gesture coverage and long 4K recordings were not re-certified. Old builds cannot open the new `generative` lab identifier; this build still accepts old image/audio schema-2 files and schema-1 migration.
