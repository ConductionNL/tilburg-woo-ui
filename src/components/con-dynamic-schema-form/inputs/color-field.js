// eslint-disable-next-line import/no-unresolved
import React from 'react';

/**
 * Color picker component supporting multiple color formats via `colorFormat`.
 * Always renders a native color picker. For alpha-capable formats, an alpha slider is shown.
 * Emits the string in the requested format: hex, hex-alpha, rgb(a), hsl(a).
 */
const ColorField = ({
  path,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  required,
  colorFormat,
}) => {
  const stringValue = (value || '').toString();

  const supportsAlpha = ['color-hex-alpha', 'color-rgba', 'color-hsla'].includes(
    colorFormat
  );

  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

  // Formats alpha to a concise decimal representation (max 2 decimals)
  const formatAlpha = (a) => Number(clamp(a, 0, 1).toFixed(2)).toString();

  const hexToRgb = (hex) => {
    if (!hex || typeof hex !== 'string') return null;
    let h = hex.trim().toLowerCase();
    if (!h.startsWith('#')) return null;
    if (h.length === 4) {
      const r = parseInt(h[1] + h[1], 16);
      const g = parseInt(h[2] + h[2], 16);
      const b = parseInt(h[3] + h[3], 16);
      return { r, g, b, a: 1 };
    }
    if (h.length === 7 || h.length === 9) {
      const r = parseInt(h.slice(1, 3), 16);
      const g = parseInt(h.slice(3, 5), 16);
      const b = parseInt(h.slice(5, 7), 16);
      const a = h.length === 9 ? parseInt(h.slice(7, 9), 16) / 255 : 1;
      return { r, g, b, a };
    }
    return null;
  };

  const rgbToHex = (r, g, b) => {
    const toHex = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const rgbToHexAlpha = (r, g, b, a = 1) => {
    const base = rgbToHex(r, g, b);
    const alpha = clamp(Math.round(a * 255), 0, 255)
      .toString(16)
      .padStart(2, '0');
    return `${base}${alpha}`;
  };

  const parseRgbString = (str) => {
    const m =
      /^rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d*\.?\d+)\s*)?\)$/i.exec(
        str
      );
    if (!m) return null;
    const r = clamp(parseInt(m[1], 10), 0, 255);
    const g = clamp(parseInt(m[2], 10), 0, 255);
    const b = clamp(parseInt(m[3], 10), 0, 255);
    const a = m[4] !== undefined ? clamp(parseFloat(m[4]), 0, 1) : 1;
    return { r, g, b, a };
  };

  const hslToRgb = (h, s, l) => {
    const hh = ((h % 360) + 360) % 360;
    const ss = clamp(s / 100, 0, 1);
    const ll = clamp(l / 100, 0, 1);
    const c = (1 - Math.abs(2 * ll - 1)) * ss;
    const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
    const m = ll - c / 2;
    let r1 = 0,
      g1 = 0,
      b1 = 0;
    if (hh < 60) {
      r1 = c;
      g1 = x;
    } else if (hh < 120) {
      r1 = x;
      g1 = c;
    } else if (hh < 180) {
      g1 = c;
      b1 = x;
    } else if (hh < 240) {
      g1 = x;
      b1 = c;
    } else if (hh < 300) {
      r1 = x;
      b1 = c;
    } else {
      r1 = c;
      b1 = x;
    }
    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255),
    };
  };

  const rgbToHsl = (r, g, b) => {
    const rr = r / 255;
    const gg = g / 255;
    const bb = b / 255;
    const max = Math.max(rr, gg, bb);
    const min = Math.min(rr, gg, bb);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === rr) h = 60 * (((gg - bb) / d) % 6);
      else if (max === gg) h = 60 * ((bb - rr) / d + 2);
      else h = 60 * ((rr - gg) / d + 4);
    }
    const l = (max + min) / 2;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    return {
      h: Math.round((h + 360) % 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  const parseHslString = (str) => {
    const m =
      /^hsla?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%(?:\s*,\s*(\d*\.?\d+)\s*)?\)$/i.exec(
        str
      );
    if (!m) return null;
    const h = clamp(parseInt(m[1], 10), 0, 360);
    const s = clamp(parseInt(m[2], 10), 0, 100);
    const l = clamp(parseInt(m[3], 10), 0, 100);
    const a = m[4] !== undefined ? clamp(parseFloat(m[4]), 0, 1) : 1;
    const { r, g, b } = hslToRgb(h, s, l);
    return { r, g, b, a };
  };

  const parseToRgba = (str) => {
    return hexToRgb(str) || parseRgbString(str) || parseHslString(str) || null;
  };

  const toOutputString = ({ r, g, b, a }) => {
    switch (colorFormat) {
      case 'color-hex-alpha':
        return rgbToHexAlpha(r, g, b, a);
      case 'color-rgb':
        return `rgb(${clamp(r, 0, 255)}, ${clamp(g, 0, 255)}, ${clamp(b, 0, 255)})`;
      case 'color-rgba':
        return `rgba(${clamp(r, 0, 255)}, ${clamp(g, 0, 255)}, ${clamp(
          b,
          0,
          255
        )}, ${clamp(a, 0, 1)})`;
      case 'color-hsl': {
        const { h, s, l } = rgbToHsl(r, g, b);
        return `hsl(${h}, ${s}%, ${l}%)`;
      }
      case 'color-hsla': {
        const { h, s, l } = rgbToHsl(r, g, b);
        return `hsla(${h}, ${s}%, ${l}%, ${formatAlpha(a)})`;
      }
      case 'color':
      case 'color-hex':
      default:
        return rgbToHex(r, g, b);
    }
  };

  const parsed = parseToRgba(stringValue) || { r: 0, g: 0, b: 0, a: 1 };

  // HSV helpers for interactive picker
  const rgbToHsv = (r, g, b) => {
    const rr = r / 255;
    const gg = g / 255;
    const bb = b / 255;
    const max = Math.max(rr, gg, bb);
    const min = Math.min(rr, gg, bb);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === rr) h = 60 * (((gg - bb) / d) % 6);
      else if (max === gg) h = 60 * ((bb - rr) / d + 2);
      else h = 60 * ((rr - gg) / d + 4);
    }
    const v = max;
    const s = max === 0 ? 0 : d / max;
    return { h: (h + 360) % 360, s: s * 100, v: v * 100 };
  };

  const hsvToRgb = (h, s, v) => {
    const hh = ((h % 360) + 360) % 360;
    const ss = clamp(s / 100, 0, 1);
    const vv = clamp(v / 100, 0, 1);
    const c = vv * ss;
    const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
    const m = vv - c;
    let r1 = 0,
      g1 = 0,
      b1 = 0;
    if (hh < 60) {
      r1 = c;
      g1 = x;
    } else if (hh < 120) {
      r1 = x;
      g1 = c;
    } else if (hh < 180) {
      g1 = c;
      b1 = x;
    } else if (hh < 240) {
      g1 = x;
      b1 = c;
    } else if (hh < 300) {
      r1 = x;
      b1 = c;
    } else {
      r1 = c;
      b1 = x;
    }
    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255),
    };
  };

  // Local interactive state (synced with prop value)
  const initialHsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
  const [isOpen, setIsOpen] = React.useState(false);
  const [hsv, setHsv] = React.useState(initialHsv);
  const [alpha, setAlpha] = React.useState(parsed.a);
  const wrapperRef = React.useRef(null);

  React.useEffect(() => {
    // sync when external value changes
    const p = parseToRgba(stringValue) || { r: 0, g: 0, b: 0, a: 1 };
    setHsv(rgbToHsv(p.r, p.g, p.b));
    setAlpha(p.a);
  }, [stringValue]);

  React.useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const emitChange = (nextHsv, nextAlpha) => {
    const { r, g, b } = hsvToRgb(nextHsv.h, nextHsv.s, nextHsv.v);
    const output = toOutputString({ r, g, b, a: nextAlpha });
    onChange(output);
  };

  const handleSvPointer = (e, el) => {
    if (disabled) return;
    const rect = el.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    const clientX = point.clientX;
    const clientY = point.clientY;
    const x = clamp(clientX - rect.left, 0, rect.width);
    const y = clamp(clientY - rect.top, 0, rect.height);
    const s = (x / rect.width) * 100;
    const v = (1 - y / rect.height) * 100;
    const next = { ...hsv, s, v };
    setHsv(next);
    emitChange(next, alpha);
  };

  const handleHuePointer = (e, el) => {
    if (disabled) return;
    const rect = el.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    const clientX = point.clientX;
    const x = clamp(clientX - rect.left, 0, rect.width);
    const h = (x / rect.width) * 360;
    const next = { ...hsv, h };
    setHsv(next);
    emitChange(next, alpha);
  };

  const handleAlphaPointer = (e, el) => {
    if (disabled) return;
    const rect = el.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    const clientX = point.clientX;
    const x = clamp(clientX - rect.left, 0, rect.width);
    const a = x / rect.width;
    const nextA = clamp(a, 0, 1);
    setAlpha(nextA);
    emitChange(hsv, nextA);
  };

  const startPointer = (handler) => (e) => {
    e.preventDefault?.();
    const el = e.currentTarget;
    handler(e, el);
    const move = (ev) => {
      ev.preventDefault?.();
      handler(ev, el);
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
  };

  const hueColor = `hsl(${Math.round(hsv.h)}, 100%, 50%)`;
  const { r: cr, g: cg, b: cb } = hsvToRgb(hsv.h, 100, 100);
  const currentFullColor = `rgb(${cr}, ${cg}, ${cb})`;
  const { r: pr, g: pg, b: pb } = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const previewRgba = `rgba(${pr}, ${pg}, ${pb}, ${alpha})`;
  const checkerBg = {
    background:
      'linear-gradient(45deg, #ccc 25%, transparent 25%),\n       linear-gradient(-45deg, #ccc 25%, transparent 25%),\n       linear-gradient(45deg, transparent 75%, #ccc 75%),\n       linear-gradient(-45deg, transparent 75%, #ccc 75%)',
    backgroundSize: '10px 10px',
    backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
  };

  const [inputText, setInputText] = React.useState(
    toOutputString({ r: parsed.r, g: parsed.g, b: parsed.b, a: parsed.a })
  );

  React.useEffect(() => {
    // keep input text in sync with external value
    const p = parseToRgba(stringValue);
    if (p) setInputText(toOutputString(p));
  }, [stringValue]);

  const handleInputChange = (e) => {
    const next = e.target.value;
    setInputText(next);
    const parsedNext = parseToRgba(next);
    if (parsedNext) {
      // sync pickers and emit normalized string
      setHsv(rgbToHsv(parsedNext.r, parsedNext.g, parsedNext.b));
      setAlpha(parsedNext.a ?? 1);
      onChange(toOutputString(parsedNext));
    }
  };

  const handleInputBlur = () => {
    const parsedNext = parseToRgba(inputText);
    if (parsedNext) {
      const normalized = toOutputString(parsedNext);
      setInputText(normalized);
      onChange(normalized);
    }
  };

  return (
    <div key={path} ref={wrapperRef} style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          height: 44.8,
          padding: '0 12px',
          border: '1px solid #d0d7de',
          borderRadius: 6,
          background: disabled ? '#f6f8fa' : '#fff',
        }}
      >
        <button
          type='button'
          onClick={() => !disabled && setIsOpen((v) => !v)}
          disabled={disabled}
          aria-label={placeholder || label}
          aria-expanded={isOpen}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            ...checkerBg,
            position: 'relative',
            border: '1px solid rgba(0,0,0,0.1)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            flex: '0 0 auto',
          }}
        >
          <span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 6,
              background: previewRgba,
            }}
          />
        </button>
        <input
          id={`dynamic-form-field-${path}`}
          type='text'
          value={inputText}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            width: '100%',
            height: '100%',
            fontSize: 14,
            color: '#24292f',
          }}
        />
      </div>

      {isOpen && (
        <div
          role='dialog'
          aria-label='Kleurenkiezer'
          style={{
            position: 'absolute',
            zIndex: 20,
            top: '110%',
            left: 0,
            padding: 12,
            width: 260,
            border: '1px solid #ddd',
            borderRadius: 6,
            background: '#fff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          {/* SV panel.

              The three drag surfaces below (saturation/value, hue, alpha) are
              pointer-only by nature. They are an enhancement, not the only way
              in: the field's value is set by the text input above, which is
              labelled, focusable and accepts the same colour value by keyboard.
              So the control as a whole is keyboard-operable (WCAG 2.1.1) even
              though these three surfaces are not. */}
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div
            onMouseDown={startPointer(handleSvPointer)}
            onTouchStart={startPointer(handleSvPointer)}
            style={{
              position: 'relative',
              width: '100%',
              height: 150,
              cursor: 'crosshair',
              background: currentFullColor,
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to right, #fff, rgba(255,255,255,0))',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, #000, rgba(0,0,0,0))',
              }}
            />
            {/* Thumb */}
            <div
              style={{
                position: 'absolute',
                left: `${clamp(hsv.s, 0, 100)}%`,
                top: `${100 - clamp(hsv.v, 0, 100)}%`,
                transform: 'translate(-50%, -50%)',
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '2px solid #fff',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
                background: `rgb(${pr}, ${pg}, ${pb})`,
              }}
            />
          </div>

          {/* Hue slider */}
          <div style={{ marginTop: 10 }}>
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
            <div
              onMouseDown={startPointer(handleHuePointer)}
              onTouchStart={startPointer(handleHuePointer)}
              style={{
                position: 'relative',
                height: 12,
                borderRadius: 6,
                background:
                  'linear-gradient(to right,\n                   rgb(255,0,0), rgb(255,255,0), rgb(0,255,0),\n                   rgb(0,255,255), rgb(0,0,255), rgb(255,0,255), rgb(255,0,0))',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: `${(clamp(hsv.h, 0, 360) / 360) * 100}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: '2px solid #fff',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
                  background: hueColor,
                }}
              />
            </div>
          </div>

          {/* Alpha slider (integrated in picker) */}
          {supportsAlpha && (
            <div style={{ marginTop: 10 }}>
              {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
              <div
                onMouseDown={startPointer(handleAlphaPointer)}
                onTouchStart={startPointer(handleAlphaPointer)}
                style={{
                  position: 'relative',
                  height: 12,
                  borderRadius: 6,
                  ...checkerBg,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 6,
                    background: `linear-gradient(to right, rgba(${pr}, ${pg}, ${pb}, 0), rgba(${pr}, ${pg}, ${pb}, 1))`,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: `${clamp(alpha, 0, 1) * 100}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: '2px solid #fff',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
                    background: `rgba(${pr}, ${pg}, ${pb}, ${alpha})`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ColorField;
