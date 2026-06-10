import type { ContactInfo } from "@/lib/content-schema";
import { EmptyState } from "@/components/ui/EmptyState";

function ContactPlaceholderIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="h-10 w-10 text-foreground/40"
    >
      <path
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="h-4 w-4 shrink-0 text-foreground/50"
    >
      <path
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="h-4 w-4 shrink-0 text-foreground/50"
    >
      <path
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="h-4 w-4 shrink-0 text-foreground/50"
    >
      <path
        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ContactSection({ contact }: { contact: ContactInfo }) {
  const isEmpty =
    !contact.name.trim() &&
    !contact.phone.trim() &&
    !contact.email.trim() &&
    !contact.link.trim();

  if (isEmpty) {
    return (
      <section className="flex w-full flex-col items-center gap-3 px-6 py-10">
        <EmptyState
          message="פרטי יצירת קשר יתווספו בקרוב"
          icon={<ContactPlaceholderIcon />}
        />
      </section>
    );
  }

  return (
    <section className="w-full px-6 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-2 rounded-xl border border-foreground/10 bg-foreground/[0.03] px-4 py-4">
        {contact.name.trim() ? (
          <p className="text-base font-semibold leading-snug">
            {contact.name}
          </p>
        ) : null}
        {contact.phone.trim() ? (
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-2 py-3 text-sm leading-none transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            <PhoneIcon />
            <span dir="ltr">{contact.phone}</span>
          </a>
        ) : null}
        {contact.email.trim() ? (
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-2 py-3 text-sm leading-none transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            <EmailIcon />
            <span>{contact.email}</span>
          </a>
        ) : null}
        {contact.link.trim() ? (
          <a
            href={contact.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 py-3 text-sm leading-none transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            <ExternalLinkIcon />
            <span className="truncate">{contact.link}</span>
          </a>
        ) : null}
      </div>
    </section>
  );
}
