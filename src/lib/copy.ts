// Every user-facing string, in Thai and English. TypeScript makes `en` match the shape of `th`.

const th = {
  /** For Intl date and time formatting. */
  locale: "th-TH",
  and: "และ",
  meta: {
    title: "TMail · เข้าดูกล่องจดหมาย",
    inboxTitle: "กล่องจดหมาย · TMail",
    description: "กรอกอีเมลเพื่ออ่านอีเมลจาก {services}",
  },
  header: {
    home: "หน้าแรก TMail",
    language: "ภาษา",
  },
  landing: {
    eyebrow: "กล่องจดหมายแบบอ่านอย่างเดียว",
    title: "เปิดกล่องจดหมาย",
    subtitle: "กรอกอีเมลของบัญชีเพื่ออ่านอีเมลที่ส่งเข้ามา",
    label: "อีเมล",
    placeholder: "กรอกอีเมลของคุณ",
    hint: "ใช้อีเมลที่ได้รับมาพร้อมบัญชี",
    submit: "เข้าดูกล่องจดหมาย",
    submitting: "กำลังเปิดกล่องจดหมาย…",
    clear: "ล้างอีเมล",
    continueWith: "กลับไปที่ {email}",
    recent: "กล่องล่าสุด",
    errors: {
      empty: "กรอกอีเมลก่อน",
      invalid: "รูปแบบอีเมลไม่ถูกต้อง",
      unsupported: "เราไม่รองรับอีเมลนี้ ใช้อีเมลที่ได้รับมาพร้อมบัญชี",
    },
    servicesTitle: "บริการที่รองรับ",
    servicesCaption: "รหัสยืนยันและอีเมลรีเซ็ตรหัสผ่านจากบริการเหล่านี้จะเข้ามาที่นี่",
  },
  inbox: {
    title: "กล่องจดหมาย",
    copyEmail: "คัดลอกอีเมล",
    emailCopied: "คัดลอกอีเมลแล้ว",
    changeEmail: "เปลี่ยนอีเมล",
    unread: "ยังไม่อ่าน {n}",
    messages: "อีเมล",
    refresh: "รีเฟรช",
    refreshAria: "ตรวจหาอีเมลใหม่",
    autoRefresh: "รีเฟรชอัตโนมัติ",
    lastChecked: "ตรวจล่าสุด {time}",
    status: {
      live: "เชื่อมต่อแล้ว",
      checking: "กำลังตรวจหาอีเมลใหม่…",
      offline: "ออฟไลน์",
      reconnecting: "กำลังเชื่อมต่อใหม่…",
    },
    loading: "กำลังตรวจหาอีเมลใหม่…",
    waitingTitle: "รออีเมลเข้า…",
    waitingBody: "ยังไม่มีอีเมล อีเมลใหม่จากบริการที่รองรับจะขึ้นที่นี่เอง ไม่ต้องกดรีเฟรช",
    errorTitle: "โหลดกล่องจดหมายไม่ได้",
    unavailableTitle: "เปิดกล่องจดหมายนี้ไม่ได้",
    unavailableBody: "ตรวจอีเมลแล้วลองอีกครั้ง",
    retry: "ลองอีกครั้ง",
    offlineTitle: "คุณออฟไลน์อยู่",
    offlineBody: "เราจะตรวจหาอีเมลใหม่ทันทีที่คุณกลับมาออนไลน์",
    noSubject: "(ไม่มีหัวเรื่อง)",
    noPreview: "ไม่มีตัวอย่างข้อความ",
    unknownSender: "ไม่ทราบผู้ส่ง",
    unreadLabel: "ยังไม่อ่าน",
    hasAttachments: "มีไฟล์แนบ",
    listLabel: "รายการอีเมล",
    newEmail: "มีอีเมลใหม่",
    newEmails: "มีอีเมลใหม่ {n} ฉบับ",
  },
  reader: {
    back: "กลับไปกล่องจดหมาย",
    close: "ปิดอีเมล",
    to: "ถึง",
    received: "ได้รับ {time}",
    attachments: "ไฟล์แนบ ({n})",
    download: "ดาวน์โหลด {name}",
    emptyTitle: "เลือกอีเมลเพื่ออ่าน",
    emptyBody: "เลือกอีเมลจากรายการ แล้วเนื้อหาจะขึ้นที่นี่",
    goneTitle: "เปิดอีเมลนี้ไม่ได้",
    goneBody: "อีเมลนี้ไม่อยู่ในกล่องจดหมายแล้ว",
    contentTitle: "เนื้อหาอีเมล",
    noContent: "(อีเมลนี้ไม่มีเนื้อหา)",
  },
  toast: {
    copyFailed: "คัดลอกไม่ได้ เลือกข้อความแล้วคัดลอกเอง",
    dismiss: "ปิดการแจ้งเตือน",
  },
  errors: {
    INVALID_INPUT: "รูปแบบอีเมลไม่ถูกต้อง",
    NOT_FOUND: "เปิดกล่องจดหมายนี้ไม่ได้",
    RATE_LIMITED: "ส่งคำขอถี่เกินไป รอสักครู่แล้วลองใหม่",
    TIMEOUT: "เซิร์ฟเวอร์อีเมลตอบช้าเกินไป ลองใหม่อีกครั้ง",
    NETWORK: "ติดต่อเซิร์ฟเวอร์อีเมลไม่ได้",
    UPSTREAM: "เซิร์ฟเวอร์อีเมลมีปัญหา ลองใหม่อีกครั้ง",
    INVALID_RESPONSE: "เซิร์ฟเวอร์อีเมลมีปัญหา ลองใหม่อีกครั้ง",
    OFFLINE: "คุณออฟไลน์อยู่ ตรวจการเชื่อมต่อแล้วลองใหม่",
    generic: "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง",
  },
  footer: {
    note: "เก็บอีเมลนี้เป็นความลับ ใครรู้อีเมลก็เปิดกล่องนี้ได้ รวมถึงอ่านอีเมลรีเซ็ตรหัสผ่านของบัญชีคุณ",
    rights: "© TMail",
  },
  time: {
    justNow: "เมื่อสักครู่",
  },
};

