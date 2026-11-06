export type Screen =
  | 'splash' | 'welcome' | 'login' | 'signup' | 'home'
  | 'doctors' | 'doctor' | 'booking' | 'confirmed' | 'video'
  | 'pharmacy' | 'medicine' | 'cart' | 'labs' | 'labBooking'
  | 'records' | 'report' | 'emergency' | 'notifications'
  | 'profile' | 'settings' | 'help'

export type IconName =
  | 'activity' | 'arrow' | 'back' | 'bell' | 'calendar' | 'camera' | 'cameraOff'
  | 'cart' | 'check' | 'chevron' | 'clock' | 'close' | 'doctor'
  | 'document' | 'eye' | 'eyeOff' | 'heart' | 'help' | 'home' | 'lab' | 'lock'
  | 'mail' | 'medicine' | 'menu' | 'mic' | 'micOff' | 'minus' | 'phone'
  | 'moon' | 'plus' | 'records' | 'search' | 'settings' | 'shield' | 'sparkle' | 'sun'
  | 'trash' | 'user' | 'video'

export const SCREEN_ORDER: Screen[] = [
  'splash', 'welcome', 'login', 'signup', 'home', 'doctors', 'doctor', 'booking', 'confirmed', 'video', 'pharmacy',
  'medicine', 'cart', 'labs', 'labBooking', 'records', 'report', 'emergency', 'notifications', 'profile', 'settings', 'help',
]
export const NAV_SCREENS: Screen[] = ['home', 'doctors', 'pharmacy', 'records', 'profile']

export const PHOTO = `${import.meta.env.BASE_URL}doctor-portrait.jpg`

/** Fixed prototype "today" so fictional schedules stay internally consistent. */
export const TODAY = new Date(2025, 5, 23)
export const WEEK = Array.from({ length: 7 }, (_, i) => new Date(2025, 5, 23 + i))
export const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export const fromKey = (key: string) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d) }
export const formatDay = (key: string, style: 'short' | 'long' = 'short') => fromKey(key).toLocaleDateString('en-US', style === 'long'
  ? { weekday: 'long', month: 'long', day: 'numeric' }
  : { weekday: 'short', month: 'short', day: 'numeric' })
export const relativeDay = (key: string) => {
  const diff = Math.round((fromKey(key).getTime() - TODAY.getTime()) / 86400000)
  return diff <= 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `In ${diff} days`
}
export const money = (value: number) => `$${value.toFixed(2)}`

export type Doctor = {
  id: string; name: string; specialty: string; category: 'primary' | 'dermatology' | 'cardiology' | 'pediatrics'
  initials: string; image?: string; years: string; language: string; price: number; modes: ('video' | 'clinic')[]
  firstOpenDay: number; about: string
}

export const DOCTORS: Doctor[] = [
  { id: 'cole', name: 'Dr. Adrian Cole', specialty: 'General medicine', category: 'primary', initials: 'AC', image: PHOTO, years: '8 yrs', language: 'English', price: 45, modes: ['video', 'clinic'], firstOpenDay: 0, about: 'A fictional clinician profile used to demonstrate appointment discovery and booking. No credentials or availability are verified.' },
  { id: 'moreau', name: 'Dr. Lina Moreau', specialty: 'Dermatology', category: 'dermatology', initials: 'LM', years: '11 yrs', language: 'English, French', price: 60, modes: ['video'], firstOpenDay: 1, about: 'A fictional dermatology profile for exploring the prototype booking flow. Experience and languages are sample content.' },
  { id: 'patel', name: 'Dr. Samir Patel', specialty: 'Cardiology', category: 'cardiology', initials: 'SP', years: '14 yrs', language: 'English, Hindi', price: 75, modes: ['clinic', 'video'], firstOpenDay: 3, about: 'A fictional cardiology profile. This prototype does not verify clinicians, specialties, or appointment availability.' },
  { id: 'okafor', name: 'Dr. Grace Okafor', specialty: 'Family medicine', category: 'primary', initials: 'GO', years: '9 yrs', language: 'English', price: 45, modes: ['video', 'clinic'], firstOpenDay: 0, about: 'A fictional family medicine profile used to demonstrate search, filters and booking states.' },
  { id: 'chen', name: 'Dr. Wei Chen', specialty: 'Pediatrics', category: 'pediatrics', initials: 'WC', years: '6 yrs', language: 'English, Mandarin', price: 50, modes: ['clinic'], firstOpenDay: 2, about: 'A fictional pediatrics profile. All profile details are sample content for this design prototype.' },
]

