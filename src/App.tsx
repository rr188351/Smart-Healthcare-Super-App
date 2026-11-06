import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  DOCTORS, LAB_TESTS, LAB_WINDOWS, NAV_SCREENS, PHOTO, PRODUCTS, RECORDS, SCREEN_ORDER, TIMES, WEEK,
  dayKey, formatDay, fromKey, initials, isEmail, isEmailOrPhone, money, openDays, recordKindLabel, relativeDay, slotsFor,
  type Doctor, type IconName, type NotificationItem, type Profile, type RecordItem, type Screen,
} from './data'
import { AppProvider, useApp, useUnreadCount } from './store'
import {
  Button, EmptyState, Field, Glass, GoogleLogo, Icon, IconButton, Search, SectionTitle, Sheet, Spinner, Tag, Toggle,
  cx, prefersReducedMotion, useLater, usePresence,
} from './ui'

type Theme = 'light' | 'dark'
const THEME_STORAGE_KEY = 'aeris-theme'
const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void } | null>(null)
const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeContext')
  return context
}
const getInitialTheme = (): Theme => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'

const doctorById = (id?: string) => DOCTORS.find(d => d.id === id) ?? DOCTORS[0]
const productById = (id?: string) => PRODUCTS.find(p => p.id === id) ?? PRODUCTS[0]
const labById = (id?: string) => LAB_TESTS.find(t => t.id === id) ?? LAB_TESTS[0]
const recordById = (id?: string) => RECORDS.find(r => r.id === id) ?? RECORDS[0]
const reference = () => `AE-${Math.floor(1000 + Math.random() * 9000)}`
const formatRecordDate = (key: string) => fromKey(key).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })

function nextOpening(doctor: Doctor) {
  const day = openDays(doctor)[0]
  if (!day) return 'No demo slots this week'
  const time = slotsFor(doctor, day.index).find(s => s.open)?.time
  const label = day.index === 0 ? 'Today' : day.index === 1 ? 'Tomorrow' : fromKey(day.key).toLocaleDateString('en-US', { weekday: 'short' })
  return `${label}, ${time}`
}

function DoctorAvatar({ doctor, className }: { doctor: Doctor; className: string }) {
  return doctor.image
    ? <img className={className} src={doctor.image} alt="" />
    : <div className={cx(className, 'placeholder', `p${DOCTORS.indexOf(doctor) % 3}`)}>{doctor.initials}</div>
}

function Header({ title, subtitle, back = false, fallback = 'home', action }: { title: string; subtitle?: string; back?: boolean; fallback?: Screen; action?: React.ReactNode }) {
  const app = useApp()
  return <header className="topbar">
    <div className="topbar-side">{back && <IconButton name="back" label="Go back" onClick={() => app.back(fallback)} />}</div>
    <div className="topbar-copy"><div className="page-title">{title}</div>{subtitle && <div className="page-kicker">{subtitle}</div>}</div>
    <div className="topbar-side right">{action}</div>
  </header>
}

function ScreenShell({ children, noNav = false, className = '' }: { children: React.ReactNode; noNav?: boolean; className?: string }) {
  return <div className={cx('screen-layer', className)}><main className={cx('content', noNav && 'no-nav')}>{children}</main></div>
}

function ThemeToggle({ className = '', orientation = 'horizontal' }: { className?: string; orientation?: 'horizontal' | 'vertical' }) {
  const { theme, setTheme } = useTheme()
  return <div className={`theme-toggle ${orientation} ${theme} ${className}`} role="group" aria-label="Color theme">
    <span className="theme-thumb" aria-hidden="true" />
    <button type="button" aria-label="Use light mode" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}><Icon name="sun" size={16} /></button>
    <button type="button" aria-label="Use dark mode" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}><Icon name="moon" size={15} /></button>
  </div>
}

function CartButton() {
  const app = useApp()
  const count = app.cart.reduce((sum, line) => sum + line.qty, 0)
  return <button type="button" className="cart-button" onClick={() => app.go('cart')} aria-label={`Open cart, ${count} items`}>
    <Icon name="cart" />{count > 0 && <span key={count}>{count}</span>}
  </button>
}

function Chips<T extends string>({ options, value, onChange, label }: { options: [T, string][]; value: T; onChange: (value: T) => void; label: string }) {
  return <div className="chips" role="group" aria-label={label}>{options.map(([key, text]) =>
    <button type="button" key={key} className={cx('chip', value === key && 'active')} aria-pressed={value === key} onClick={() => onChange(key)}>{text}</button>)}</div>
}

/* ---------- Authentication ---------- */

function Splash() {
  const app = useApp()
  const [leaving, setLeaving] = useState(false)
  const done = useRef(false)
  const timers = useRef<number[]>([])
  const target = useRef<Screen>('welcome')
  target.current = app.session ? 'home' : 'welcome'
  const goRef = useRef(app.go)
  goRef.current = app.go

  const advance = useCallback(() => {
    if (done.current) return
    done.current = true
    setLeaving(true)
    timers.current.push(window.setTimeout(() => goRef.current(target.current, { reset: true }), prefersReducedMotion() ? 0 : 260))
  }, [])

  useEffect(() => {
    // One controlled auto-advance; cleanup keeps Strict Mode's mount/unmount check from scheduling duplicates.
    timers.current.push(window.setTimeout(advance, 2000))
    return () => { timers.current.forEach(window.clearTimeout); timers.current = [] }
  }, [advance])

  return <ScreenShell noNav className={cx('center-screen splash-screen', leaving && 'leaving')}>
    <div className="splash-glow" aria-hidden="true" />
    <div className="brand-mark large splash-logo"><Icon name="activity" size={34} /></div>
    <div className="splash-name">AERIS</div>
    <div className="splash-sub">Care, connected around you.</div>
    <div className="splash-progress" aria-hidden="true"><i /></div>
    <button type="button" className="tap-anywhere" onClick={advance} aria-label="Skip intro" />
    <div className="prototype-pill" role="status"><span /> Interactive concept</div>
  </ScreenShell>
}

function Welcome() {
  const app = useApp()
  return <ScreenShell noNav>
    <div className="welcome-visual">
      <div className="orbit o1" /><div className="orbit o2" />
      <div className="brand-mark"><Icon name="heart" size={28} /></div>
      <Glass className="float-card f1"><Icon name="doctor" /><span>Consultations</span></Glass>
      <Glass className="float-card f2"><Icon name="records" /><span>Your records</span></Glass>
      <Glass className="float-card f3"><Icon name="medicine" /><span>Pharmacy</span></Glass>
    </div>
    <div className="welcome-copy">
      <Tag>ONE CARE SPACE</Tag>
      <div className="hero-title">Healthcare that moves with you.</div>
      <p>Appointments, medicines, lab tests and records—thoughtfully brought together.</p>
      <Button onClick={() => app.go('signup')} icon="arrow">Continue</Button>
      <Button onClick={() => app.go('login')} kind="ghost">I already have an account</Button>
    </div>
  </ScreenShell>
}

function GoogleButton({ label, onResult }: { label: string; onResult: () => void }) {
  const [loading, setLoading] = useState(false)
  const later = useLater()
  const run = () => {
    if (loading) return
    setLoading(true)
    // No Google OAuth client exists in this project, so report that honestly instead of simulating success.
    later(() => { setLoading(false); onResult() }, 700)
  }
  return <button type="button" className={cx('google-btn', loading && 'is-loading')} onClick={run} disabled={loading} aria-busy={loading || undefined}>
    {loading ? <Spinner /> : <GoogleLogo />}<span>{loading ? 'Checking Google sign-in…' : label}</span>
  </button>
}

function LegalSheet({ kind, onClose }: { kind: 'terms' | 'privacy' | null; onClose: () => void }) {
  const app = useApp()
  const last = useRef<'terms' | 'privacy'>('terms')
  if (kind) last.current = kind
  const terms = last.current === 'terms'
  return <Sheet open={!!kind} onClose={onClose} portal={app.overlayEl} title={terms ? 'Prototype terms' : 'Privacy notice'} subtitle="Plain-language summary">
    <div className="sheet-copy">
      {terms ? <>
        <p>Aeris is an interactive design concept. It does not provide medical care, diagnosis, prescriptions, payments, or emergency response.</p>
        <p>Bookings, orders, lab tests, and consultations you create here are simulated and are never sent to a provider.</p>
      </> : <>
        <p>This prototype keeps demo preferences and sample activity only in this browser’s local storage.</p>
        <p>Please don’t enter real health information. Nothing you enter is sent to a server.</p>
      </>}
    </div>
    <Button onClick={onClose}>Understood</Button>
  </Sheet>
}

function ForgotSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const app = useApp()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  const later = useLater()
  useEffect(() => { if (open) { setState('idle'); setError('') } }, [open])
  const submit = () => {
    if (!isEmail(email)) { setError('Enter the email address for your account.'); return }
    setError(''); setState('loading')
    later(() => setState('done'), 700)
  }
  return <Sheet open={open} onClose={onClose} portal={app.overlayEl} title="Reset password" subtitle="We’ll explain what happens next">
    {state === 'done'
      ? <div className="notice notice-info" role="status"><Icon name="mail" /><div><strong>Password reset email isn’t configured</strong><p>This prototype has no email service, so no reset link was sent to {email}.</p></div></div>
      : <Field id="reset-email" label="Email" placeholder="you@example.com" icon="mail" value={email} onChange={setEmail} error={error} autoComplete="email" inputMode="email" />}
    <div className="sheet-actions">
      {state === 'done' ? <Button onClick={onClose}>Back to login</Button> : <><Button kind="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={state === 'loading'}>Send reset link</Button></>}
    </div>
  </Sheet>
}