export type Copy = typeof th;

const en: Copy = {
  locale: "en-US",
  and: "and",
  meta: {
    title: "TMail · Open your inbox",
    inboxTitle: "Inbox · TMail",
    description: "Enter your email address to read mail from {services}.",
  },
  header: {
    home: "TMail home",
    language: "Language",
  },
  landing: {
    eyebrow: "Read-only inbox",
    title: "Open your inbox",
    subtitle: "Enter your account's email address to read the mail it receives.",
    label: "Email address",
    placeholder: "Enter your email address",
    hint: "Use the email address that came with your account.",
    submit: "Open inbox",
    submitting: "Opening your inbox…",
    clear: "Clear email address",
    continueWith: "Continue with {email}",
    recent: "Last opened",
    errors: {
      empty: "Enter your email address.",
      invalid: "Enter a valid email address.",
      unsupported: "We don't support this email address. Use the one that came with your account.",
    },
    servicesTitle: "Supported services",
    servicesCaption: "Verification codes and password reset emails from these services arrive here.",
  },
  inbox: {
    title: "Inbox",
    copyEmail: "Copy email",
    emailCopied: "Email copied",
    changeEmail: "Change email",
    unread: "{n} unread",
    messages: "Messages",
    refresh: "Refresh",
    refreshAria: "Check for new messages",
    autoRefresh: "Auto-refresh on",
    lastChecked: "Last checked {time}",
    status: {
      live: "Connected",
      checking: "Checking for new messages…",
      offline: "Offline",
      reconnecting: "Reconnecting…",
    },
    loading: "Checking for new messages…",
    waitingTitle: "Waiting for email…",
    waitingBody: "No mail yet. New mail from supported services shows up here on its own, no refresh needed.",
    errorTitle: "Couldn't load your inbox",
    unavailableTitle: "This inbox isn't available",
    unavailableBody: "Check the email address and try again.",
    retry: "Retry",
    offlineTitle: "You're offline",
    offlineBody: "We'll check for new mail as soon as you're back online.",
    noSubject: "(no subject)",
    noPreview: "No preview",
    unknownSender: "Unknown sender",
    unreadLabel: "Unread",
    hasAttachments: "Has attachments",
    listLabel: "Messages",
    newEmail: "New email",
    newEmails: "{n} new emails",
  },
  reader: {
    back: "Back to inbox",
    close: "Close email",
    to: "To",
    received: "Received {time}",
    attachments: "Attachments ({n})",
    download: "Download {name}",
    emptyTitle: "Select an email to read",
    emptyBody: "Pick a message from the list to read it here.",
    goneTitle: "Can't open this email",
    goneBody: "It's no longer in this inbox.",
    contentTitle: "Email content",
    noContent: "(This email has no content)",
  },
  toast: {
    copyFailed: "Couldn't copy. Select the text and copy it yourself.",
    dismiss: "Dismiss notification",
  },
  errors: {
    INVALID_INPUT: "Enter a valid email address.",
    NOT_FOUND: "This inbox isn't available.",
    RATE_LIMITED: "Too many requests. Wait a moment and try again.",
    TIMEOUT: "The mail server took too long. Try again.",
    NETWORK: "Can't reach the mail server.",
    UPSTREAM: "The mail server hit a problem. Try again.",
    INVALID_RESPONSE: "The mail server hit a problem. Try again.",
    OFFLINE: "You're offline. Check your connection and try again.",
    generic: "Something went wrong. Try again.",
  },
  footer: {
    note: "Keep this email address private. Anyone who has it can open this inbox and read your account's password reset emails.",
    rights: "© TMail",
  },
  time: {
    justNow: "just now",
  },
};

export type Lang = "th" | "en";

export const COPY: Record<Lang, Copy> = { th, en };

/** "Hello {name}" + { name: "x" } → "Hello x" */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

/** ["a", "b", "c"] → "a, b and c". Intl.ListFormat glues Thai "และ" onto the last item, so join by hand. */
export function joinList(items: string[], and: string): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} ${and} ${items.at(-1)}`;
}