export const TIMES = ['9:00 AM', '10:30 AM', '1:00 PM', '2:30 PM', '4:00 PM', '5:30 PM']

/** Deterministic fictional availability. Sunday is closed and slots before a doctor's first open day are unavailable. */
export function slotsFor(doctor: Doctor, dayIndex: number) {
  if (dayIndex === 6 || dayIndex < doctor.firstOpenDay) return TIMES.map(time => ({ time, open: false }))
  const seed = doctor.id.length + dayIndex * 3
  return TIMES.map((time, i) => ({ time, open: dayIndex === 0 ? i >= 3 && (i + seed) % 2 === 0 : (i + seed) % 3 !== 0 }))
}
export const openDays = (doctor: Doctor) => WEEK.map((date, i) => ({ key: dayKey(date), index: i, open: slotsFor(doctor, i).filter(s => s.open).length })).filter(d => d.open > 0)

export type Product = {
  id: string; name: string; type: string; category: 'wellness' | 'devices' | 'first-aid' | 'accessories'; featured: boolean
  price: number; icon: IconName; tone: 'cyan' | 'violet' | 'teal' | 'blue'; description: string; included: string[]
}

export const PRODUCTS: Product[] = [
  { id: 'kit', name: 'Everyday wellness kit', type: 'Personal care', category: 'wellness', featured: true, price: 18, icon: 'sparkle', tone: 'cyan', description: 'A fictional set of everyday personal-care essentials shown for this shopping prototype.', included: ['Travel-size care essentials', 'Reusable frosted pouch', 'Sample product information card'] },
  { id: 'thermo', name: 'Digital thermometer', type: 'Health devices', category: 'devices', featured: true, price: 24, icon: 'activity', tone: 'violet', description: 'A fictional home device listing used to demonstrate product details and cart behavior.', included: ['Sample device', 'Protective case', 'Quick-start card'] },
  { id: 'aid', name: 'Travel first aid kit', type: 'First aid', category: 'first-aid', featured: true, price: 16.5, icon: 'medicine', tone: 'teal', description: 'A fictional compact first aid bundle for this prototype shop. Contents are illustrative.', included: ['Assorted sample supplies', 'Compact zip case', 'Contents checklist'] },
  { id: 'organizer', name: 'Daily organizer', type: 'Accessories', category: 'accessories', featured: true, price: 9, icon: 'calendar', tone: 'blue', description: 'A fictional weekly organizer accessory used to demonstrate the product catalog.', included: ['Seven-day organizer', 'Travel sleeve'] },
  { id: 'bottle', name: 'Insulated water bottle', type: 'Wellness', category: 'wellness', featured: false, price: 21, icon: 'heart', tone: 'teal', description: 'A fictional hydration accessory for this prototype store.', included: ['Insulated bottle', 'Spare lid'] },
  { id: 'monitor', name: 'Sleep tracking band', type: 'Health devices', category: 'devices', featured: false, price: 39, icon: 'clock', tone: 'cyan', description: 'A fictional wearable listing. This prototype does not collect device data.', included: ['Sample band', 'Charging cable'] },
]

export type LabTest = {
  id: string; name: string; category: 'wellness' | 'nutrition' | 'heart'; measures: number; price: number
  icon: IconName; home: boolean; description: string
}

export const LAB_TESTS: LabTest[] = [
  { id: 'wellness', name: 'General wellness panel', category: 'wellness', measures: 8, price: 64, icon: 'activity', home: true, description: 'Illustrative screening bundle' },
  { id: 'vitamin', name: 'Vitamin screening', category: 'nutrition', measures: 4, price: 48, icon: 'sparkle', home: true, description: 'Illustrative nutrition bundle' },
  { id: 'heart', name: 'Heart health panel', category: 'heart', measures: 6, price: 72, icon: 'heart', home: false, description: 'Illustrative clinic-visit bundle' },
  { id: 'iron', name: 'Iron profile', category: 'nutrition', measures: 3, price: 36, icon: 'lab', home: true, description: 'Illustrative nutrition bundle' },
]
export const LAB_WINDOWS = ['8–10 AM', '10 AM–12 PM', '2–4 PM']

