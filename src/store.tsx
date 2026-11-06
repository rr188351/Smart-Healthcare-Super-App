import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  INITIAL_APPOINTMENTS, INITIAL_CART, INITIAL_NOTIFICATIONS, INITIAL_PREFS, INITIAL_PROFILE, SCREEN_ORDER,
  type Appointment, type CartLine, type LabBooking, type NotificationItem, type Prefs, type Profile, type Screen,
} from './data'

type Selection = {
  doctorId: string; productId: string; labId: string; recordId: string; appointmentId?: string
  bookingDate?: string; rescheduleId?: string; editProfile?: boolean
  confirmation?: { kind: 'appointment' | 'lab'; id: string }
}
export type Toast = { id: number; message: string; tone: 'success' | 'info' | 'error'; actionLabel?: string; onAction?: () => void }
export type ConfirmRequest = { title: string; body: string; confirmLabel: string; tone?: 'danger' | 'primary'; onConfirm: () => void }
export type GlobalSheet = { type: 'appointment' | 'lab'; id: string } | null

const STORAGE_PREFIX = 'aeris-demo-'

function usePersistent<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try { const raw = localStorage.getItem(STORAGE_PREFIX + key); return raw ? JSON.parse(raw) as T : initial } catch { return initial }
  })
  useEffect(() => { try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value)) } catch { /* Storage may be unavailable. */ } }, [key, value])
  return [value, setValue] as const
}

/** Supports explicit deep links like `#/pharmacy`, then clears the hash so normal reloads start at the splash screen. */
function initialScreen(): Screen {
  const requested = window.location.hash.replace(/^#\/?/, '') as Screen
  if (!SCREEN_ORDER.includes(requested)) return 'splash'
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  return requested
}

function useAppState() {
  const [stack, setStack] = useState<Screen[]>(() => [initialScreen()])
  const screen = stack[stack.length - 1]
  const [session, setSession] = usePersistent<{ email: string } | null>('session', null)
  const [profile, setProfile] = usePersistent<Profile>('profile', INITIAL_PROFILE)
  const [appointments, setAppointments] = usePersistent<Appointment[]>('appointments', INITIAL_APPOINTMENTS)
  const [labBookings, setLabBookings] = usePersistent<LabBooking[]>('lab-bookings', [])
  const [cart, setCart] = usePersistent<CartLine[]>('cart', INITIAL_CART)
  const [notifications, setNotifications] = usePersistent<NotificationItem[]>('notifications', INITIAL_NOTIFICATIONS)
  const [prefs, setPrefsState] = usePersistent<Prefs>('prefs', INITIAL_PREFS)
  const [favorites, setFavorites] = usePersistent<string[]>('favorites', [])
  const [selection, setSelection] = useState<Selection>({ doctorId: 'cole', productId: 'kit', labId: 'wellness', recordId: 'r1' })
  const [sheet, setSheet] = useState<GlobalSheet>(null)
  const [dialog, setDialog] = useState<ConfirmRequest | null>(null)
  const [toastState, setToastState] = useState<Toast | null>(null)
  const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null)
  const toastId = useRef(0)

  const go = useCallback((next: Screen, options: { replace?: boolean; reset?: boolean } = {}) => {
    setSheet(null)
    setStack(current => {
      if (options.reset) return [next]
      if (current[current.length - 1] === next) return current
      return options.replace ? [...current.slice(0, -1), next] : [...current, next]
    })
  }, [])
  const back = useCallback((fallback: Screen = 'home') => {
    setSheet(null)
    setStack(current => current.length > 1 ? current.slice(0, -1) : [fallback])
  }, [])
  const toast = useCallback((message: string, options: Partial<Omit<Toast, 'id' | 'message'>> = {}) => {
    toastId.current += 1
    setToastState({ id: toastId.current, message, tone: options.tone ?? 'success', actionLabel: options.actionLabel, onAction: options.onAction })
  }, [])
  const addNotification = useCallback((item: Omit<NotificationItem, 'id' | 'read' | 'group' | 'time'>, kind: 'appointments' | 'service') => {
    if (!prefs[kind]) return
    setNotifications(list => [{ ...item, id: `n-${Date.now()}`, read: false, group: 'Today', time: 'Just now' }, ...list])
  }, [prefs, setNotifications])

  return {
    screen, stack, go, back,
    session, signIn: (email: string) => setSession({ email }), signOut: () => { setSession(null); setStack(['welcome']) },
    profile, setProfile,
    appointments,
    saveAppointment: (appointment: Appointment) => setAppointments(list => [...list.filter(a => a.id !== appointment.id), appointment].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))),
    cancelAppointment: (id: string) => setAppointments(list => list.filter(a => a.id !== id)),
    labBookings,
    saveLabBooking: (booking: LabBooking) => setLabBookings(list => [...list.filter(b => b.id !== booking.id), booking]),
    cancelLabBooking: (id: string) => setLabBookings(list => list.filter(b => b.id !== id)),
    cart,
    addToCart: (productId: string, qty = 1) => setCart(lines => lines.some(l => l.productId === productId)
      ? lines.map(l => l.productId === productId ? { ...l, qty: Math.min(9, l.qty + qty) } : l)
      : [...lines, { productId, qty }]),
    setQty: (productId: string, qty: number) => setCart(lines => lines.map(l => l.productId === productId ? { ...l, qty: Math.max(1, Math.min(9, qty)) } : l)),
    removeFromCart: (productId: string) => setCart(lines => lines.filter(l => l.productId !== productId)),
    restoreCart: (lines: CartLine[]) => setCart(lines),
    notifications, addNotification,
    markRead: (id: string) => setNotifications(list => list.map(n => n.id === id ? { ...n, read: true } : n)),
    markAllRead: () => setNotifications(list => list.map(n => ({ ...n, read: true }))),
    clearNotifications: () => setNotifications([]),
    prefs, setPrefs: (patch: Partial<Prefs>) => setPrefsState(current => ({ ...current, ...patch })),
    favorites, toggleFavorite: (id: string) => setFavorites(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]),
    resetDemoData: () => {
      setAppointments(INITIAL_APPOINTMENTS); setLabBookings([]); setCart(INITIAL_CART); setNotifications(INITIAL_NOTIFICATIONS)
      setPrefsState(INITIAL_PREFS); setFavorites([]); setProfile(INITIAL_PROFILE)
    },
    selection, select: (patch: Partial<Selection>) => setSelection(current => ({ ...current, ...patch })),
    sheet, openSheet: setSheet, closeSheet: () => setSheet(null),
    dialog, confirm: setDialog, closeDialog: () => setDialog(null),
    toastState, toast, dismissToast: () => setToastState(null),
    overlayEl, setOverlayEl,
  }
}

type AppState = ReturnType<typeof useAppState>
const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const state = useAppState()
  return <AppContext.Provider value={state}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}

export function useUnreadCount() {
  const { notifications } = useApp()
  return useMemo(() => notifications.filter(n => !n.read).length, [notifications])
}
