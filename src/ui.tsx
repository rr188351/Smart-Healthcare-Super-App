import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { IconName } from './data'

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ')
export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const paths: Record<IconName, React.ReactNode> = {
  activity: <path d="M3 12h4l2-6 4 12 2-6h6" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="m15 18-6-6 6-6" />,
  bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  camera: <><path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3z" /><circle cx="12" cy="13" r="3" /></>,
  cameraOff: <><path d="M3 3l18 18M9.5 4H14.5L16 7h3a2 2 0 0 1 2 2v8.5M17.5 20H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1" /><path d="M10 10.3A3 3 0 0 0 14 14.2" /></>,
  cart: <path d="M3 4h2l2 12h10l3-8H6M9 20h.01M17 20h.01" />,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  doctor: <><path d="M8 3v4a4 4 0 0 0 8 0V3M6 4h2M16 4h2M12 11v3a5 5 0 0 0 10 0v-1" /><circle cx="19" cy="11" r="2" /></>,
  document: <path d="M6 2h8l4 4v16H6zM14 2v5h5M9 12h6M9 16h6" />,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18M10.6 5.1A10.8 10.8 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6C3.8 8.4 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  heart: <path d="M20.8 5.7a5.5 5.5 0 0 0-7.8 0L12 6.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z" />,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.6 2.6 0 1 1 3.2 2.5c-.8.3-.8 1-.8 1.5M12 17h.01" /></>,
  home: <path d="m3 11 9-8 9 8v10h-6v-6H9v6H3z" />,
  lab: <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M8 15h8" />,
  lock: <><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>,
  medicine: <path d="m5.5 18.5 13-13a4.2 4.2 0 0 1 0 6l-7 7a4.2 4.2 0 0 1-6-6l7-7M9 9l6 6" />,
  menu: <path d="M5 7h14M5 12h14M5 17h14" />,
  mic: <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  micOff: <><path d="M3 3l18 18M15 9.3V6a3 3 0 0 0-5.7-1.3M9 9v3a3 3 0 0 0 4.7 2.5M5 11a7 7 0 0 0 11.2 5.6M19 11a7 7 0 0 1-.6 2.8M12 18v3" /></>,
  minus: <path d="M5 12h14" />,
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z" />,
  phone: <path d="M6.6 2h3l1.5 5-2 1.5a16 16 0 0 0 6.4 6.4l1.5-2 5 1.5v3c0 2-1.6 3.6-3.6 3.4A18 18 0 0 1 3.2 5.6C3 3.6 4.6 2 6.6 2Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  records: <path d="M7 3h10v4H7zM5 5H3v16h14v-2M7 9h14v12H7z" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
  shield: <><path d="M12 2 20 5v6c0 5-3.3 9-8 11-4.7-2-8-6-8-11V5z" /><path d="m9 12 2 2 4-5" /></>,
  sparkle: <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5zM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="3" /><path d="m16 10 5-3v10l-5-3" /></>,
}

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

