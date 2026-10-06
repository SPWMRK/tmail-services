// Shapes our app works with after validating TMail responses.
// Shared by the server (API client) and the browser (UI), so keep it free of server-only imports.

export interface TMailAttachment {
  name: string;
  url: string;
}

export interface TMailMessage {
  id: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  /** Human-readable date as sent by TMail (may be empty) */
  date: string;
  /** Unix ms when TMail gave us something parseable, else null */
  receivedAt: number | null;
  /** Raw HTML (or plain text) body */
  content: string;
  attachments: TMailAttachment[];
}