function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const app = useApp()
  const signup = mode === 'signup'
  const [values, setValues] = useState({ name: '', email: '', password: '' })
  const [agree, setAgree] = useState(false)
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [googleNotice, setGoogleNotice] = useState(false)
  const [legal, setLegal] = useState<'terms' | 'privacy' | null>(null)
  const [forgot, setForgot] = useState(false)
  const later = useLater()
  const set = (key: keyof typeof values) => (value: string) => { setValues(v => ({ ...v, [key]: value })); if (errors[key]) setErrors(e => ({ ...e, [key]: '' })) }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting) return
    const next: Record<string, string> = {}
    if (signup && values.name.trim().length < 2) next.name = 'Enter your full name.'
    if (!isEmailOrPhone(values.email)) next.email = 'Enter a valid email address or phone number.'
    if (signup ? values.password.length < 8 : !values.password) next.password = signup ? 'Use at least 8 characters.' : 'Enter your password.'
    if (signup && !agree) next.agree = 'Please accept the prototype terms and privacy notice.'
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    setSubmitting(true)
    later(() => {
      if (signup) app.setProfile({ ...app.profile, name: values.name.trim(), email: values.email.includes('@') ? values.email.trim() : app.profile.email, phone: values.email.includes('@') ? app.profile.phone : values.email.trim() })
      app.signIn(values.email.trim())
      app.go('home', { reset: true })
      app.toast(signup ? 'Demo account created on this device' : 'Signed in to the demo profile')
    }, 750)
  }

  return <ScreenShell noNav className="auth-screen">
    <Header title={signup ? 'Create your account' : 'Welcome back'} subtitle={signup ? 'Your secure care space starts here' : 'Sign in to continue to Aeris'} back fallback="welcome" />
    <div className="auth-logo"><div className="brand-mark small"><Icon name="activity" /></div><span>AERIS</span></div>
    <form className="form-stack" onSubmit={submit} noValidate>
      <GoogleButton label={signup ? 'Sign up with Google' : 'Continue with Google'} onResult={() => setGoogleNotice(true)} />
      {googleNotice && <div className="notice notice-warning" role="status">
        <Icon name="shield" />
        <div><strong>Google sign-in isn’t configured</strong><p>No Google OAuth client is connected to this prototype, so you haven’t been signed in. Continue with email in demo mode.</p></div>
        <button type="button" className="notice-close" aria-label="Dismiss message" onClick={() => setGoogleNotice(false)}><Icon name="close" size={14} /></button>
      </div>}
      <div className="auth-divider"><span>or use email</span></div>
      {signup && <Field id="name" label="Full name" placeholder="Enter your name" icon="user" value={values.name} onChange={set('name')} error={errors.name} autoComplete="name" />}
      <Field id={`${mode}-email`} label="Email or phone" placeholder="you@example.com" icon="mail" value={values.email} onChange={set('email')} error={errors.email} autoComplete="username" />
      <Field id={`${mode}-password`} label="Password" placeholder={signup ? 'At least 8 characters' : 'Enter your password'} icon="lock" type={show ? 'text' : 'password'} value={values.password} onChange={set('password')} error={errors.password} autoComplete={signup ? 'new-password' : 'current-password'}
        action={<button type="button" className="password-toggle" aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} onClick={() => setShow(!show)}><span key={String(show)}><Icon name={show ? 'eyeOff' : 'eye'} /></span></button>} />
      {!signup && <div className="auth-links"><button type="button" className="text-link" onClick={() => { setValues({ name: '', email: 'maya@example.com', password: 'demo-password' }); setErrors({}) }}>Use demo details</button><button type="button" className="text-link" onClick={() => setForgot(true)}>Forgot password?</button></div>}
      {signup && <div className={cx('check-row', errors.agree && 'has-error')}>
        <input id="agree" type="checkbox" checked={agree} onChange={e => { setAgree(e.target.checked); setErrors(er => ({ ...er, agree: '' })) }} />
        <label htmlFor="agree" className="check-box"><Icon name="check" size={14} /></label>
        <p><label htmlFor="agree">I agree to the</label> <button type="button" className="text-link" onClick={() => setLegal('terms')}>Terms</button> and <button type="button" className="text-link" onClick={() => setLegal('privacy')}>Privacy Notice</button>.</p>
      </div>}
      {errors.agree && <p className="field-error" role="alert">{errors.agree}</p>}
      <Button type="submit" icon={signup ? 'arrow' : 'lock'} loading={submitting}>{submitting ? (signup ? 'Creating demo account…' : 'Signing in…') : signup ? 'Create account' : 'Secure login'}</Button>
      <div className="demo-note"><Icon name="shield" size={17} /> Demo mode—credentials aren’t sent or verified.</div>
    </form>
    <div className="auth-switch">{signup ? 'Already have an account?' : 'New to Aeris?'} <button type="button" className="text-link" onClick={() => app.go(signup ? 'login' : 'signup', { replace: true })}>{signup ? 'Log in' : 'Create account'}</button></div>
    <LegalSheet kind={legal} onClose={() => setLegal(null)} />
    <ForgotSheet open={forgot} onClose={() => setForgot(false)} />
  </ScreenShell>
}

/* ---------- Home ---------- */

function HomeSearch() {
  const app = useApp()
  const [query, setQuery] = useState('')
  const term = query.trim().toLowerCase()
  const results = useMemo(() => {
    if (!term) return []
    const all: { key: string; label: string; meta: string; icon: IconName; run: () => void }[] = [
      ...DOCTORS.map(d => ({ key: `d-${d.id}`, label: d.name, meta: `Doctor • ${d.specialty}`, icon: 'doctor' as IconName, run: () => { app.select({ doctorId: d.id }); app.go('doctor') } })),
      ...PRODUCTS.map(p => ({ key: `p-${p.id}`, label: p.name, meta: `Pharmacy • ${p.type}`, icon: 'medicine' as IconName, run: () => { app.select({ productId: p.id }); app.go('medicine') } })),
      ...LAB_TESTS.map(t => ({ key: `l-${t.id}`, label: t.name, meta: 'Lab test • Sample', icon: 'lab' as IconName, run: () => { app.select({ labId: t.id }); app.go('labBooking') } })),
      ...RECORDS.map(r => ({ key: `r-${r.id}`, label: r.title, meta: `Record • ${recordKindLabel[r.kind]}`, icon: 'records' as IconName, run: () => { app.select({ recordId: r.id }); app.go('report') } })),
      { key: 's-emergency', label: 'Emergency information', meta: 'Guidance', icon: 'activity', run: () => app.go('emergency') },
      { key: 's-help', label: 'Help & support', meta: 'Support', icon: 'help', run: () => app.go('help') },
    ]
    return all.filter(r => `${r.label} ${r.meta}`.toLowerCase().includes(term)).slice(0, 6)
  }, [term, app])
  return <div className="search-wrap">
    <Search value={query} onChange={setQuery} onKeyDown={e => { if (e.key === 'Enter' && results[0]) results[0].run(); if (e.key === 'Escape') setQuery('') }} />
    {term && <div className="search-results glass" role="list" aria-label="Search results">
      {results.length ? results.map(r => <button type="button" role="listitem" key={r.key} onClick={r.run}><span><Icon name={r.icon} size={16} /></span><div><strong>{r.label}</strong><small>{r.meta}</small></div><Icon name="chevron" size={15} /></button>)
        : <div className="search-empty"><Icon name="search" size={16} /> No demo results for “{query.trim()}”</div>}
    </div>}
  </div>
}

function Home() {
  const app = useApp()
  const unread = useUnreadCount()
  const next = app.appointments[0]
  const doctor = next ? doctorById(next.doctorId) : null
  const recent = RECORDS[0]
  const firstName = app.profile.name.split(' ')[0] || 'there'
  const hide = app.prefs.hideHomeDetails
  const services: { label: string; note: string; icon: IconName; target: Screen; tone: string }[] = [
    { label: 'Doctors', note: 'Find care', icon: 'doctor', target: 'doctors', tone: 'cyan' },
    { label: 'Pharmacy', note: 'Essentials', icon: 'medicine', target: 'pharmacy', tone: 'violet' },
    { label: 'Lab tests', note: 'Book a test', icon: 'lab', target: 'labs', tone: 'teal' },
    { label: 'Records', note: 'Private & secure', icon: 'records', target: 'records', tone: 'blue' },
  ]
  return <ScreenShell className="home-screen">
    <div className="home-header">
      <div>
        <div className="eyebrow-row"><span className="eyebrow">MONDAY, 23 JUNE</span><button type="button" className="notice-pill" onClick={() => app.go('notifications')} aria-label={`Notifications, ${unread} unread`}><Icon name="bell" size={12} />{unread ? `${unread} new` : 'Inbox'}</button></div>
        <div className="greeting">Good morning, {firstName}</div><p>How can we care for you today?</p>
      </div>
      <div className="home-actions"><ThemeToggle orientation="vertical" /><button type="button" className="avatar avatar-button" onClick={() => app.go('profile')} aria-label="Open profile"><span>{initials(app.profile.name)}</span><i /></button></div>
    </div>
    <HomeSearch />
    <div className="service-grid">{services.map(s => <button type="button" className={`service-card service-${s.tone}`} onClick={() => app.go(s.target)} key={s.label}>
      <span className="service-icon"><Icon name={s.icon} /></span><strong>{s.label}</strong><small>{s.note}</small><Icon name="arrow" size={15} />
    </button>)}</div>
    <SectionTitle action={<button type="button" className="text-link" onClick={() => next ? app.openSheet({ type: 'appointment', id: next.id }) : app.go('doctors')}>{next ? 'Manage' : 'Book'}</button>}>Up next</SectionTitle>
    {next && doctor ? <Glass className="appointment-card">
      <div className="appointment-accent" />
      <div className="appointment-top"><Tag tone="teal">{next.mode === 'video' ? 'VIDEO' : 'IN PERSON'} • DEMO</Tag><span><Icon name="clock" size={14} /> {relativeDay(next.date)}</span></div>
      <div className="doctor-row">
        {hide ? <div className="doctor-avatar placeholder p1"><Icon name="lock" size={16} /></div> : <DoctorAvatar doctor={doctor} className="doctor-avatar" />}
        <div><strong>{hide ? 'Upcoming appointment' : doctor.name}</strong><p>{hide ? 'Details hidden for privacy' : doctor.specialty}</p></div>
        {next.mode === 'video' ? <IconButton name="video" label="Join simulated consultation" onClick={() => { app.select({ appointmentId: next.id }); app.go('video') }} /> : <IconButton name="calendar" label="View appointment" onClick={() => app.openSheet({ type: 'appointment', id: next.id })} />}
      </div>
      <div className="date-strip"><div><Icon name="calendar" /><span><small>{formatDay(next.date).toUpperCase()}</small>{next.time}</span></div><button type="button" onClick={() => app.openSheet({ type: 'appointment', id: next.id })}>View details <Icon name="chevron" size={15} /></button></div>
    </Glass> : <Glass className="appointment-card appointment-empty">
      <div className="appointment-accent" />
      <div><strong>No upcoming appointments</strong><p>Book a simulated consultation with a fictional doctor.</p></div>
      <Button kind="secondary" icon="doctor" onClick={() => app.go('doctors')}>Find a doctor</Button>
    </Glass>}
    <div className="home-bottom-grid">
      <button type="button" className="glass mini-card" onClick={() => { app.select({ recordId: recent.id }); app.go('report') }}><span className="mini-icon"><Icon name="document" /></span><div><small>RECENT RECORD</small><strong>{hide ? 'Private document' : recent.title}</strong><p>Sample • Jun 18</p></div><Icon name="chevron" size={17} /></button>
      <button type="button" className="emergency-mini" onClick={() => app.go('emergency')}><span><Icon name="activity" /></span><div><strong>Emergency info</strong><small>Immediate guidance</small></div><Icon name="chevron" size={16} /></button>
    </div>
  </ScreenShell>
}

/* ---------- Doctors and booking ---------- */

const SPECIALTIES: ['all' | Doctor['category'], string][] = [['all', 'All'], ['primary', 'Primary care'], ['dermatology', 'Dermatology'], ['cardiology', 'Cardiology'], ['pediatrics', 'Pediatrics']]