/** Official four-color Google "G" mark, as published in Google's sign-in branding assets. */
export function GoogleLogo({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />
}

export function Button({ children, onClick, kind = 'primary', icon, disabled = false, loading = false, type = 'button', className }: {
  children: React.ReactNode; onClick?: () => void; kind?: 'primary' | 'secondary' | 'ghost' | 'danger'; icon?: IconName
  disabled?: boolean; loading?: boolean; type?: 'button' | 'submit'; className?: string
}) {
  return <button type={type} className={cx('btn', `btn-${kind}`, loading && 'is-loading', className)} onClick={onClick} disabled={disabled || loading} aria-busy={loading || undefined}>
    {loading ? <Spinner /> : icon && <Icon name={icon} />}{children}
  </button>
}

export function IconButton({ name, label, onClick, danger = false, disabled = false, pressed }: {
  name: IconName; label: string; onClick?: () => void; danger?: boolean; disabled?: boolean; pressed?: boolean
}) {
  return <button type="button" className={cx('icon-btn', danger && 'danger')} aria-label={label} onClick={onClick} disabled={disabled} aria-pressed={pressed}><Icon name={name} /></button>
}

export function Glass({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('glass', className)}>{children}</div>
}

export function Tag({ children, tone = 'cyan' }: { children: React.ReactNode; tone?: 'cyan' | 'teal' | 'violet' | 'amber' | 'red' }) {
  return <span className={`tag tag-${tone}`}>{children}</span>
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return <div className="section-title"><span>{children}</span>{action}</div>
}

export function Search({ value, onChange, placeholder = 'Search care, services, records', onKeyDown }: {
  value: string; onChange: (value: string) => void; placeholder?: string; onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); input.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return <div className="search">
    <Icon name="search" />
    <input ref={input} type="text" enterKeyHint="search" aria-label={placeholder} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} onKeyDown={onKeyDown} />
    {value
      ? <button type="button" className="search-clear" aria-label="Clear search" onClick={() => { onChange(''); input.current?.focus() }}><Icon name="close" size={14} /></button>
      : <kbd>⌘ K</kbd>}
  </div>
}

export function Field({ id, label, placeholder, icon, value, onChange, error, type = 'text', action, autoComplete, inputMode }: {
  id: string; label: string; placeholder: string; icon: IconName; value: string; onChange: (value: string) => void; error?: string
  type?: string; action?: React.ReactNode; autoComplete?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return <div className={cx('field', error && 'has-error')}>
    <label htmlFor={id}>{label}</label>
    <div className="field-control">
      <Icon name={icon} />
      <input id={id} type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} autoComplete={autoComplete} inputMode={inputMode} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
      {action}
    </div>
    {error && <p className="field-error" id={`${id}-error`} role="alert">{error}</p>}
  </div>
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (value: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} className={cx('toggle', on && 'on')} onClick={() => onChange(!on)} aria-label={label}><i /></button>
}

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body: string; action?: React.ReactNode }) {
  return <div className="empty-state" role="status"><span><Icon name={icon} size={24} /></span><strong>{title}</strong><p>{body}</p>{action}</div>
}

/** Keeps overlays mounted long enough to play their exit animation. */
export function usePresence(open: boolean, duration = 220) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)
  useEffect(() => {
    if (open) { setMounted(true); setClosing(false); return }
    setClosing(true)
    const timer = window.setTimeout(() => { setMounted(false); setClosing(false) }, prefersReducedMotion() ? 0 : duration)
    return () => window.clearTimeout(timer)
  }, [open, duration])
  return { mounted, closing }
}

/** Schedules timeouts that are cleared automatically when the component unmounts. */
export function useLater() {
  const timers = useRef<number[]>([])
  useEffect(() => () => { timers.current.forEach(window.clearTimeout); timers.current = [] }, [])
  return useRef((fn: () => void, ms: number) => { const id = window.setTimeout(fn, ms); timers.current.push(id); return id }).current
}

export function Sheet({ open, onClose, title, subtitle, children, portal }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; portal: HTMLElement | null
}) {
  const { mounted, closing } = usePresence(open, 240)
  const panel = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closeRef.current() }
    window.addEventListener('keydown', onKey)
    const frame = requestAnimationFrame(() => panel.current?.focus())
    return () => { window.removeEventListener('keydown', onKey); cancelAnimationFrame(frame); previous?.focus?.() }
  }, [open])
  if (!mounted || !portal) return null
  return createPortal(<div className={cx('overlay', closing && 'closing')}>
    <div className="overlay-backdrop" onClick={onClose} />
    <div className="sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={panel}>
      <div className="sheet-handle" />
      <div className="sheet-head"><div><div className="sheet-title">{title}</div>{subtitle && <p>{subtitle}</p>}</div><IconButton name="close" label="Close" onClick={onClose} /></div>
      <div className="sheet-body">{children}</div>
    </div>
  </div>, portal)
}