export type RecordItem = {
  id: string; title: string; kind: 'report' | 'prescription' | 'visit'; date: string; source: string
  icon: IconName; tone: 'cyan' | 'violet' | 'teal'
}

export const RECORDS: RecordItem[] = [
  { id: 'r1', title: 'Wellness summary', kind: 'report', date: '2025-06-18', source: 'Sample report', icon: 'document', tone: 'cyan' },
  { id: 'r2', title: 'Visit note', kind: 'visit', date: '2025-05-03', source: 'Demo consultation', icon: 'doctor', tone: 'violet' },
  { id: 'r3', title: 'Sample prescription', kind: 'prescription', date: '2025-04-22', source: 'Illustrative document', icon: 'medicine', tone: 'teal' },
  { id: 'r4', title: 'Annual checkup summary', kind: 'report', date: '2025-03-14', source: 'Sample report', icon: 'document', tone: 'cyan' },
  { id: 'r5', title: 'Follow-up visit note', kind: 'visit', date: '2025-02-09', source: 'Demo consultation', icon: 'doctor', tone: 'violet' },
  { id: 'r6', title: 'Imaging summary', kind: 'report', date: '2025-01-21', source: 'Sample report', icon: 'document', tone: 'cyan' },
]
export const recordKindLabel = { report: 'Report', prescription: 'Prescription', visit: 'Visit note' }

export type NotificationItem = {
  id: string; title: string; body: string; time: string; group: 'Today' | 'Earlier'; icon: IconName
  tone: 'cyan' | 'violet' | 'teal' | 'amber'; read: boolean; target: 'appointment' | 'cart' | 'report' | 'settings' | 'labs'
}

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', title: 'Appointment reminder', body: 'Your demo consultation is scheduled for Wed at 10:30 AM.', time: '8 min ago', group: 'Today', icon: 'calendar', tone: 'cyan', read: false, target: 'appointment' },
  { id: 'n2', title: 'Demo cart saved', body: 'Sample items are waiting in your cart.', time: '2 hours ago', group: 'Today', icon: 'medicine', tone: 'violet', read: false, target: 'cart' },
  { id: 'n3', title: 'Sample report added', body: 'Your fictional wellness summary is ready to preview.', time: 'Jun 18', group: 'Earlier', icon: 'document', tone: 'teal', read: true, target: 'report' },
  { id: 'n4', title: 'Privacy checkup', body: 'Review the prototype’s privacy controls.', time: 'Jun 12', group: 'Earlier', icon: 'shield', tone: 'amber', read: true, target: 'settings' },
]

export type Appointment = { id: string; doctorId: string; date: string; time: string; mode: 'video' | 'clinic'; reference: string }
export type LabBooking = { id: string; testId: string; date: string; window: string; collection: 'home' | 'lab'; reference: string }
export type CartLine = { productId: string; qty: number }
export type Profile = { name: string; email: string; phone: string; emergencyContact: string }
export type Prefs = { appointments: boolean; service: boolean; wellness: boolean; hideHomeDetails: boolean; textSize: 'default' | 'large' }

export const INITIAL_APPOINTMENTS: Appointment[] = [{ id: 'apt-seed', doctorId: 'cole', date: '2025-06-25', time: '10:30 AM', mode: 'video', reference: 'AE-2406' }]
export const INITIAL_CART: CartLine[] = [{ productId: 'kit', qty: 1 }, { productId: 'thermo', qty: 1 }]
export const INITIAL_PROFILE: Profile = { name: 'Maya Anderson', email: 'maya@example.com', phone: '', emergencyContact: 'Alex Anderson' }
export const INITIAL_PREFS: Prefs = { appointments: true, service: true, wellness: false, hideHomeDetails: false, textSize: 'default' }

export const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('') || 'ME'
export const isEmailOrPhone = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) || /^\+?[\d\s()-]{7,}$/.test(value.trim())
export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