function Doctors() {
  const app = useApp()
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState<'all' | Doctor['category']>('all')
  const [availability, setAvailability] = useState<'any' | 'today' | 'week'>('any')
  const [mode, setMode] = useState<'any' | 'video' | 'clinic'>('any')
  const [earliest, setEarliest] = useState(false)
  const [filters, setFilters] = useState(false)
  const filterFn = (d: Doctor, avail = availability, m = mode) => {
    const days = openDays(d)
    return (specialty === 'all' || d.category === specialty)
      && `${d.name} ${d.specialty}`.toLowerCase().includes(query.trim().toLowerCase())
      && (avail === 'any' || (avail === 'today' ? days[0]?.index === 0 : days.length > 0))
      && (m === 'any' || d.modes.includes(m))
  }
  const list = DOCTORS.filter(d => filterFn(d))
  if (earliest) list.sort((a, b) => (openDays(a)[0]?.index ?? 9) - (openDays(b)[0]?.index ?? 9))
  const activeFilters = Number(availability !== 'any') + Number(mode !== 'any')
  const clear = () => { setQuery(''); setSpecialty('all'); setAvailability('any'); setMode('any'); setEarliest(false) }
  return <ScreenShell>
    <Header title="Find a doctor" subtitle="Fictional profiles for this prototype" action={<span className="badge-wrap"><IconButton name="menu" label={`Filters${activeFilters ? `, ${activeFilters} active` : ''}`} onClick={() => setFilters(true)} />{activeFilters > 0 && <b className="count-badge">{activeFilters}</b>}</span>} />
    <Search value={query} onChange={setQuery} placeholder="Search by specialty or name" />
    <Chips label="Specialty" options={SPECIALTIES} value={specialty} onChange={setSpecialty} />
    <div className="filter-line"><span>{list.length} demo {list.length === 1 ? 'profile' : 'profiles'}</span><button type="button" className={cx(earliest && 'active')} aria-pressed={earliest} onClick={() => setEarliest(!earliest)}><Icon name="calendar" /> Earliest available</button></div>
    {list.length ? <div className="card-list">{list.map(d => <Glass className="doctor-card" key={d.id}>
      <DoctorAvatar doctor={d} className="doctor-photo" />
      <div className="doctor-info"><div className="doctor-name">{d.name} {app.favorites.includes(d.id) && <Icon name="heart" size={12} />}</div><p>{d.specialty}</p><div className="meta-line"><Icon name={d.modes[0] === 'video' ? 'video' : 'home'} size={14} /> {d.modes.map(m => m === 'video' ? 'Video' : 'In person').join(' • ')}</div><div className="availability"><i /> Next: {nextOpening(d)}</div></div>
      <button type="button" className="view-profile" onClick={() => { app.select({ doctorId: d.id, bookingDate: undefined }); app.go('doctor') }}>View profile <Icon name="arrow" size={14} /></button>
    </Glass>)}</div>
      : <EmptyState icon="search" title="No doctors match" body="Try another name, specialty or availability filter." action={<Button kind="secondary" onClick={clear}>Clear filters</Button>} />}
    <Sheet open={filters} onClose={() => setFilters(false)} portal={app.overlayEl} title="Filter doctors" subtitle="Fictional availability">
      <div className="option-group"><span>Availability</span><Chips label="Availability" options={[['any', 'Any time'], ['today', 'Today'], ['week', 'This week']]} value={availability} onChange={setAvailability} /></div>
      <div className="option-group"><span>Consultation type</span><Chips label="Consultation type" options={[['any', 'Any'], ['video', 'Video'], ['clinic', 'In person']]} value={mode} onChange={setMode} /></div>
      <div className="sheet-actions"><Button kind="ghost" onClick={() => { setAvailability('any'); setMode('any') }}>Reset</Button><Button onClick={() => setFilters(false)}>Show {list.length} {list.length === 1 ? 'doctor' : 'doctors'}</Button></div>
    </Sheet>
  </ScreenShell>
}

