window.__ModuleLoader__.load({
  id: 'dsh-wallpaper',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    var react = require('react');

    function apply(ctx) {
      var slots = ctx.get('slots')
      if (slots === undefined) return
      var theme = ctx.get('theme')
      if (theme === undefined) return

      var DB_NAME = 'dsh-wallpaper'
      var DB_VERSION = 1
      var DB_STORE = 'wallpaper'
      var DB_KEY = 'current'

      function openDb() {
        return new Promise(function (resolve, reject) {
          if (typeof indexedDB === 'undefined') { reject(new Error('indexedDB unavailable')); return }
          var req = indexedDB.open(DB_NAME, DB_VERSION)
          req.onupgradeneeded = function () {
            var db = req.result
            if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE)
          }
          req.onsuccess = function () { resolve(req.result) }
          req.onerror = function () { reject(req.error) }
        })
      }

      function loadWallpaper() {
        return openDb().then(function (db) {
          return new Promise(function (resolve, reject) {
            var req = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(DB_KEY)
            req.onsuccess = function () { resolve(req.result || null) }
            req.onerror = function () { reject(req.error) }
          })
        })
      }

      function saveWallpaper(blob, fileName, veil, kind, typo) {
        return openDb().then(function (db) {
          return new Promise(function (resolve, reject) {
            var tx = db.transaction(DB_STORE, 'readwrite')
            tx.objectStore(DB_STORE).put({ blob: blob, fileName: fileName, veil: veil, kind: kind || null, typo: typo || null, savedAt: Date.now() }, DB_KEY)
            tx.oncomplete = function () { resolve() }
            tx.onerror = function () { reject(tx.error) }
          })
        })
      }

      function clearWallpaper() {
        return openDb().then(function (db) {
          return new Promise(function (resolve, reject) {
            var tx = db.transaction(DB_STORE, 'readwrite')
            tx.objectStore(DB_STORE).delete(DB_KEY)
            tx.oncomplete = function () { resolve() }
            tx.onerror = function () { reject(tx.error) }
          })
        })
      }

      var FONTS = [
        { id: 'default', label: '默认（跟随 DSH）', family: '' },
        { id: 'fz', label: '方正粗体', family: "'FZLanTingHei-B-GBK','FZLanTingHei','方正兰亭黑','FZHei-B01','方正黑体','SimHei','Microsoft YaHei',sans-serif" },
        { id: 'hei', label: '黑体 SimHei', family: "'SimHei','Heiti SC','Microsoft YaHei',sans-serif" },
        { id: 'yahei', label: '微软雅黑', family: "'Microsoft YaHei','微软雅黑',sans-serif" },
        { id: 'noto', label: '思源黑体 Noto Sans SC', family: "'Noto Sans SC','Source Han Sans SC',sans-serif" },
        { id: 'system', label: '系统无衬线', family: 'sans-serif' },
      ]

      var state = {
        currentBlob: null,
        currentFileName: null,
        currentKind: null,
        veil: 60,
        styleTag: null,
        videoEl: null,
        captionTag: null,
        disposeTheme: null,
        blobUrl: null,
        captionFont: '',
        captionFg: null,
        captionBg: null,
        bgOpacity: null,
        captionSize: null,
        captionSpacing: null,
        captionLineHeight: null,
        strokeColor: null,
        strokeWidth: null,
        strokeOpacity: null,
      }

      function hexToRgb(hex) {
        var h = String(hex || '').replace('#', '')
        if (h.length === 3) h = h.split('').map(function (c) { return c + c }).join('')
        var n = parseInt(h, 16)
        if (isNaN(n)) return '0,0,0'
        return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255)
      }

      function bgAlpha(bg) {
        if (state.bgOpacity == null || state.bgOpacity >= 100) return bg
        return 'rgba(' + hexToRgb(bg) + ',' + (state.bgOpacity / 100) + ')'
      }

      function collectTypo() {
        return {
          font: state.captionFont,
          fg: state.captionFg,
          bg: state.captionBg,
          bgOpacity: state.bgOpacity,
          size: state.captionSize,
          spacing: state.captionSpacing,
          lineHeight: state.captionLineHeight,
          strokeColor: state.strokeColor,
          strokeWidth: state.strokeWidth,
          strokeOpacity: state.strokeOpacity,
        }
      }

      function applyTypo(t) {
        if (!t) return
        if (t.font !== undefined) state.captionFont = t.font || ''
        if (t.fg !== undefined) state.captionFg = t.fg || null
        if (t.bg !== undefined) state.captionBg = t.bg || null
        if (t.bgOpacity !== undefined) state.bgOpacity = t.bgOpacity == null ? null : Number(t.bgOpacity)
        if (t.size !== undefined) state.captionSize = t.size == null ? null : Number(t.size)
        if (t.spacing !== undefined) state.captionSpacing = t.spacing == null ? null : Number(t.spacing)
        if (t.lineHeight !== undefined) state.captionLineHeight = t.lineHeight == null ? null : Number(t.lineHeight)
        if (t.strokeColor !== undefined) state.strokeColor = t.strokeColor || null
        if (t.strokeWidth !== undefined) state.strokeWidth = t.strokeWidth == null ? null : Number(t.strokeWidth)
        if (t.strokeOpacity !== undefined) state.strokeOpacity = t.strokeOpacity == null ? null : Number(t.strokeOpacity)
      }

      function buildCaptionCss(family, mode) {
        var light = mode !== 'dark'
        var baseSel = light ? 'body:not([data-ds-dark-theme])' : 'body[data-ds-dark-theme]'
        var autoBg = light ? '#ffffff' : '#151517'
        var autoFg = light ? '#000000' : '#ffffff'
        var fg = state.captionFg || autoFg
        var bg = state.bgOpacity === 0 ? null : (state.captionBg || autoBg)
        var font = family ? ('font-family:' + family + ' !important;font-weight:700 !important;') : ''
        var size = state.captionSize != null ? ('font-size:' + state.captionSize + 'px !important;') : ''
        var spacing = state.captionSpacing != null ? ('letter-spacing:' + state.captionSpacing + 'px !important;') : ''
        var lineH = state.captionLineHeight != null ? ('line-height:' + state.captionLineHeight + ' !important;') : ''
        var stroke = ''
        if (state.strokeColor && state.strokeWidth != null && state.strokeWidth > 0) {
          var sa = state.strokeOpacity != null ? state.strokeOpacity / 100 : 1
          stroke = '-webkit-text-stroke:' + state.strokeWidth + 'px rgba(' + hexToRgb(state.strokeColor) + ',' + sa + ') !important;'
        }
        var base = font + size + spacing + lineH + stroke
        var colorDecl = 'color:' + fg + ' !important;'
        var bgDecl = bg === null ? '' : ('background-color:' + bgAlpha(bg) + ';')
        var leafBg = bg === null ? '' : ('background-color:' + bgAlpha(bg) + '!important;')
        var tableBg = bg === null ? 'transparent' : bgAlpha(bg)
        var chip = bgDecl + colorDecl + 'border-radius:4px;' + base
        var plate = bgDecl + colorDecl + 'border-radius:8px;' + base
        var leaf = ' *:not(:has(*)):not(:empty):not([data-mode])'
        var tags = ' p, li, blockquote, pre, label, summary, figcaption, caption, h1, h2, h3, h4, h5, h6'
        var cells = ' td, th'
        var divInline = ' div:not([data-mode]):has(> span, > a, > code, > strong, > em, > b, > i, > u, > s, > small, > mark, > time, > br)'
        var ph = ' input::placeholder, textarea::placeholder'
        return baseSel + leaf + '{' + chip + leafBg + '}'
          + baseSel + tags + '{' + plate + '}'
          + baseSel + cells + '{' + colorDecl + base + 'background-color:transparent!important;border-radius:0!important;}'
          + baseSel + ' li{' + base + 'list-style-position:inside!important;}'
          + baseSel + ' table{' + base + 'border-collapse:separate!important;border-spacing:0!important;border-radius:8px!important;background-color:' + tableBg + '!important;}'
          + baseSel + divInline + '{' + plate + '}'
          + baseSel + ph + '{' + chip + '}'
      }

      function ensureCaptionTag() {
        var mode = 'light'
        try { if (theme.getTheme().active.colorScheme === 'dark') mode = 'dark' } catch (err) {}
        if (state.captionTag) { state.captionTag.remove(); state.captionTag = null }
        var tag = document.createElement('style')
        tag.dataset.plugin = 'dsh-wallpaper'
        tag.textContent = buildCaptionCss(state.captionFont, mode)
        document.head.append(tag)
        state.captionTag = tag
      }

      function removeCaptionTag() {
        if (state.captionTag) { state.captionTag.remove(); state.captionTag = null }
      }

      function applyVideo(url) {
        if (state.videoEl) removeVideo()
        var v = document.createElement('video')
        v.dataset.plugin = 'dsh-wallpaper'
        v.muted = true
        v.loop = true
        v.playsInline = true
        v.src = url
        v.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:-1;pointer-events:none;background:#000;'
        document.body.append(v)
        state.videoEl = v
        var p = v.play()
        if (p && typeof p.then === 'function') p.then(function () {}).catch(function () {})
      }

      function removeVideo() {
        if (!state.videoEl) return
        try { state.videoEl.pause() } catch (err) {}
        state.videoEl.remove()
        state.videoEl = null
      }

      function applyVeil(v) {
        var a = String(v / 100)
        if (state.disposeTheme) { state.disposeTheme(); state.disposeTheme = null }
        var unified = {
          light: 'rgba(255,255,255,' + a + ')',
          dark: 'rgba(21,21,23,' + a + ')',
        }
        var solid = {
          light: 'rgb(255,255,255)',
          dark: 'rgb(21,21,23)',
        }
        var solidHover = {
          light: 'rgb(241,243,245)',
          dark: 'rgb(31,33,36)',
        }
        var ghost = {
          light: 'rgb(241,243,245)',
          dark: 'rgb(27,29,32)',
        }
        var ghostHover = {
          light: 'rgb(233,236,242)',
          dark: 'rgb(34,36,40)',
        }
        var hoverTint = {
          light: 'rgba(0,0,0,0.06)',
          dark: 'rgba(255,255,255,0.08)',
        }
        state.disposeTheme = theme.overrideTokens('dsh-wallpaper', {
          '--dsw-alias-bg-base': unified,
          '--dsw-specific-sidebar-fill': unified,
          '--dsw-alias-bg-layer-1': solid,
          '--dsw-alias-bg-layer-2': solid,
          '--dsw-alias-bg-layer-3': solid,
          '--dsw-specific-input-major': solid,
          '--dsw-specific-bubble': solid,
          '--dsw-alias-markdown-code-block': solid,
          '--dsw-alias-markdown-inline-code': solid,
          '--dsw-alias-markdown-code-block-banner': solid,
          '--dsw-alias-bg-overlay': solid,
          '--dsw-specific-menu': solid,
          '--dsw-alias-button-elevated-fill': solid,
          '--dsw-alias-button-floating-fill': solid,
          '--dsw-alias-button-floating-hover': solidHover,
          '--dsw-alias-button-ghost-active-fill': ghost,
          '--dsw-alias-button-ghost-active-hover': ghostHover,
          '--dsw-alias-interactive-bg-hover': hoverTint,
          '--dsw-alias-interactive-bg-active': hoverTint,
          '--dsw-specific-sidebar-nav-item-active': ghost,
          '--dsw-specific-sidebar-nav-item-hover': ghostHover,
        })
      }

      function applyWallpaper(blob, fileName, veil, persist, kind, typo) {
        if (veil != null) state.veil = veil
        applyTypo(typo)
        if (state.blobUrl) URL.revokeObjectURL(state.blobUrl)
        var url = URL.createObjectURL(blob)
        state.blobUrl = url
        state.currentBlob = blob
        state.currentFileName = fileName
        var isVideo = kind === 'video' || (blob.type && blob.type.indexOf('video/') === 0)
        state.currentKind = isVideo ? 'video' : 'image'
        removeVideo()
        if (state.styleTag) { state.styleTag.remove(); state.styleTag = null }
        if (isVideo) {
          applyVideo(url)
        } else {
          var tag = document.createElement('style')
          tag.dataset.plugin = 'dsh-wallpaper'
          tag.textContent = 'body::before{content:"";position:fixed;top:0;right:0;bottom:0;left:0;z-index:-1;background:url("' + url + '") center/cover no-repeat;pointer-events:none;}'
          document.head.append(tag)
          state.styleTag = tag
        }
        ensureCaptionTag()
        applyVeil(veil)
        if (persist) persistNow()
        return url
      }

      function persistNow() {
        if (!state.currentBlob) return
        void saveWallpaper(state.currentBlob, state.currentFileName, state.veil, state.currentKind, collectTypo()).catch(function () {})
      }

      function restoreWallpaper() {
        void loadWallpaper().then(function (rec) {
          if (!rec || !rec.blob) return
          var typo = rec.typo || {
            font: rec.font || undefined,
            fg: rec.fontColor || undefined,
            bg: rec.bgColor || undefined,
            bgOpacity: rec.bgTransparent ? 0 : undefined,
          }
          applyWallpaper(rec.blob, rec.fileName || '已保存的背景', rec.veil != null ? rec.veil : 60, false, rec.kind || undefined, typo)
        }).catch(function () {})
      }

      function resetTypo() {
        state.captionFont = ''
        state.captionFg = null
        state.captionBg = null
        state.bgOpacity = null
        state.captionSize = null
        state.captionSpacing = null
        state.captionLineHeight = null
        state.strokeColor = null
        state.strokeWidth = null
        state.strokeOpacity = null
      }

      function clearAll() {
        removeVideo()
        if (state.styleTag) { state.styleTag.remove(); state.styleTag = null }
        state.currentBlob = null
        state.currentFileName = null
        state.currentKind = null
        removeCaptionTag()
        if (state.disposeTheme) { state.disposeTheme(); state.disposeTheme = null }
        if (state.blobUrl) { URL.revokeObjectURL(state.blobUrl); state.blobUrl = null }
        void clearWallpaper().catch(function () {})
      }

      ctx.effect(function () {
        return function () {
          removeVideo()
          if (state.styleTag) state.styleTag.remove()
          if (state.captionTag) state.captionTag.remove()
          if (state.disposeTheme) state.disposeTheme()
          if (state.blobUrl) URL.revokeObjectURL(state.blobUrl)
        }
      }, 'dsh-wallpaper: cleanup')

      ctx.on('theme/change', function () { if (state.styleTag) ensureCaptionTag() })

      restoreWallpaper()

      function clampNum(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

      function CropOverlay(props) {
        var imageUrl = props.imageUrl
        var mime = props.mime
        var pageRatio = props.pageRatio
        var onCancel = props.onCancel
        var onApply = props.onApply

        var imgElRef = react.useRef(null)
        var wrapRef = react.useRef(null)
        var imgSizeState = react.useState(null)
        var imgSize = imgSizeState[0]
        var setImgSize = imgSizeState[1]
        var cropState = react.useState(null)
        var crop = cropState[0]
        var setCrop = cropState[1]
        var dragRef = react.useRef(null)
        var busyState = react.useState(false)
        var busy = busyState[0]
        var setBusy = busyState[1]

        react.useEffect(function () {
          var img = new Image()
          img.onload = function () {
            var w = img.naturalWidth
            var h = img.naturalHeight
            var cw, ch
            if (w / h > pageRatio) { ch = h; cw = h * pageRatio } else { cw = w; ch = w / pageRatio }
            setImgSize({ w: w, h: h })
            setCrop({ x: (w - cw) / 2, y: (h - ch) / 2, w: cw, h: ch })
          }
          img.src = imageUrl
          imgElRef.current = img
          return function () { img.onload = null }
        }, [imageUrl, pageRatio])

        function onPointerDown(e) {
          if (!crop || busy) return
          var mode = 'move'
          if (e.target && e.target.dataset && typeof e.target.dataset.mode === 'string') mode = e.target.dataset.mode
          e.preventDefault()
          if (e.currentTarget.setPointerCapture) {
            try { e.currentTarget.setPointerCapture(e.pointerId) } catch (err) {}
          }
          var rect = wrapRef.current.getBoundingClientRect()
          dragRef.current = { mode: mode, startX: e.clientX, startY: e.clientY, rect: rect, crop: { x: crop.x, y: crop.y, w: crop.w, h: crop.h } }
        }

        function onPointerMove(e) {
          var d = dragRef.current
          if (!d || !imgSize) return
          var dx = (e.clientX - d.startX) / d.rect.width * imgSize.w
          var c = d.crop
          var MIN_W = 60
          if (d.mode === 'move') {
            var dy = (e.clientY - d.startY) / d.rect.height * imgSize.h
            setCrop({
              x: clampNum(c.x + dx, 0, imgSize.w - c.w),
              y: clampNum(c.y + dy, 0, imgSize.h - c.h),
              w: c.w,
              h: c.h,
            })
            return
          }
          var ax, ay, w1
          if (d.mode === 'se') { ax = c.x; ay = c.y; w1 = clampNum(c.w + dx, MIN_W, Math.min(imgSize.w - ax, (imgSize.h - ay) * pageRatio)) }
          else if (d.mode === 'nw') { ax = c.x + c.w; ay = c.y + c.h; w1 = clampNum(c.w - dx, MIN_W, Math.min(ax, ay * pageRatio)) }
          else if (d.mode === 'ne') { ax = c.x; ay = c.y + c.h; w1 = clampNum(c.w + dx, MIN_W, Math.min(imgSize.w - ax, ay * pageRatio)) }
          else { ax = c.x + c.w; ay = c.y; w1 = clampNum(c.w - dx, MIN_W, Math.min(ax, (imgSize.h - ay) * pageRatio)) }
          var h1 = w1 / pageRatio
          var x1 = d.mode === 'se' || d.mode === 'ne' ? ax : ax - w1
          var y1 = d.mode === 'se' || d.mode === 'sw' ? ay : ay - h1
          setCrop({ x: x1, y: y1, w: w1, h: h1 })
        }

        function onPointerEnd() { dragRef.current = null }

        function onApplyCrop() {
          if (!crop || !imgElRef.current || busy) return
          setBusy(true)
          var img = imgElRef.current
          var canvas = document.createElement('canvas')
          var scale = Math.min(1, 2560 / Math.max(crop.w, crop.h))
          canvas.width = Math.max(1, Math.round(crop.w * scale))
          canvas.height = Math.max(1, Math.round(crop.h * scale))
          var g = canvas.getContext('2d')
          g.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height)
          canvas.toBlob(function (blob) {
            setBusy(false)
            if (blob) onApply(blob)
          }, mime, 0.92)
        }

        var boxStyle = {
          position: 'absolute',
          left: crop ? crop.x / imgSize.w * 100 + '%' : 0,
          top: crop ? crop.y / imgSize.h * 100 + '%' : 0,
          width: crop ? crop.w / imgSize.w * 100 + '%' : 0,
          height: crop ? crop.h / imgSize.h * 100 + '%' : 0,
          border: '1.5px solid var(--dsw-alias-brand-primary)',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
          cursor: 'move',
          touchAction: 'none',
          pointerEvents: 'auto',
          boxSizing: 'border-box',
        }
        var handleBase = {
          position: 'absolute',
          width: 14,
          height: 14,
          background: 'var(--dsw-alias-brand-primary)',
          border: '2px solid #fff',
          borderRadius: 3,
          touchAction: 'none',
          pointerEvents: 'auto',
        }
        function handleStyle(pos) {
          var s = Object.assign({}, handleBase)
          if (pos === 'nw') { s.top = -7; s.left = -7; s.cursor = 'nwse-resize' }
          else if (pos === 'ne') { s.top = -7; s.right = -7; s.cursor = 'nesw-resize' }
          else if (pos === 'sw') { s.bottom = -7; s.left = -7; s.cursor = 'nesw-resize' }
          else { s.bottom = -7; s.right = -7; s.cursor = 'nwse-resize' }
          return s
        }

        var overlayStyle = { position: 'absolute', inset: 0, pointerEvents: 'none' }

        return react.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
          react.createElement('div', {
            ref: wrapRef,
            style: { position: 'relative', alignSelf: 'center', maxWidth: '100%', overflow: 'hidden' },
            onPointerDown: onPointerDown,
            onPointerMove: onPointerMove,
            onPointerUp: onPointerEnd,
            onPointerLeave: onPointerEnd,
          },
            react.createElement('img', {
              ref: imgElRef,
              src: imageUrl,
              alt: '裁剪预览',
              style: { display: 'block', maxWidth: '100%', maxHeight: 320, width: 'auto', height: 'auto', borderRadius: 6 },
            }),
            crop && imgSize ? react.createElement('div', { style: overlayStyle },
              react.createElement('div', { style: boxStyle, 'data-mode': 'move' },
                react.createElement('span', { 'data-mode': 'nw', style: handleStyle('nw') }),
                react.createElement('span', { 'data-mode': 'ne', style: handleStyle('ne') }),
                react.createElement('span', { 'data-mode': 'sw', style: handleStyle('sw') }),
                react.createElement('span', { 'data-mode': 'se', style: handleStyle('se') })
              )
            ) : null
          ),
          react.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
            react.createElement('button', { onClick: onApplyCrop, disabled: busy, style: Object.assign({}, buttonStyleRef(), busy ? { opacity: 0.6, cursor: 'default' } : {}) }, busy ? '处理中…' : '应用裁剪'),
            react.createElement('button', { onClick: onCancel, style: buttonStyleRef() }, '取消')
          ),
          react.createElement('div', { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 12, lineHeight: 1.5 } },
            '裁剪框锁定为当前页面宽高比：拖动框移动位置，拖四个角调整大小，应用后作为背景铺满页面。'
          )
        )
      }

      function buttonStyleRef() {
        return {
          border: '1px solid var(--dsw-alias-border-l2)',
          borderRadius: 8,
          padding: '5px 12px',
          cursor: 'pointer',
          fontSize: 13,
          color: 'var(--dsw-alias-label-primary)',
          background: 'var(--dsw-alias-bg-layer-2)',
          userSelect: 'none',
          display: 'inline-block',
        }
      }

      function BgCard() {
        var useState = react.useState
        var useEffect = react.useEffect
        var createElement = react.createElement
        var imageUrlState = useState(null)
        var imageUrl = imageUrlState[0]
        var setImageUrl = imageUrlState[1]
        var fileNameState = useState(null)
        var fileName = fileNameState[0]
        var setFileName = fileNameState[1]
        var veilState = useState(state.veil)
        var veil = veilState[0]
        var setVeil = veilState[1]
        var messageState = useState('上传背景（图片或视频），立即成为 DeepSeek Harness 的背景')
        var message = messageState[0]
        var setMessage = messageState[1]
        var cropModeState = useState(false)
        var cropMode = cropModeState[0]
        var setCropMode = cropModeState[1]
        var cropSrcState = useState(null)
        var cropSrcUrl = cropSrcState[0]
        var setCropSrcUrl = cropSrcState[1]
        var cropMimeState = useState('image/jpeg')
        var cropMime = cropMimeState[0]
        var setCropMime = cropMimeState[1]
        var mediaKindState = useState('image')
        var mediaKind = mediaKindState[0]
        var setMediaKind = mediaKindState[1]

        useEffect(function () {
          var alive = true
          var previewUrl = null
          void loadWallpaper().then(function (rec) {
            if (!alive || !rec || !rec.blob) return
            previewUrl = URL.createObjectURL(rec.blob)
            if (alive) {
              setImageUrl(previewUrl)
              setFileName(rec.fileName || '已保存的背景')
              setVeil(rec.veil != null ? rec.veil : 60)
              if (rec.kind === 'video' || (rec.blob.type && rec.blob.type.indexOf('video/') === 0)) setMediaKind('video')
              setMessage('已恢复上次保存的背景（保存在本机浏览器中）')
            }
          }).catch(function () {})
          return function () { if (previewUrl) URL.revokeObjectURL(previewUrl); alive = false }
        }, [])

        function onFileChange(e) {
          var file = e.target.files && e.target.files[0]
          if (!file) return
          if (!file.type || (file.type.indexOf('image/') !== 0 && file.type.indexOf('video/') !== 0)) {
            setMessage('请选择图片或视频文件（PNG / JPG / WebP / GIF / MP4 / WebM / MOV 等）')
            return
          }
          var isVideo = file.type.indexOf('video/') === 0
          var url = applyWallpaper(file, file.name, veil, true, isVideo ? 'video' : 'image')
          setImageUrl(url)
          setFileName(file.name)
          setMediaKind(isVideo ? 'video' : 'image')
          setMessage(isVideo ? '已应用视频背景并保存。' : '已应用并保存到本机浏览器。可点「裁剪」调整构图以适配页面。')
        }

        function onVeilChange(e) {
          var v = Number(e.target.value)
          setVeil(v)
          state.veil = v
          applyVeil(v)
          persistNow()
        }

        function onReset() {
          clearAll()
          resetTypo()
          setImageUrl(null)
          setFileName(null)
          setCropMode(false)
          setMessage('已恢复默认背景。')
        }

        function onCropStart() {
          if (!state.currentBlob) return
          var url = URL.createObjectURL(state.currentBlob)
          setCropSrcUrl(url)
          setCropMime(state.currentBlob.type === 'image/png' ? 'image/png' : 'image/jpeg')
          setCropMode(true)
        }

        function onCropCancel() {
          if (cropSrcUrl) URL.revokeObjectURL(cropSrcUrl)
          setCropSrcUrl(null)
          setCropMode(false)
        }

        function onCropApply(blob) {
          if (cropSrcUrl) URL.revokeObjectURL(cropSrcUrl)
          setCropSrcUrl(null)
          setCropMode(false)
          var url = applyWallpaper(blob, (fileName || '已裁剪的背景') + '（已裁剪）', veil, true, 'image')
          setImageUrl(url)
          setFileName((fileName || '背景图') + '（已裁剪）')
          setMediaKind('image')
          setMessage('已应用裁剪结果并保存，刷新/重启后自动恢复。')
        }

        var containerStyle = {
          border: '1px solid var(--dsw-alias-border-l2)',
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          fontSize: 13,
          color: 'var(--dsw-alias-label-primary)',
          background: 'var(--dsw-alias-bg-layer-1)',
        }
        var rowStyle = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }
        var secondary = { color: 'var(--dsw-alias-label-secondary)', fontSize: 12 }
        var tertiary = { color: 'var(--dsw-alias-label-tertiary)', fontSize: 11, lineHeight: 1.5 }

        return createElement('div', { style: containerStyle },
          createElement('div', { style: rowStyle },
            createElement('span', { style: { fontWeight: 600 } }, '🖼️ 背景图'),
            !cropMode
              ? createElement('label', { style: buttonStyleRef() },
                  createElement('input', { type: 'file', accept: 'image/*,video/*', onChange: onFileChange, style: { display: 'none' } }),
                  imageUrl ? '更换背景' : '上传背景'
                )
              : null,
            !cropMode && imageUrl && mediaKind === 'image'
              ? createElement('button', { onClick: onCropStart, style: buttonStyleRef() }, '裁剪')
              : null,
            !cropMode && imageUrl
              ? createElement('button', { onClick: onReset, style: buttonStyleRef() }, '恢复默认')
              : null
          ),
          cropMode && cropSrcUrl
            ? createElement(CropOverlay, {
                imageUrl: cropSrcUrl,
                mime: cropMime,
                pageRatio: window.innerWidth / window.innerHeight,
                onCancel: onCropCancel,
                onApply: onCropApply,
              })
            : imageUrl
              ? createElement('div', { style: rowStyle },
                  mediaKind === 'video'
                    ? createElement('video', { src: imageUrl, muted: true, loop: true, autoPlay: true, playsInline: true, style: { maxHeight: 88, maxWidth: 140, borderRadius: 6, border: '1px solid var(--dsw-alias-border-l2)', objectFit: 'cover' } })
                    : createElement('img', { src: imageUrl, alt: '背景预览', style: { maxHeight: 88, maxWidth: 140, borderRadius: 6, border: '1px solid var(--dsw-alias-border-l2)', objectFit: 'cover' } }),
                  createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, flex: 1 } },
                    createElement('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, fileName),
                    createElement('div', { style: rowStyle },
                      createElement('span', { style: secondary }, '遮罩'),
                      createElement('input', { type: 'range', min: '0', max: '100', step: '1', value: String(veil), onChange: onVeilChange, style: { flex: 1, minWidth: 80 } }),
                      createElement('span', { style: Object.assign({}, secondary, { width: 34, textAlign: 'right' }) }, veil + '%')
                    )
                  )
                )
              : null,
          createElement('div', { style: Object.assign({}, secondary, { lineHeight: 1.5 }) }, message),
          createElement('div', { style: tertiary }, '支持图片与视频背景（视频静音循环、图片可裁剪）；文字样式（字体/字号/间距/描边/颜色等）请在「背景文字」分区调整；全部设置保存在本机浏览器，刷新/重启自动恢复。')
        )
      }

      function TextCard() {
        var useState = react.useState
        var createElement = react.createElement
        var fontState = useState(state.captionFont)
        var fontSel = fontState[0]
        var setFontSel = fontState[1]
        var sizeState = useState(state.captionSize != null ? state.captionSize : 14)
        var sizeVal = sizeState[0]
        var setSizeVal = sizeState[1]
        var spacingState = useState(state.captionSpacing != null ? state.captionSpacing : 0)
        var spacingVal = spacingState[0]
        var setSpacingVal = spacingState[1]
        var lineHState = useState(state.captionLineHeight != null ? state.captionLineHeight : 1.4)
        var lineHVal = lineHState[0]
        var setLineHVal = lineHState[1]
        var strokeColorState = useState(state.strokeColor || '#000000')
        var strokeColorVal = strokeColorState[0]
        var setStrokeColorVal = strokeColorState[1]
        var strokeWidthState = useState(state.strokeWidth != null ? state.strokeWidth : 0)
        var strokeWidthVal = strokeWidthState[0]
        var setStrokeWidthVal = strokeWidthState[1]
        var strokeOpacityState = useState(state.strokeOpacity != null ? state.strokeOpacity : 100)
        var strokeOpacityVal = strokeOpacityState[0]
        var setStrokeOpacityVal = strokeOpacityState[1]
        var fgState = useState(state.captionFg || '#000000')
        var fgVal = fgState[0]
        var setFgVal = fgState[1]
        var bgState = useState(state.captionBg || '#ffffff')
        var bgVal = bgState[0]
        var setBgVal = bgState[1]
        var bgOpacityState = useState(state.bgOpacity != null ? state.bgOpacity : 100)
        var bgOpacityVal = bgOpacityState[0]
        var setBgOpacityVal = bgOpacityState[1]

        function applyAll() { ensureCaptionTag(); persistNow() }

        function onFont(e) { var f = e.target.value; setFontSel(f); state.captionFont = f; applyAll() }
        function onSize(e) { var v = Number(e.target.value); setSizeVal(v); state.captionSize = v; applyAll() }
        function onSpacing(e) { var v = Number(e.target.value); setSpacingVal(v); state.captionSpacing = v; applyAll() }
        function onLineH(e) { var v = Number(e.target.value); setLineHVal(v); state.captionLineHeight = v; applyAll() }
        function onStrokeColor(e) { var h = e.target.value; setStrokeColorVal(h); state.strokeColor = h; applyAll() }
        function onStrokeWidth(e) { var v = Number(e.target.value); setStrokeWidthVal(v); state.strokeWidth = v; applyAll() }
        function onStrokeOpacity(e) { var v = Number(e.target.value); setStrokeOpacityVal(v); state.strokeOpacity = v; applyAll() }
        function onFg(e) { var h = e.target.value; setFgVal(h); state.captionFg = h; applyAll() }
        function onBg(e) { var h = e.target.value; setBgVal(h); state.captionBg = h; applyAll() }
        function onBgOpacity(e) { var v = Number(e.target.value); setBgOpacityVal(v); state.bgOpacity = v; applyAll() }

        function onResetText() {
          resetTypo()
          setFontSel('')
          setSizeVal(14)
          setSpacingVal(0)
          setLineHVal(1.4)
          setStrokeColorVal('#000000')
          setStrokeWidthVal(0)
          setStrokeOpacityVal(100)
          setFgVal('#000000')
          setBgVal('#ffffff')
          setBgOpacityVal(100)
          ensureCaptionTag()
          persistNow()
        }

        function rangeRow(label, val, min, max, step, onChange, suffix) {
          return createElement('div', { style: rowStyle },
            createElement('span', { style: secondary }, label),
            createElement('input', { type: 'range', min: String(min), max: String(max), step: String(step), value: String(val), onChange: onChange, style: { flex: 1, minWidth: 60 } }),
            createElement('span', { style: Object.assign({}, secondary, { width: 48, textAlign: 'right' }) }, String(val) + (suffix || ''))
          )
        }

        function colorRow(label, val, onChange) {
          return createElement('div', { style: rowStyle },
            createElement('span', { style: secondary }, label),
            createElement('input', { type: 'color', value: val, onChange: onChange, style: { width: 30, height: 22, padding: 0, border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 4, background: 'transparent' } })
          )
        }

        var containerStyle = {
          border: '1px solid var(--dsw-alias-border-l2)',
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          fontSize: 13,
          color: 'var(--dsw-alias-label-primary)',
          background: 'var(--dsw-alias-bg-layer-1)',
        }
        var rowStyle = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }
        var secondary = { color: 'var(--dsw-alias-label-secondary)', fontSize: 12 }
        var tertiary = { color: 'var(--dsw-alias-label-tertiary)', fontSize: 11, lineHeight: 1.5 }
        var selectStyle = { flex: 1, minWidth: 140, fontSize: 12, color: 'var(--dsw-alias-label-primary)', background: 'var(--dsw-alias-bg-layer-2)', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 6, padding: '3px 6px' }

        return createElement('div', { style: containerStyle },
          createElement('div', { style: rowStyle },
            createElement('span', { style: { fontWeight: 600 } }, '🔤 背景文字'),
            createElement('span', { style: tertiary }, '设置随背景保存，未自定义的项跟随外观默认'),
            createElement('button', { onClick: onResetText, style: buttonStyleRef() }, '恢复默认')
          ),
          createElement('div', { style: rowStyle },
            createElement('span', { style: secondary }, '字体'),
            createElement('select', { value: fontSel, onChange: onFont, style: selectStyle },
              FONTS.map(function (f) { return createElement('option', { key: f.id, value: f.family }, f.label) })
            )
          ),
          rangeRow('字号', sizeVal, 10, 40, 1, onSize, 'px'),
          rangeRow('字间距', spacingVal, -2, 12, 0.5, onSpacing, 'px'),
          rangeRow('行间距', lineHVal, 1, 2.5, 0.05, onLineH, ''),
          createElement('div', { style: { borderTop: '1px solid var(--dsw-alias-border-l1)', margin: '2px 0' } }),
          colorRow('描边颜色', strokeColorVal, onStrokeColor),
          rangeRow('描边粗细', strokeWidthVal, 0, 4, 0.5, onStrokeWidth, 'px'),
          rangeRow('描边不透明度', strokeOpacityVal, 0, 100, 1, onStrokeOpacity, '%'),
          createElement('div', { style: { borderTop: '1px solid var(--dsw-alias-border-l1)', margin: '2px 0' } }),
          colorRow('字色', fgVal, onFg),
          colorRow('底色', bgVal, onBg),
          rangeRow('底色不透明度', bgOpacityVal, 0, 100, 1, onBgOpacity, '%'),
          createElement('div', { style: tertiary }, '描边粗细为 0 时关闭描边；底色不透明度 0% 即透明；「恢复默认」仅还原本分区的文字样式，背景保持不变。')
        )
      }

      slots.inject('settings.section', function () {
        return slots.register(
          { name: 'settings.section', id: 'wallpaper-bg', order: 30, label: '背景' },
          function () { return react.createElement(BgCard) }
        )
      })

      slots.inject('settings.section', function () {
        return slots.register(
          { name: 'settings.section', id: 'wallpaper-text', order: 31, label: '背景文字' },
          function () { return react.createElement(TextCard) }
        )
      })
    }

    exports.default = { name: 'dsh-wallpaper', inject: ['slots', 'theme'], apply: apply }
    return module.exports
  }
})