function DoctorProfile() {
  const app = useApp()
  const doctor = doctorById(app.selection.doctorId)
  const days = openDays(doctor).slice(0, 3)
  const [date, setDate] = useState(app.selection.bookingDate ?? days[0]?.key)
  const saved = app.favorites.includes(doctor.id)
  const book = (key = date) => { app.select({ bookingDate: key, rescheduleId: undefined }); app.go('booking') }
  return <ScreenShell noNav>
    <div className={cx('profile-hero', !doctor.image && 'no-photo')}>
      {doctor.image ? <img src={doctor.image} alt="Fictional doctor profile" /> : <div className="hero-initials" aria-hidden="true">{doctor.initials}</div>}
      <div className="profile-overlay" />
      <div className="profile-nav"><IconButton name="back" label="Go back" onClick={() => app.back('doctors')} /><IconButton name="heart" label={saved ? 'Remove from saved' : 'Save profile'} pressed={saved} onClick={() => { app.toggleFavorite(doctor.id); app.toast(saved ? 'Removed from saved doctors' : 'Saved to your demo favorites') }} /></div>
      <Tag>FICTIONAL PROFILE</Tag>
    </div>
    <div className="profile-body">
      <div className="doctor-head"><div><div className="hero-name">{doctor.name}</div><p>{doctor.specialty} • {doctor.modes.map(m => m === 'video' ? 'Video care' : 'In person').join(' • ')}</p></div><span className="verified"><Icon name="shield" size={15} /> Demo</span></div>
      <div className="stat-row"><div><strong>{doctor.years}</strong><span>Sample exp.</span></div><div><strong>15 min</strong><span>Visit length</span></div><div><strong>{doctor.language.split(',')[0]}</strong><span>Language</span></div></div>
      <SectionTitle>About</SectionTitle>
      <p className="body-copy">{doctor.about}</p>
      <SectionTitle action={<button type="button" className="text-link" onClick={() => book()}>See all</button>}>Next availability</SectionTitle>
      <div className="slots-row">{days.map(d => <button type="button" key={d.key} className={cx('date-card', date === d.key && 'selected')} aria-pressed={date === d.key} onClick={() => setDate(d.key)}><small>{fromKey(d.key).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</small><strong>{fromKey(d.key).getDate()}</strong><span>{d.open} slots</span></button>)}
        <button type="button" className="date-card" aria-label="Open full calendar" onClick={() => book()}><Icon name="calendar" /></button></div>
      <Glass className="consult-note"><Icon name={doctor.modes[0] === 'video' ? 'video' : 'home'} /><div><strong>{doctor.modes.includes('video') ? 'Video consultation available' : 'In-person consultation'}</strong><p>Simulated experience • {money(doctor.price)} sample price</p></div></Glass>
      <Button onClick={() => book()} icon="calendar" disabled={!days.length}>Book appointment</Button>
    </div>
  </ScreenShell>
}

function Booking() {
  const app = useApp()
  const doctor = doctorById(app.selection.doctorId)
  const reschedule = app.appointments.find(a => a.id === app.selection.rescheduleId)
  const [date, setDate] = useState(app.selection.bookingDate ?? reschedule?.date ?? openDays(doctor)[0]?.key ?? dayKey(WEEK[0]))
  const [slot, setSlot] = useState<string | null>(null)
  const [mode, setMode] = useState<'video' | 'clinic'>(reschedule?.mode ?? doctor.modes[0])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const later = useLater()
  const dayIndex = WEEK.findIndex(d => dayKey(d) === date)
  const slots = slotsFor(doctor, Math.max(0, dayIndex))
  const openCount = slots.filter(s => s.open).length

  const confirm = () => {
    if (submitting) return
    if (!slot) { setError('Choose an available time to continue.'); return }
    setSubmitting(true)
    later(() => {
      const id = reschedule?.id ?? `apt-${Date.now()}`
      app.saveAppointment({ id, doctorId: doctor.id, date, time: slot, mode, reference: reschedule?.reference ?? reference() })
      app.addNotification({ title: reschedule ? 'Demo appointment rescheduled' : 'Demo booking created', body: `${doctor.name} • ${formatDay(date)} at ${slot}. Not sent to a provider.`, icon: 'calendar', tone: 'cyan', target: 'appointment' }, 'appointments')
      app.select({ confirmation: { kind: 'appointment', id }, appointmentId: id, rescheduleId: undefined })
      app.go('confirmed', { replace: true })
    }, 800)
  }

  return <ScreenShell noNav>
    <Header title={reschedule ? 'Reschedule' : 'Book appointment'} subtitle="Choose a convenient time" back fallback="doctor" />
    <div className="booking-doc"><DoctorAvatar doctor={doctor} className="booking-avatar" /><div><strong>{doctor.name}</strong><p>{doctor.specialty}</p></div><Tag>{mode === 'video' ? 'VIDEO' : 'IN PERSON'}</Tag></div>
    <SectionTitle>June 2025</SectionTitle>
    <Glass className="calendar-card">
      <div className="weekdays">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="dates">{WEEK.map((d, i) => {
        const key = dayKey(d); const open = slotsFor(doctor, i).some(s => s.open)
        return <button type="button" key={key} disabled={!open} className={cx(date === key && 'selected')} aria-pressed={date === key} aria-label={`${formatDay(key, 'long')}${open ? '' : ', unavailable'}`} onClick={() => { setDate(key); setSlot(null); setError('') }}><small>{i === 0 ? 'Today' : ''}</small>{d.getDate()}</button>
      })}</div>
    </Glass>
    <SectionTitle>Available times <Tag tone={openCount ? 'teal' : 'amber'}>{openCount} OPEN</Tag></SectionTitle>
    <div className="time-grid">{slots.map(s => <button type="button" key={s.time} disabled={!s.open} onClick={() => { setSlot(s.time); setError('') }} aria-pressed={slot === s.time} className={cx(slot === s.time && 'selected')}>{s.time}{slot === s.time && <Icon name="check" size={15} />}</button>)}</div>
    {error && <p className="field-error inline-error" role="alert">{error}</p>}
    <SectionTitle>Consultation type</SectionTitle>
    <div className="option-stack">{doctor.modes.map(m => <button type="button" key={m} className={cx('glass select-row', mode === m && 'selected')} aria-pressed={mode === m} onClick={() => setMode(m)}>
      <span className="select-icon"><Icon name={m === 'video' ? 'video' : 'home'} /></span><div><strong>{m === 'video' ? 'Video consultation' : 'In-person visit'}</strong><p>{m === 'video' ? 'Secure simulated appointment' : 'Fictional demo clinic'}</p></div><span className="radio">{mode === m && <i />}</span>
    </button>)}</div>
    <Glass className="booking-summary"><div><span>{formatDay(date)}</span><strong>{slot ?? 'Choose a time'}</strong></div><div><span>Sample total</span><strong>{money(doctor.price)}</strong></div></Glass>
    <Button onClick={confirm} icon="check" loading={submitting}>{submitting ? 'Creating demo booking…' : reschedule ? 'Confirm new time' : 'Confirm demo booking'}</Button>
  </ScreenShell>
}

function Confirmed() {
  const app = useApp()
  const conf = app.selection.confirmation
  const lab = conf?.kind === 'lab' ? app.labBookings.find(b => b.id === conf.id) : undefined
  const appointment = conf?.kind !== 'lab' ? (app.appointments.find(a => a.id === conf?.id) ?? app.appointments[0]) : undefined
  if (!lab && !appointment) {
    return <ScreenShell noNav className="center-screen confirmation"><EmptyState icon="calendar" title="Nothing to confirm" body="This demo booking is no longer available." action={<Button onClick={() => app.go('home', { reset: true })}>Return home</Button>} /></ScreenShell>
  }
  const doctor = appointment ? doctorById(appointment.doctorId) : null
  const test = lab ? labById(lab.testId) : null
  return <ScreenShell noNav className="center-screen confirmation">
    <div className="success-rings"><div className="success-icon"><Icon name="check" size={34} /></div></div>
    <Tag tone="teal">SIMULATED CONFIRMATION</Tag>
    <div className="hero-title compact">You’re all set.</div>
    <p>{lab ? 'This demo lab booking was saved on this device. It was not sent to a laboratory.' : 'This prototype appointment was added to your demo schedule. It was not sent to a provider.'}</p>
    <Glass className="confirmation-card">
      {doctor && appointment && <div className="doctor-row"><DoctorAvatar doctor={doctor} className="doctor-avatar" /><div><strong>{doctor.name}</strong><p>{appointment.mode === 'video' ? 'Video consultation' : 'In-person visit'}</p></div></div>}
      {test && lab && <div className="doctor-row"><div className="doctor-avatar placeholder p2"><Icon name="lab" size={18} /></div><div><strong>{test.name}</strong><p>{lab.collection === 'home' ? 'Home collection' : 'Lab visit'}</p></div></div>}
      <div className="confirmation-details"><div><Icon name="calendar" /><span><small>DATE</small>{formatDay((appointment ?? lab)!.date, 'long')}</span></div><div><Icon name="clock" /><span><small>TIME</small>{appointment ? `${appointment.time} • 15 min` : lab!.window}</span></div></div>
      <div className="booking-code">Demo reference <strong>{(appointment ?? lab)!.reference}</strong></div>
    </Glass>
    <Button onClick={() => app.openSheet(appointment ? { type: 'appointment', id: appointment.id } : { type: 'lab', id: lab!.id })} icon={appointment ? 'calendar' : 'lab'}>{appointment ? 'View appointment' : 'View booking status'}</Button>
    <Button onClick={() => app.go('home', { reset: true })} kind="ghost">Return home</Button>
  </ScreenShell>
}

function AppointmentSheet() {
  const app = useApp()
  const open = app.sheet?.type === 'appointment'
  const lastId = useRef('')
  if (open) lastId.current = app.sheet!.id
  const appointment = app.appointments.find(a => a.id === lastId.current)
  const doctor = appointment ? doctorById(appointment.doctorId) : null
  return <Sheet open={open && !!appointment} onClose={app.closeSheet} portal={app.overlayEl} title="Appointment details" subtitle="Demo booking • not sent to a provider">
    {appointment && doctor && <>
      <div className="sheet-summary"><DoctorAvatar doctor={doctor} className="doctor-avatar" /><div><strong>{doctor.name}</strong><p>{doctor.specialty}</p></div><Tag tone="teal">DEMO</Tag></div>
      <div className="detail-list">
        <div><span>Date</span><strong>{formatDay(appointment.date, 'long')}</strong></div>
        <div><span>Time</span><strong>{appointment.time} • 15 min</strong></div>
        <div><span>Type</span><strong>{appointment.mode === 'video' ? 'Simulated video consultation' : 'In person • fictional clinic'}</strong></div>
        <div><span>Reference</span><strong>{appointment.reference}</strong></div>
      </div>
      <div className="sheet-actions stacked">
        {appointment.mode === 'video' && <Button icon="video" onClick={() => { app.select({ appointmentId: appointment.id }); app.go('video') }}>Join demo consultation</Button>}
        <Button kind="secondary" icon="calendar" onClick={() => { app.select({ doctorId: doctor.id, rescheduleId: appointment.id, bookingDate: appointment.date }); app.go('booking') }}>Reschedule</Button>
        <Button kind="ghost" onClick={() => app.confirm({ title: 'Cancel this demo appointment?', body: 'It will be removed from your demo schedule on this device. No provider is contacted.', confirmLabel: 'Cancel appointment', tone: 'danger', onConfirm: () => { app.closeSheet(); app.cancelAppointment(appointment.id); app.toast('Demo appointment cancelled', { tone: 'info' }) } })}>Cancel appointment</Button>
      </div>
    </>}
  </Sheet>
}

const formatTimer = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

function VideoCall() {
  const app = useApp()
  const appointment = app.appointments.find(a => a.id === app.selection.appointmentId) ?? app.appointments[0]
  const doctor = doctorById(appointment?.doctorId)
  const [phase, setPhase] = useState<'connecting' | 'live' | 'ended'>('connecting')
  const [seconds, setSeconds] = useState(0)
  const [mic, setMic] = useState(true)
  const [cam, setCam] = useState(true)
  const [info, setInfo] = useState(false)
  useEffect(() => {
    if (phase !== 'connecting') return
    const timer = window.setTimeout(() => setPhase('live'), 1400)
    return () => window.clearTimeout(timer)
  }, [phase])
  useEffect(() => {
    if (phase !== 'live') return
    const timer = window.setInterval(() => setSeconds(s => s + 1), 1000)
    return () => window.clearInterval(timer)
  }, [phase])
  const end = () => app.confirm({ title: 'End demo consultation?', body: 'No real call is connected. Ending shows a short summary of this simulated session.', confirmLabel: 'End consultation', tone: 'danger', onConfirm: () => setPhase('ended') })
  return <ScreenShell noNav className={cx('video-screen', `call-${phase}`)}>
    {doctor.image ? <img className="video-bg" src={doctor.image} alt="Simulated clinician video" /> : <div className="video-bg video-fallback"><span>{doctor.initials}</span></div>}
    <div className="video-shade" />
    <div className="call-top">
      <Tag tone="teal"><i className="live-dot" /> {phase === 'connecting' ? 'CONNECTING • SIMULATED' : phase === 'live' ? `SIMULATED • ${formatTimer(seconds)}` : 'ENDED • SIMULATED'}</Tag>
      <IconButton name="menu" label="Call information" onClick={() => setInfo(true)} />
    </div>
    {phase === 'connecting' && <div className="call-status" role="status"><Spinner size={22} /><strong>Preparing simulated session…</strong><p>No camera, microphone or network call is used.</p></div>}
    {phase !== 'ended' && <>
      <div className="call-copy"><span>Demo consultation</span><strong>{doctor.name}</strong><p>{mic ? 'Connection preview • not a real call' : 'You are muted • not a real call'}</p></div>
      <div className={cx('self-view', !cam && 'off')}>{cam ? <div className="self-placeholder">{initials(app.profile.name)}</div> : <Icon name="cameraOff" />}<span>You{!mic && ' • muted'}</span></div>
      <div className="call-controls">
        <div><IconButton name={mic ? 'mic' : 'micOff'} label={mic ? 'Mute microphone' : 'Unmute microphone'} pressed={!mic} onClick={() => setMic(!mic)} danger={!mic} disabled={phase !== 'live'} /><span>{mic ? 'Mute' : 'Unmute'}</span></div>
        <div><IconButton name={cam ? 'video' : 'cameraOff'} label={cam ? 'Turn camera off' : 'Turn camera on'} pressed={!cam} onClick={() => setCam(!cam)} danger={!cam} disabled={phase !== 'live'} /><span>{cam ? 'Camera' : 'Camera off'}</span></div>
        <div><IconButton name="close" label="End call" onClick={end} danger /><span>End</span></div>
      </div>
    </>}
    {phase === 'ended' && <div className="call-ended glass" role="status">
      <div className="success-icon small"><Icon name="check" size={24} /></div>
      <strong>Demo consultation ended</strong>
      <p>Simulated duration {formatTimer(seconds)}. No audio or video was transmitted and no clinical advice was given.</p>
      <Button icon="home" onClick={() => app.go('home', { reset: true })}>Return home</Button>
      <Button kind="ghost" onClick={() => setPhase('connecting')}>Restart demo</Button>
    </div>}
    <Sheet open={info} onClose={() => setInfo(false)} portal={app.overlayEl} title="Call information" subtitle="Simulated session">
      <div className="detail-list">
        <div><span>Connection</span><strong>Simulated • no network call</strong></div>
        <div><span>Camera & microphone</span><strong>Not accessed</strong></div>
        <div><span>Participant</span><strong>{doctor.name} (fictional)</strong></div>
      </div>
      <Button onClick={() => setInfo(false)}>Close</Button>
    </Sheet>
  </ScreenShell>
}

/* ---------- Pharmacy ---------- */

type ProductFilter = 'all' | 'featured' | 'wellness' | 'devices' | 'first-aid'
const PRODUCT_FILTERS: [ProductFilter, string][] = [['featured', 'Featured'], ['all', 'All'], ['wellness', 'Wellness'], ['devices', 'Devices'], ['first-aid', 'First aid']]

function Pharmacy() {
  const app = useApp()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ProductFilter>('featured')
  const [added, setAdded] = useState('')
  const later = useLater()
  const list = PRODUCTS.filter(p => (category === 'all' || (category === 'featured' ? p.featured : p.category === category)) && `${p.name} ${p.type}`.toLowerCase().includes(query.trim().toLowerCase()))
  const add = (id: string, name: string) => {
    app.addToCart(id, 1); setAdded(id); later(() => setAdded(a => a === id ? '' : a), 1400)
    app.toast(`${name} added to demo cart`, { actionLabel: 'View cart', onAction: () => app.go('cart') })
  }
  return <ScreenShell>
    <Header title="Pharmacy" subtitle="Sample products • prototype shop" action={<CartButton />} />
    <Search value={query} onChange={setQuery} placeholder="Search sample products" />
    <Glass className="pharmacy-banner"><div><Tag>CARE ESSENTIALS</Tag><strong>Little things for everyday wellbeing.</strong><button type="button" onClick={() => { app.select({ productId: 'kit' }); app.go('medicine') }}>Explore collection <Icon name="arrow" size={14} /></button></div><div className="product-orb"><Icon name="medicine" size={35} /></div></Glass>
    <Chips label="Product category" options={PRODUCT_FILTERS} value={category} onChange={setCategory} />
    <SectionTitle action={category !== 'all' && <button type="button" className="text-link" onClick={() => { setCategory('all'); setQuery('') }}>See all</button>}>{category === 'featured' ? 'Recommended' : PRODUCT_FILTERS.find(f => f[0] === category)?.[1]}</SectionTitle>
    {list.length ? <div className="product-grid">{list.map(p => <div className="product-card" key={p.id}>
      <button type="button" className="product-open" onClick={() => { app.select({ productId: p.id }); app.go('medicine') }} aria-label={`${p.name}, ${money(p.price)}`}>
        <div className={`product-art ${p.tone}`}><Icon name={p.icon} size={31} /><span>DEMO</span></div>
        <div className="product-copy"><small>{p.type}</small><strong>{p.name}</strong><div><span>{money(p.price)}</span></div></div>
      </button>
      <button type="button" className={cx('product-add', added === p.id && 'added')} aria-label={`Add ${p.name} to cart`} onClick={() => add(p.id, p.name)}><Icon name={added === p.id ? 'check' : 'plus'} size={15} /></button>
    </div>)}</div>
      : <EmptyState icon="search" title="No products found" body="Try a different search or category." action={<Button kind="secondary" onClick={() => { setQuery(''); setCategory('all') }}>Clear search</Button>} />}
  </ScreenShell>
}

function Medicine() {
  const app = useApp()
  const product = productById(app.selection.productId)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const later = useLater()
  const add = () => {
    if (added) return
    app.addToCart(product.id, qty); setAdded(true); later(() => setAdded(false), 1600)
    app.toast(`${qty} × ${product.name} added to demo cart`, { actionLabel: 'View cart', onAction: () => app.go('cart') })
  }
  return <ScreenShell noNav>
    <Header title="Product details" back fallback="pharmacy" action={<CartButton />} />
    <div className="detail-art"><div className="product-package"><Icon name={product.icon} size={38} /><span>AERIS</span><strong>{product.type.split(' ')[0].toUpperCase()}</strong><small>{product.name}</small></div><Tag>FICTIONAL PRODUCT</Tag></div>
    <div className="detail-body">
      <div className="product-heading"><div><small>{product.type.toUpperCase()}</small><div className="hero-name">{product.name}</div></div><strong>{money(product.price)}</strong></div>
      <p className="body-copy">{product.description}</p>
      <Glass className="info-callout"><Icon name="shield" /><div><strong>No prescription required</strong><p>Sample listing only. Product availability is not live.</p></div></Glass>
      <SectionTitle>What’s included</SectionTitle>
      <div className="bullet-list">{product.included.map(item => <span key={item}><Icon name="check" />{item}</span>)}</div>
      <div className="quantity-row"><span>Quantity</span><div><IconButton name="minus" label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty(Math.max(1, qty - 1))} /><strong aria-live="polite" key={qty} className="qty-value">{qty}</strong><IconButton name="plus" label="Increase quantity" disabled={qty >= 9} onClick={() => setQty(Math.min(9, qty + 1))} /></div></div>
      <Button onClick={add} icon={added ? 'check' : 'cart'} className={cx(added && 'btn-success')}>{added ? 'Added to demo cart' : `Add to demo cart • ${money(product.price * qty)}`}</Button>
    </div>
  </ScreenShell>
}

function Cart() {
  const app = useApp()
  const [submitting, setSubmitting] = useState(false)
  const [order, setOrder] = useState<{ reference: string; count: number; total: number } | null>(null)
  const later = useLater()
  const lines = app.cart.map(line => ({ ...line, product: productById(line.productId) }))
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0)
  const fee = subtotal > 0 ? 2 : 0
  const count = lines.reduce((sum, l) => sum + l.qty, 0)
  const remove = (productId: string, name: string) => {
    const snapshot = app.cart
    app.removeFromCart(productId)
    app.toast(`${name} removed`, { tone: 'info', actionLabel: 'Undo', onAction: () => app.restoreCart(snapshot) })
  }
  const checkout = () => {
    if (submitting || !lines.length) return
    setSubmitting(true)
    later(() => {
      setOrder({ reference: reference(), count, total: subtotal + fee })
      app.restoreCart([])
      app.addNotification({ title: 'Demo order summary created', body: 'No order was placed and no payment was processed.', icon: 'medicine', tone: 'violet', target: 'cart' }, 'service')
      setSubmitting(false)
    }, 900)
  }
  return <ScreenShell noNav>
    <Header title={order ? 'Order summary' : 'Your cart'} subtitle={order ? 'Prototype only' : `${count} fictional ${count === 1 ? 'item' : 'items'}`} back fallback="pharmacy" />
    {order ? <div className="inline-success">
      <div className="success-icon"><Icon name="check" /></div>
      <Tag tone="teal">SIMULATED CHECKOUT</Tag>
      <div className="hero-name">Demo order summary</div>
      <p>No order was placed, no pharmacy was contacted and no payment was processed.</p>
      <Glass className="price-card"><div><span>Demo reference</span><strong>{order.reference}</strong></div><div><span>Items</span><strong>{order.count}</strong></div><div className="total"><span>Demo total</span><strong>{money(order.total)}</strong></div></Glass>
      <Button onClick={() => app.go('home', { reset: true })}>Return home</Button>
      <Button kind="ghost" onClick={() => app.go('pharmacy', { replace: true })}>Continue browsing</Button>
    </div> : lines.length ? <>
      <div className="cart-list">{lines.map(l => <Glass className="cart-item" key={l.productId}>
        <div className={cx('cart-thumb', l.product.tone === 'violet' && 'violet')}><Icon name={l.product.icon} /></div>
        <div><strong>{l.product.name}</strong><p>{l.product.type} • Demo</p><span>{money(l.product.price * l.qty)}</span></div>
        <div className="cart-actions">
          <button type="button" className="cart-remove" aria-label={`Remove ${l.product.name}`} onClick={() => remove(l.productId, l.product.name)}><Icon name="trash" size={14} /></button>
          <div className="mini-quantity"><button type="button" aria-label={`Decrease ${l.product.name}`} disabled={l.qty <= 1} onClick={() => app.setQty(l.productId, l.qty - 1)}>−</button><span key={l.qty}>{l.qty}</span><button type="button" aria-label={`Increase ${l.product.name}`} disabled={l.qty >= 9} onClick={() => app.setQty(l.productId, l.qty + 1)}>+</button></div>
        </div>
      </Glass>)}</div>
      <Glass className="delivery-card"><Icon name="activity" /><div><strong>Prototype checkout</strong><p>No delivery, pharmacy, or payment service is connected.</p></div></Glass>
      <Glass className="price-card"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div><span>Sample service fee</span><strong>{money(fee)}</strong></div><div className="total"><span>Demo total</span><strong>{money(subtotal + fee)}</strong></div></Glass>
      <Button onClick={checkout} icon="lock" loading={submitting}>{submitting ? 'Preparing summary…' : 'Continue in prototype'}</Button>
      <p className="center-note">You will not be charged.</p>
    </> : <EmptyState icon="cart" title="Your demo cart is empty" body="Browse fictional sample products to try the cart flow." action={<Button onClick={() => app.go('pharmacy', { replace: true })}>Browse pharmacy</Button>} />}
  </ScreenShell>
}

/* ---------- Labs ---------- */

type LabFilter = 'all' | 'wellness' | 'nutrition' | 'heart'

function Labs() {
  const app = useApp()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<LabFilter>('all')
  const list = LAB_TESTS.filter(t => (category === 'all' || t.category === category) && t.name.toLowerCase().includes(query.trim().toLowerCase()))
  return <ScreenShell noNav>
    <Header title="Lab tests" subtitle="Browse fictional test options" back />
    <Search value={query} onChange={setQuery} placeholder="Search sample tests" />
    <Chips label="Test category" options={[['all', 'Popular'], ['wellness', 'Wellness'], ['nutrition', 'Nutrition'], ['heart', 'Heart']]} value={category} onChange={setCategory} />
    <Glass className="lab-banner"><span><Icon name="lab" size={31} /></span><div><Tag tone="teal">HOME COLLECTION</Tag><strong>Comfort, on your schedule</strong><p>Simulated collection booking</p></div></Glass>
    {app.labBookings.length > 0 && <>
      <SectionTitle>Your demo bookings</SectionTitle>
      <div className="lab-list">{app.labBookings.map(b => { const t = labById(b.testId); return <button type="button" className="glass lab-card booking-status" key={b.id} onClick={() => app.openSheet({ type: 'lab', id: b.id })}>
        <span className="lab-icon"><Icon name="calendar" /></span><div><strong>{t.name}</strong><p>{formatDay(b.date)} • {b.window}</p><div><Tag tone="amber">DEMO • NOT SENT</Tag><b>{b.reference}</b></div></div><Icon name="chevron" size={17} />
      </button> })}</div>
    </>}
    <SectionTitle>{category === 'all' ? 'Popular tests' : 'Matching tests'}</SectionTitle>
    {list.length ? <div className="lab-list">{list.map((t, i) => <button type="button" className="glass lab-card" key={t.id} onClick={() => { app.select({ labId: t.id }); app.go('labBooking') }} aria-label={`${t.name}, ${money(t.price)}`}>
      <span className={`lab-icon l${i % 3}`}><Icon name={t.icon} /></span><div><strong>{t.name}</strong><p>{t.measures} sample measures • Sample information</p><div><Tag tone={t.home ? 'teal' : 'violet'}>{t.home ? 'HOME OPTION' : 'CLINIC VISIT'}</Tag><b>${t.price}</b></div></div><Icon name="chevron" size={17} />
    </button>)}</div>
      : <EmptyState icon="search" title="No tests match" body="Try another search term or category." action={<Button kind="secondary" onClick={() => { setQuery(''); setCategory('all') }}>Clear search</Button>} />}
    <p className="legal-note"><Icon name="help" size={16} /> Test information is illustrative and not medical advice.</p>
  </ScreenShell>
}

function LabBooking() {
  const app = useApp()
  const test = labById(app.selection.labId)
  const dates = WEEK.slice(1, 5).map(dayKey)
  const [collection, setCollection] = useState<'home' | 'lab'>(test.home ? 'home' : 'lab')
  const [date, setDate] = useState(dates[0])
  const [window, setWindow] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const later = useLater()
  const confirm = () => {
    if (submitting) return
    if (!window) { setError('Choose a time window to continue.'); return }
    setSubmitting(true)
    later(() => {
      const id = `lab-${Date.now()}`
      app.saveLabBooking({ id, testId: test.id, date, window, collection, reference: reference() })
      app.addNotification({ title: 'Demo lab booking created', body: `${test.name} • ${formatDay(date)}. Not sent to a laboratory.`, icon: 'lab', tone: 'teal', target: 'labs' }, 'service')
      app.select({ confirmation: { kind: 'lab', id } })
      app.go('confirmed', { replace: true })
    }, 800)
  }
  return <ScreenShell noNav>
    <Header title="Test details" back fallback="labs" />
    <div className="lab-detail-head"><div className="lab-large-icon"><Icon name={test.icon} size={34} /></div><Tag tone="teal">FICTIONAL TEST</Tag><div className="hero-name">{test.name}</div><p>{test.description} • {test.measures} sample measures</p></div>
    <Glass className="warning-card"><Icon name="help" /><div><strong>Sample preparation note</strong><p>Follow instructions from your actual provider. This content is not clinical guidance.</p></div></Glass>
    <SectionTitle>Collection option</SectionTitle>
    <div className="option-stack">
      <button type="button" className={cx('glass select-row', collection === 'home' && 'selected')} aria-pressed={collection === 'home'} disabled={!test.home} onClick={() => setCollection('home')}><span className="select-icon"><Icon name="home" /></span><div><strong>Home collection</strong><p>{test.home ? 'Sample visit at a chosen window' : 'Not offered for this sample test'}</p></div><span className="radio">{collection === 'home' && <i />}</span></button>
      <button type="button" className={cx('glass select-row', collection === 'lab' && 'selected')} aria-pressed={collection === 'lab'} onClick={() => setCollection('lab')}><span className="select-icon"><Icon name="lab" /></span><div><strong>Visit a lab</strong><p>Fictional demo location</p></div><span className="radio">{collection === 'lab' && <i />}</span></button>
    </div>
    <SectionTitle>Choose a date</SectionTitle>
    <div className="slots-row wide">{dates.map(key => <button type="button" key={key} className={cx('date-card', date === key && 'selected')} aria-pressed={date === key} onClick={() => setDate(key)}><small>{fromKey(key).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</small><strong>{fromKey(key).getDate()}</strong><span>Jun</span></button>)}</div>
    <SectionTitle>Time window</SectionTitle>
    <div className="time-grid">{LAB_WINDOWS.map(w => <button type="button" key={w} className={cx(window === w && 'selected')} aria-pressed={window === w} onClick={() => { setWindow(w); setError('') }}>{w}</button>)}</div>
    {error && <p className="field-error inline-error" role="alert">{error}</p>}
    <Glass className="booking-summary"><div><span>Sample test</span><strong>{money(test.price)}</strong></div><div><span>{formatDay(date)}</span><strong>{window ?? 'Choose a window'}</strong></div></Glass>
    <Button onClick={confirm} icon="calendar" loading={submitting}>{submitting ? 'Creating demo booking…' : 'Confirm demo booking'}</Button>
  </ScreenShell>
}

function LabSheet() {
  const app = useApp()
  const open = app.sheet?.type === 'lab'
  const lastId = useRef('')
  if (open) lastId.current = app.sheet!.id
  const booking = app.labBookings.find(b => b.id === lastId.current)
  const test = booking ? labById(booking.testId) : null
  return <Sheet open={open && !!booking} onClose={app.closeSheet} portal={app.overlayEl} title="Booking status" subtitle="Demo booking • not sent to a laboratory">
    {booking && test && <>
      <div className="status-track"><div className="done"><i /><span>Created in prototype</span></div><div><i /><span>Sent to lab — not available</span></div><div><i /><span>Sample collected — not available</span></div></div>
      <div className="detail-list">
        <div><span>Test</span><strong>{test.name}</strong></div>
        <div><span>Date</span><strong>{formatDay(booking.date, 'long')}</strong></div>
        <div><span>Window</span><strong>{booking.window} • {booking.collection === 'home' ? 'Home' : 'Lab visit'}</strong></div>
        <div><span>Reference</span><strong>{booking.reference}</strong></div>
      </div>
      <div className="sheet-actions stacked">
        <Button kind="secondary" onClick={() => app.go('labs')}>View lab tests</Button>
        <Button kind="ghost" onClick={() => app.confirm({ title: 'Cancel this demo booking?', body: 'It will be removed from this device. No laboratory is contacted.', confirmLabel: 'Cancel booking', tone: 'danger', onConfirm: () => { app.closeSheet(); app.cancelLabBooking(booking.id); app.toast('Demo lab booking cancelled', { tone: 'info' }) } })}>Cancel booking</Button>
      </div>
    </>}
  </Sheet>
}

/* ---------- Records ---------- */

function Records() {
  const app = useApp()
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<'all' | RecordItem['kind']>('all')
  const [order, setOrder] = useState<'newest' | 'oldest'>('newest')
  const [upload, setUpload] = useState(false)
  const count = (k: RecordItem['kind']) => RECORDS.filter(r => r.kind === k).length
  const list = RECORDS.filter(r => (kind === 'all' || r.kind === kind) && `${r.title} ${r.source}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => order === 'newest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date))
  const stats: [RecordItem['kind'], IconName, string][] = [['report', 'document', 'Reports'], ['prescription', 'medicine', 'Prescriptions'], ['visit', 'doctor', 'Visit notes']]
  return <ScreenShell>
    <Header title="Health records" subtitle={`${app.profile.name} • Demo profile`} action={<IconButton name="plus" label="Add document" onClick={() => setUpload(true)} />} />
    <Glass className="privacy-banner"><Icon name="lock" /><div><strong>Your private space</strong><p>These fictional records are visible only in this prototype.</p></div></Glass>
    <Search value={query} onChange={setQuery} placeholder="Search your demo records" />
    <div className="record-stats">{stats.map(([k, icon, label]) => <button type="button" key={k} className={cx(kind === k && 'active')} aria-pressed={kind === k} onClick={() => setKind(kind === k ? 'all' : k)}><span><Icon name={icon} /></span><strong>{count(k)}</strong><small>{label}</small></button>)}</div>
    <SectionTitle action={<button type="button" className="filter-button" onClick={() => setOrder(order === 'newest' ? 'oldest' : 'newest')} aria-label={`Sort by ${order === 'newest' ? 'oldest' : 'newest'} first`}><Icon name="menu" /> {order === 'newest' ? 'Newest' : 'Oldest'}</button>}>{kind === 'all' ? 'Recent records' : stats.find(s => s[0] === kind)?.[2]}</SectionTitle>
    {list.length ? <div className="record-list">{list.map(r => <button type="button" key={r.id} onClick={() => { app.select({ recordId: r.id }); app.go('report') }}><span className={`record-icon ${r.tone}`}><Icon name={r.icon} /></span><div><strong>{r.title}</strong><p>{r.source} • {formatRecordDate(r.date)}</p></div><Icon name="chevron" size={17} /></button>)}</div>
      : <EmptyState icon="records" title="No records found" body="Nothing matches this search or category." action={<Button kind="secondary" onClick={() => { setQuery(''); setKind('all') }}>Show all records</Button>} />}
    <button type="button" className="glass empty-hint" onClick={() => setUpload(true)}><Icon name="plus" /><div><strong>Add your first document</strong><p>Upload is represented as a prototype-only action.</p></div></button>
    <Sheet open={upload} onClose={() => setUpload(false)} portal={app.overlayEl} title="Add a document" subtitle="Prototype-only action">
      <div className="notice notice-info"><Icon name="lock" /><div><strong>Uploads aren’t enabled</strong><p>This prototype has no secure storage, so documents can’t be uploaded. Please don’t add real health records.</p></div></div>
      <Button onClick={() => setUpload(false)}>Got it</Button>
    </Sheet>
  </ScreenShell>
}

function Report() {
  const app = useApp()
  const record = recordById(app.selection.recordId)
  const [actions, setActions] = useState(false)
  return <ScreenShell noNav>
    <Header title="Report details" subtitle="Fictional sample record" back fallback="records" action={<IconButton name="menu" label="More options" onClick={() => setActions(true)} />} />
    <Glass className="report-meta"><span className={`record-icon ${record.tone}`}><Icon name={record.icon} /></span><div><strong>{record.title}</strong><p>{record.source} • {fromKey(record.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p></div><Tag tone="teal">DEMO</Tag></Glass>
    <div className="document-preview">
      <div className="doc-head"><div className="mini-brand"><Icon name="activity" /></div><div><strong>AERIS SAMPLE</strong><span>Illustrative {recordKindLabel[record.kind].toLowerCase()}</span></div></div>
      <div className="redacted-name"><small>PROFILE</small><strong>{app.profile.name}</strong><span>Demo ID • AE-1024</span></div>
      <div className="sample-alert"><Icon name="shield" /><span>No values shown here are real medical results.</span></div>
      <div className="fake-results">{['Overview', 'Sample observations', 'Provider notes'].map((x, i) => <div key={x}><span>{x}</span><i style={{ width: `${72 - i * 14}%` }} /><i style={{ width: `${46 + i * 12}%` }} /></div>)}</div>
      <div className="doc-watermark">SAMPLE</div>
    </div>
    <Glass className="file-info"><div><span>Document type</span><strong>{recordKindLabel[record.kind]} • PDF preview</strong></div><div><span>Added</span><strong>{formatRecordDate(record.date)}</strong></div><div><span>Profile</span><strong>{app.profile.name}</strong></div></Glass>
    <Button onClick={() => app.stack.includes('records') ? app.back('records') : app.go('records', { replace: true })} kind="secondary" icon="back">Back to records</Button>
    <Sheet open={actions} onClose={() => setActions(false)} portal={app.overlayEl} title="Document options" subtitle={record.title}>
      <div className="action-list">
        <button type="button" disabled><Icon name="document" /><div><strong>Download PDF</strong><p>Not available — sample documents have no file.</p></div></button>
        <button type="button" disabled><Icon name="mail" /><div><strong>Share securely</strong><p>Not available — sharing requires a connected account.</p></div></button>
        <button type="button" onClick={() => { setActions(false); app.go('records', { replace: true }) }}><Icon name="records" /><div><strong>View all records</strong><p>Return to your demo record list.</p></div></button>
      </div>
    </Sheet>
  </ScreenShell>
}

/* ---------- Emergency ---------- */

function Emergency() {
  const app = useApp()
  const [guide, setGuide] = useState(false)
  const contact = app.profile.emergencyContact
  return <ScreenShell noNav className="emergency-screen">
    <Header title="Emergency information" back />
    <div className="emergency-hero"><span><Icon name="activity" size={31} /></span><div className="hero-name">In immediate danger?</div><p>Contact your local emergency services now. Aeris does not provide emergency response.</p></div>
    <Glass className="urgent-card"><Tag tone="red">URGENT</Tag><strong>Use your device’s emergency call feature</strong><p>Emergency numbers vary by region. Verify the correct number for your current location.</p><Button kind="danger" icon="phone" onClick={() => setGuide(true)}>How to call for help</Button></Glass>
    <SectionTitle>While help is on the way</SectionTitle>
    <div className="guidance-list"><div><span>1</span><p><strong>Move to a safe place</strong> if you can do so without increasing risk.</p></div><div><span>2</span><p><strong>Share your exact location</strong> with the emergency operator.</p></div><div><span>3</span><p><strong>Follow dispatcher instructions</strong> and do not delay seeking help.</p></div></div>
    <Glass className="ice-card">
      <div><Icon name="user" /><span><small>DEMO EMERGENCY CONTACT</small><strong>{contact || 'Not added yet'}</strong><p>{contact ? 'Family • Not connected' : 'Add one in your profile'}</p></span></div>
      {contact ? <IconButton name="phone" label="Call demo emergency contact" onClick={() => app.toast('Demo contact isn’t connected — no call was placed. Use your phone to call.', { tone: 'info' })} />
        : <IconButton name="plus" label="Add emergency contact" onClick={() => { app.select({ editProfile: true }); app.go('profile') }} />}
    </Glass>
    <p className="legal-note"><Icon name="shield" size={16} /> This screen provides general access guidance, not medical advice.</p>
    <Sheet open={guide} onClose={() => setGuide(false)} portal={app.overlayEl} title="Calling for help" subtitle="General guidance • no numbers are assumed">
      <div className="guidance-list">
        <div><span>1</span><p><strong>Open your phone app</strong> and dial your local emergency number.</p></div>
        <div><span>2</span><p><strong>From a locked phone,</strong> use the Emergency or Emergency SOS option on the lock screen.</p></div>
        <div><span>3</span><p><strong>Not sure of the number?</strong> Ask someone nearby or check your local government’s guidance.</p></div>
      </div>
      <div className="notice notice-danger"><Icon name="phone" /><div><strong>Aeris cannot place calls</strong><p>This prototype doesn’t connect to emergency services or know your region.</p></div></div>
      <Button onClick={() => setGuide(false)}>Close</Button>
    </Sheet>
  </ScreenShell>
}

/* ---------- Notifications ---------- */

function Notifications() {
  const app = useApp()
  const unread = useUnreadCount()
  const open = (n: NotificationItem) => {
    app.markRead(n.id)
    if (n.target === 'appointment') { const next = app.appointments[0]; if (next) { app.go('home', { reset: true }); window.setTimeout(() => app.openSheet({ type: 'appointment', id: next.id }), 0) } else app.go('doctors') }
    if (n.target === 'cart') app.go('cart')
    if (n.target === 'report') { app.select({ recordId: 'r1' }); app.go('report') }
    if (n.target === 'settings') app.go('settings')
    if (n.target === 'labs') app.go('labs')
  }
  const groups = (['Today', 'Earlier'] as const).map(g => [g, app.notifications.filter(n => n.group === g)] as const).filter(([, list]) => list.length)
  return <ScreenShell noNav>
    <Header title="Notifications" subtitle="Demo activity" back action={<button type="button" className="text-link" disabled={!unread} onClick={() => { app.markAllRead(); app.toast('All notifications marked as read') }}>Mark all read</button>} />
    {app.notifications.length ? <>
      <div className="notification-list">{groups.map(([group, list]) => <div key={group} className="notification-group">
        <SectionTitle>{group}</SectionTitle>
        {list.map(n => <button type="button" key={n.id} className={cx('glass notification', !n.read && 'unread')} onClick={() => open(n)} aria-label={`${n.read ? '' : 'Unread: '}${n.title}. ${n.body}`}>
          <span className={`notify-icon ${n.tone}`}><Icon name={n.icon} /></span><div><strong>{n.title}</strong><p>{n.body}</p><small>{n.time}</small></div>{!n.read && <i />}
        </button>)}
      </div>)}</div>
      {!unread && <div className="empty-state-mini"><Icon name="check" /><span>You’re all caught up</span></div>}
      <div className="notification-footer">
        <button type="button" className="text-link" onClick={() => app.go('settings')}>Notification preferences</button>
        <button type="button" className="text-link muted-link" onClick={() => app.confirm({ title: 'Clear all notifications?', body: 'This removes demo notifications from this device.', confirmLabel: 'Clear all', tone: 'danger', onConfirm: () => { app.clearNotifications(); app.toast('Notifications cleared', { tone: 'info' }) } })}>Clear all</button>
      </div>
    </> : <EmptyState icon="bell" title="No notifications" body="Demo reminders and service updates will appear here." action={<Button kind="secondary" onClick={() => app.go('settings')}>Notification preferences</Button>} />}
  </ScreenShell>
}

/* ---------- Profile, settings, help ---------- */

function EditProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const app = useApp()
  const [draft, setDraft] = useState<Profile>(app.profile)
  const [errors, setErrors] = useState<Partial<Record<keyof Profile, string>>>({})
  useEffect(() => { if (open) { setDraft(app.profile); setErrors({}) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (key: keyof Profile) => (value: string) => { setDraft(d => ({ ...d, [key]: value })); setErrors(e => ({ ...e, [key]: undefined })) }
  const save = () => {
    const next: typeof errors = {}
    if (draft.name.trim().length < 2) next.name = 'Enter your full name.'
    if (!isEmail(draft.email)) next.email = 'Enter a valid email address.'
    if (draft.phone && !/^\+?[\d\s()-]{7,}$/.test(draft.phone)) next.phone = 'Enter a valid phone number or leave it blank.'
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    app.setProfile({ name: draft.name.trim(), email: draft.email.trim(), phone: draft.phone.trim(), emergencyContact: draft.emergencyContact.trim() })
    app.toast('Profile saved on this device'); onClose()
  }
  return <Sheet open={open} onClose={onClose} portal={app.overlayEl} title="Personal details" subtitle="Demo profile • stored only in this browser">
    <div className="form-stack compact">
      <Field id="p-name" label="Full name" placeholder="Your name" icon="user" value={draft.name} onChange={set('name')} error={errors.name} autoComplete="name" />
      <Field id="p-email" label="Email" placeholder="you@example.com" icon="mail" value={draft.email} onChange={set('email')} error={errors.email} autoComplete="email" inputMode="email" />
      <Field id="p-phone" label="Phone (optional)" placeholder="Add a phone number" icon="phone" value={draft.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" inputMode="tel" />
      <Field id="p-contact" label="Emergency contact (optional)" placeholder="Contact name" icon="heart" value={draft.emergencyContact} onChange={set('emergencyContact')} />
    </div>
    <div className="sheet-actions"><Button kind="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} icon="check">Save changes</Button></div>
  </Sheet>
}

function Profile() {
  const app = useApp()
  const [editing, setEditing] = useState(false)
  useEffect(() => { if (app.selection.editProfile) { setEditing(true); app.select({ editProfile: false }) } }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const fields: [keyof Profile, string][] = [['name', 'name'], ['email', 'email'], ['phone', 'phone number'], ['emergencyContact', 'emergency contact']]
  const missing = fields.filter(([k]) => !app.profile[k].trim())
  const completion = Math.round(((fields.length - missing.length) / fields.length) * 100)
  const menu: { name: string; detail: string; icon: IconName; run: () => void }[] = [
    { name: 'Personal details', detail: 'Name, contact and demo profile', icon: 'user', run: () => setEditing(true) },
    { name: 'Health records', detail: 'Reports and documents', icon: 'records', run: () => app.go('records') },
    { name: 'Notifications', detail: 'Demo reminders and updates', icon: 'bell', run: () => app.go('notifications') },
    { name: 'Settings & privacy', detail: 'Preferences and data controls', icon: 'settings', run: () => app.go('settings') },
    { name: 'Help & support', detail: 'Answers and contact options', icon: 'help', run: () => app.go('help') },
  ]
  return <ScreenShell>
    <Header title="Profile" action={<IconButton name="settings" label="Open settings" onClick={() => app.go('settings')} />} />
    <div className="profile-summary"><div className="avatar large-avatar"><span>{initials(app.profile.name)}</span><i /></div><div className="hero-name">{app.profile.name}</div><p>{app.profile.email} • Demo profile</p><Tag tone="teal"><Icon name="shield" size={13} /> PRIVACY PROTECTED</Tag></div>
    <Glass className="profile-completion"><div><strong>Profile completeness</strong><span>{completion}%</span></div><div className="progress"><i style={{ width: `${completion}%` }} /></div><p>{missing.length ? <>Add your {missing.map(m => m[1]).join(' and ')} to complete your demo profile. <button type="button" className="text-link" onClick={() => setEditing(true)}>Edit</button></> : 'Your demo profile is complete.'}</p></Glass>
    <div className="settings-list">{menu.map(m => <button type="button" key={m.name} onClick={m.run}><span><Icon name={m.icon} /></span><div><strong>{m.name}</strong><p>{m.detail}</p></div><Icon name="chevron" size={17} /></button>)}</div>
    <button type="button" className="signout" onClick={() => app.confirm({ title: 'Sign out of the prototype?', body: 'Your demo data stays on this device. You can sign back in at any time.', confirmLabel: 'Sign out', tone: 'danger', onConfirm: () => { app.signOut(); app.toast('Signed out of the demo profile', { tone: 'info' }) } })}>Sign out of prototype</button>
    <EditProfileSheet open={editing} onClose={() => setEditing(false)} />
  </ScreenShell>
}

function Settings() {
  const app = useApp()
  const { theme } = useTheme()
  const [status, setStatus] = useState(`${theme === 'light' ? 'Light' : 'Dark'} theme saved on this device`)
  const [sheet, setSheet] = useState<'language' | 'text' | 'privacy' | 'security' | 'consent' | null>(null)
  const lastTheme = useRef(theme)
  useEffect(() => { if (lastTheme.current !== theme) { lastTheme.current = theme; setStatus(`${theme === 'light' ? 'Light' : 'Dark'} theme saved on this device`) } }, [theme])
  const pref = (key: 'appointments' | 'service' | 'wellness', label: string) => (value: boolean) => { app.setPrefs({ [key]: value }); setStatus(`${label} ${value ? 'on' : 'off'} — saved on this device`) }
  const closeSheet = () => setSheet(null)
  return <ScreenShell noNav>
    <Header title="Settings" subtitle="Preferences and privacy" back fallback="profile" />
    <SectionTitle>Notifications</SectionTitle>
    <Glass className="preference-card">
      <div><span><strong>Appointments</strong><p>Reminders and schedule changes</p></span><Toggle on={app.prefs.appointments} onChange={pref('appointments', 'Appointment notifications')} label="Appointment notifications" /></div>
      <div><span><strong>Service updates</strong><p>Prototype order and report status</p></span><Toggle on={app.prefs.service} onChange={pref('service', 'Service updates')} label="Service notifications" /></div>
      <div><span><strong>Wellness tips</strong><p>Occasional general information</p></span><Toggle on={app.prefs.wellness} onChange={pref('wellness', 'Wellness tips')} label="Wellness notifications" /></div>
    </Glass>
    <SectionTitle>Appearance & language</SectionTitle>
    <Glass className="preference-card">
      <div><span><strong>Theme</strong><p>{theme === 'light' ? 'Light emerald glass' : 'Dark navy glass'}</p></span><ThemeToggle className="settings-theme-toggle" /></div>
      <button type="button" onClick={() => setSheet('language')}><span><strong>Language</strong><p>English (US)</p></span><Icon name="chevron" /></button>
      <button type="button" onClick={() => setSheet('text')}><span><strong>Text size</strong><p>{app.prefs.textSize === 'large' ? 'Larger' : 'Default'}</p></span><Icon name="chevron" /></button>
    </Glass>
    <SectionTitle>Privacy & account</SectionTitle>
    <div className="settings-list compact-list">
      <button type="button" onClick={() => setSheet('privacy')}><span><Icon name="shield" /></span><div><strong>Privacy controls</strong><p>Review demo data permissions</p></div><Icon name="chevron" /></button>
      <button type="button" onClick={() => setSheet('security')}><span><Icon name="lock" /></span><div><strong>Security</strong><p>Password and device access</p></div><Icon name="chevron" /></button>
      <button type="button" onClick={() => setSheet('consent')}><span><Icon name="document" /></span><div><strong>Data and consent</strong><p>How sample data is represented</p></div><Icon name="chevron" /></button>
    </div>
    <div className="saved-toast" role="status" key={status}><Icon name="check" /> {status}</div>

    <Sheet open={sheet === 'language'} onClose={closeSheet} portal={app.overlayEl} title="Language" subtitle="Interface language">
      <div className="action-list">
        <button type="button" className="selected" onClick={closeSheet}><Icon name="check" /><div><strong>English (US)</strong><p>Current language</p></div></button>
        <button type="button" disabled><span className="icon-spacer" /><div><strong>Español</strong><p>Not available in this prototype</p></div></button>
        <button type="button" disabled><span className="icon-spacer" /><div><strong>Français</strong><p>Not available in this prototype</p></div></button>
      </div>
    </Sheet>
    <Sheet open={sheet === 'text'} onClose={closeSheet} portal={app.overlayEl} title="Text size" subtitle="Applies across the app">
      <div className="action-list">{(['default', 'large'] as const).map(size => <button type="button" key={size} className={cx(app.prefs.textSize === size && 'selected')} aria-pressed={app.prefs.textSize === size} onClick={() => { app.setPrefs({ textSize: size }); setStatus(`Text size set to ${size === 'large' ? 'larger' : 'default'}`); closeSheet() }}>
        {app.prefs.textSize === size ? <Icon name="check" /> : <span className="icon-spacer" />}<div><strong>{size === 'large' ? 'Larger' : 'Default'}</strong><p>{size === 'large' ? 'Increases text rendering size' : 'Designed reading size'}</p></div>
      </button>)}</div>
    </Sheet>
    <Sheet open={sheet === 'privacy'} onClose={closeSheet} portal={app.overlayEl} title="Privacy controls" subtitle="Saved on this device">
      <Glass className="preference-card"><div><span><strong>Hide details on Home</strong><p>Hide doctor and record names on the dashboard</p></span><Toggle on={app.prefs.hideHomeDetails} onChange={v => { app.setPrefs({ hideHomeDetails: v }); setStatus(`Home details ${v ? 'hidden' : 'visible'} — saved on this device`) }} label="Hide details on Home" /></div></Glass>
      <p className="sheet-note">No data leaves this browser. There are no analytics or third-party sharing in this prototype.</p>
      <Button onClick={closeSheet}>Done</Button>
    </Sheet>
    <Sheet open={sheet === 'security'} onClose={closeSheet} portal={app.overlayEl} title="Security" subtitle="Demo account">
      <div className="notice notice-info"><Icon name="lock" /><div><strong>Password and device management aren’t available</strong><p>Demo sign-in doesn’t verify credentials, so there’s no password to change.</p></div></div>
      <div className="sheet-actions"><Button kind="ghost" onClick={closeSheet}>Close</Button><Button kind="secondary" onClick={() => { closeSheet(); app.confirm({ title: 'Sign out of the prototype?', body: 'Your demo data stays on this device.', confirmLabel: 'Sign out', tone: 'danger', onConfirm: () => app.signOut() }) }}>Sign out</Button></div>
    </Sheet>
    <Sheet open={sheet === 'consent'} onClose={closeSheet} portal={app.overlayEl} title="Data and consent" subtitle="How this prototype handles data">
      <div className="sheet-copy"><p>All doctors, products, tests and records are fictional. Bookings, carts and preferences are stored in this browser’s local storage only.</p><p>Resetting restores the original sample data. Your theme choice is kept.</p></div>
      <div className="sheet-actions"><Button kind="ghost" onClick={closeSheet}>Close</Button><Button kind="danger" onClick={() => { closeSheet(); app.confirm({ title: 'Reset demo data?', body: 'Appointments, lab bookings, cart, notifications and profile edits return to the sample state.', confirmLabel: 'Reset data', tone: 'danger', onConfirm: () => { app.resetDemoData(); setStatus('Demo data reset on this device'); app.toast('Demo data reset', { tone: 'info' }) } }) }}>Reset demo data</Button></div>
    </Sheet>
  </ScreenShell>
}

type Topic = 'all' | 'bookings' | 'account' | 'privacy' | 'orders'
const FAQS: { q: string; a: string; topic: Exclude<Topic, 'all'> }[] = [
  { q: 'Are services connected?', a: 'No. Aeris is an interactive design prototype. No booking, order, payment or consultation is real.', topic: 'bookings' },
  { q: 'How do I reschedule a demo appointment?', a: 'Open Home → Up next → Manage, then choose Reschedule. Changes stay on this device.', topic: 'bookings' },
  { q: 'Why didn’t Google sign-in work?', a: 'Google OAuth isn’t configured for this prototype. Use email in demo mode instead.', topic: 'account' },
  { q: 'How is my information used?', a: 'This concept does not submit or store personal healthcare information on a server. Demo data stays in your browser.', topic: 'privacy' },
  { q: 'Can I place a real pharmacy order?', a: 'No. Checkout creates a demo summary only. Nothing is ordered or charged.', topic: 'orders' },
  { q: 'Can I use Aeris in an emergency?', a: 'No. Contact verified local emergency services for immediate danger.', topic: 'privacy' },
]

function Help() {
  const app = useApp()
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState<Topic>('all')
  const [open, setOpen] = useState<string | null>(FAQS[0].q)
  const [message, setMessage] = useState(false)
  const [text, setText] = useState('')
  const [msgError, setMsgError] = useState('')
  const [sendState, setSendState] = useState<'idle' | 'loading' | 'done'>('idle')
  const later = useLater()
  const list = FAQS.filter(f => (topic === 'all' || f.topic === topic) && `${f.q} ${f.a}`.toLowerCase().includes(query.trim().toLowerCase()))
  const topics: [Exclude<Topic, 'all'>, IconName, string, string][] = [['bookings', 'calendar', 'Bookings', 'Appointments & tests'], ['account', 'user', 'Account', 'Profile & access'], ['privacy', 'lock', 'Privacy', 'Data & security'], ['orders', 'medicine', 'Orders', 'Demo pharmacy']]
  const send = () => {
    if (text.trim().length < 10) { setMsgError('Please describe your question in at least 10 characters.'); return }
    setMsgError(''); setSendState('loading'); later(() => setSendState('done'), 800)
  }
  return <ScreenShell noNav>
    <Header title="Help & support" subtitle="What can we help with?" back fallback="profile" />
    <Search value={query} onChange={setQuery} placeholder="Search help topics" />
    <div className="support-grid">{topics.map(([key, icon, label, note]) => <button type="button" key={key} className={cx(topic === key && 'active')} aria-pressed={topic === key} onClick={() => setTopic(topic === key ? 'all' : key)}><span><Icon name={icon} /></span><strong>{label}</strong><small>{note}</small></button>)}</div>
    <SectionTitle action={topic !== 'all' && <button type="button" className="text-link" onClick={() => setTopic('all')}>Show all</button>}>Frequently asked</SectionTitle>
    {list.length ? <div className="faq-list">{list.map(f => <Glass className={cx('faq', open === f.q && 'open')} key={f.q}>
      <button type="button" aria-expanded={open === f.q} onClick={() => setOpen(open === f.q ? null : f.q)}><strong>{f.q}</strong><Icon name="plus" /></button>
      <div className="faq-answer"><p>{f.a}</p></div>
    </Glass>)}</div> : <EmptyState icon="help" title="No answers found" body="Try a different search or send us a prototype message." />}
    <SectionTitle>Still need help?</SectionTitle>
    <Glass className="contact-card"><span><Icon name="help" /></span><div><strong>Prototype support</strong><p>Contact options are shown for demonstration only.</p></div><Button kind="secondary" onClick={() => { setMessage(true); setSendState('idle') }}>Message</Button></Glass>
    <p className="center-note">AERIS CONCEPT • VERSION 1.0</p>
    <Sheet open={message} onClose={() => setMessage(false)} portal={app.overlayEl} title="Message support" subtitle="Prototype-only">
      {sendState === 'done'
        ? <div className="notice notice-warning" role="status"><Icon name="mail" /><div><strong>Support messaging isn’t connected</strong><p>Your message wasn’t sent. In a live product, this would reach a support team.</p></div></div>
        : <div className={cx('field', msgError && 'has-error')}><label htmlFor="support-msg">Your message</label><textarea id="support-msg" className="textarea" rows={4} placeholder="Describe your question" value={text} onChange={e => { setText(e.target.value); setMsgError('') }} aria-invalid={!!msgError} />{msgError && <p className="field-error" role="alert">{msgError}</p>}</div>}
      <div className="sheet-actions">{sendState === 'done' ? <Button onClick={() => { setMessage(false); setText('') }}>Close</Button> : <><Button kind="ghost" onClick={() => setMessage(false)}>Cancel</Button><Button onClick={send} loading={sendState === 'loading'}>Send</Button></>}</div>
    </Sheet>
  </ScreenShell>
}

/* ---------- App shell ---------- */

const navItems: { key: Screen; label: string; icon: IconName }[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'doctors', label: 'Doctors', icon: 'doctor' },
  { key: 'pharmacy', label: 'Pharmacy', icon: 'medicine' },
  { key: 'records', label: 'Records', icon: 'records' },
  { key: 'profile', label: 'Profile', icon: 'user' },
]

function BottomNav() {
  const app = useApp()
  const index = NAV_SCREENS.indexOf(app.screen)
  const visible = index >= 0
  const lastIndex = useRef(0)
  if (visible) lastIndex.current = index
  return <nav className={cx('bottom-nav', !visible && 'nav-hidden')} aria-label="Main navigation" aria-hidden={!visible} inert={!visible}>
    <span className="nav-indicator" style={{ '--nav-i': lastIndex.current } as React.CSSProperties} aria-hidden="true" />
    {navItems.map(item => <button type="button" key={item.key} className={cx(app.screen === item.key && 'active')} aria-current={app.screen === item.key ? 'page' : undefined} onClick={() => app.go(item.key, { replace: visible })}>
      <Icon name={item.icon} size={19} /><span>{item.label}</span>
    </button>)}
  </nav>
}

function ConfirmDialog() {
  const app = useApp()
  const last = useRef(app.dialog)
  if (app.dialog) last.current = app.dialog
  const { mounted, closing } = usePresence(!!app.dialog, 200)
  const confirmBtn = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!app.dialog) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') app.closeDialog() }
    window.addEventListener('keydown', onKey)
    requestAnimationFrame(() => confirmBtn.current?.querySelector<HTMLButtonElement>('button')?.focus())
    return () => window.removeEventListener('keydown', onKey)
  }, [app.dialog]) // eslint-disable-line react-hooks/exhaustive-deps
  const d = last.current
  if (!mounted || !d) return null
  return <div className={cx('overlay dialog-overlay', closing && 'closing')}>
    <div className="overlay-backdrop" onClick={app.closeDialog} />
    <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-body">
      <div className="dialog-title" id="dialog-title">{d.title}</div>
      <p id="dialog-body">{d.body}</p>
      <div className="sheet-actions" ref={confirmBtn}><Button kind="ghost" onClick={app.closeDialog}>Keep</Button><Button kind={d.tone === 'danger' ? 'danger' : 'primary'} onClick={() => { app.closeDialog(); d.onConfirm() }}>{d.confirmLabel}</Button></div>
    </div>
  </div>
}

function ToastHost() {
  const app = useApp()
  const toast = app.toastState
  const last = useRef(toast)
  if (toast) last.current = toast
  const { mounted, closing } = usePresence(!!toast, 200)
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(app.dismissToast, toast.actionLabel ? 5000 : 3400)
    return () => window.clearTimeout(timer)
  }, [toast]) // eslint-disable-line react-hooks/exhaustive-deps
  const t = last.current
  if (!mounted || !t) return null
  return <div className={cx('toast', `toast-${t.tone}`, closing && 'closing', NAV_SCREENS.includes(app.screen) && 'above-nav')} role="status" aria-live="polite" key={t.id}>
    <Icon name={t.tone === 'error' ? 'close' : t.tone === 'info' ? 'help' : 'check'} size={16} />
    <span>{t.message}</span>
    {t.actionLabel && <button type="button" className="toast-action" onClick={() => { t.onAction?.(); app.dismissToast() }}>{t.actionLabel}</button>}
    <button type="button" className="toast-close" aria-label="Dismiss notification" onClick={app.dismissToast}><Icon name="close" size={14} /></button>
  </div>
}

function ScreenView({ screen }: { screen: Screen }) {
  switch (screen) {
    case 'splash': return <Splash />
    case 'welcome': return <Welcome />
    case 'login': return <Auth mode="login" />
    case 'signup': return <Auth mode="signup" />
    case 'home': return <Home />
    case 'doctors': return <Doctors />
    case 'doctor': return <DoctorProfile />
    case 'booking': return <Booking />
    case 'confirmed': return <Confirmed />
    case 'video': return <VideoCall />
    case 'pharmacy': return <Pharmacy />
    case 'medicine': return <Medicine />
    case 'cart': return <Cart />
    case 'labs': return <Labs />
    case 'labBooking': return <LabBooking />
    case 'records': return <Records />
    case 'report': return <Report />
    case 'emergency': return <Emergency />
    case 'notifications': return <Notifications />
    case 'profile': return <Profile />
    case 'settings': return <Settings />
    case 'help': return <Help />
  }
}

function Phone() {
  const app = useApp()
  return <>
    <div className="phone-stage">
      <div className={cx('phone', app.prefs.textSize === 'large' && 'text-large')} data-screen={app.screen}>
        <span className="phone-island" aria-hidden="true" />
        <span className="phone-button phone-button-mute" aria-hidden="true" />
        <span className="phone-button phone-button-vol-up" aria-hidden="true" />
        <span className="phone-button phone-button-vol-down" aria-hidden="true" />
        <span className="phone-button phone-button-power" aria-hidden="true" />
        <div className="phone-screen">
          <div className="ambient ambient-one" /><div className="ambient ambient-two" />
          <div className="status-bar"><span>9:41</span><span className="status-icons" aria-hidden="true">● ◒ ▰</span></div>
          <ScreenView key={app.screen} screen={app.screen} />
          <BottomNav />
          <div className="overlay-root" ref={app.setOverlayEl} />
          <AppointmentSheet />
          <LabSheet />
          <ConfirmDialog />
          <ToastHost />
          <div className="home-indicator" />
        </div>
      </div>
    </div>
    <button type="button" className="screen-index-button" onClick={() => app.go(app.session ? 'home' : 'welcome', { reset: true })} title={app.session ? 'Jump to home' : 'Jump to welcome'}>
      <Icon name="home" size={17} /><span>Screen {SCREEN_ORDER.indexOf(app.screen) + 1} / {SCREEN_ORDER.length}</span>
    </button>
  </>
}

export default function App() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const setTheme = useCallback((next: Theme) => {
    if (next === theme) return
    const root = document.documentElement
    const apply = () => {
      root.dataset.theme = next
      root.style.removeProperty('background-color')
      try { localStorage.setItem(THEME_STORAGE_KEY, next) } catch { /* Storage can be unavailable in private contexts. */ }
      flushSync(() => setThemeState(next))
    }
    if (prefersReducedMotion()) return apply()
    if (document.startViewTransition) { document.startViewTransition(apply); return }
    root.classList.add('theme-transition')
    apply()
    window.setTimeout(() => root.classList.remove('theme-transition'), 320)
  }, [theme])
  const themeValue = useMemo(() => ({ theme, setTheme }), [theme, setTheme])
  return <ThemeContext.Provider value={themeValue}>
    <AppProvider>
      <div className="app-stage">
        <div className="prototype-label"><span>AERIS</span><small>SMART HEALTHCARE • INTERACTIVE CONCEPT</small></div>
        <Phone />
      </div>
    </AppProvider>
  </ThemeContext.Provider>
}
