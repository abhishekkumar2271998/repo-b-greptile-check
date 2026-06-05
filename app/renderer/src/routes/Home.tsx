import * as React from 'react';
import { FileText, Globe, Mail, Mic, PencilLine, Phone, RefreshCw, Search, Sparkles, Square, X } from 'lucide-react';
import { MeetingsShell } from '@/components/MeetingsShell';
import { UpcomingCard } from '@/components/home/UpcomingCard';
import { PreviousRow } from '@/components/home/PreviousRow';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { KbdKey } from '@/components/ui/kbd';
import { useMeetings } from '@/hooks/useMeetings';
import { useRecording } from '@/hooks/useRecording';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useFolders } from '@/hooks/useFolders';
import type { Meeting } from '@/lib/ipc';
import { shortcut } from '@/lib/utils';
import { navigate } from '@/lib/router';

interface HomeProps {
  mode: 'home' | 'meetings';
}

export function Home({ mode }: HomeProps) {
  const meetings = useMeetings();
  const folders = useFolders();
  const calendar = useCalendarEvents();
  const recording = useRecording();

  const emptyState = !meetings.data?.length;
  const isRecording = recording.status === 'recording' || recording.status === 'paused';
  // Empty-state CTA: idle or processing → start a new recording (auto-navigates;
  // previous note keeps processing in the background queue); recording/paused
  // → back to /recording.
  const onToggleRecording = () => {
    if (isRecording) {
      navigate('/recording');
    } else {
      void recording.startRecording();
    }
  };

  const folderName = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const f of folders.data ?? []) map.set(f.id, f.name);
    return map;
  }, [folders.data]);

  const upcoming =
    calendar.data && !calendar.data.needsAuth ? calendar.data.events.slice(0, 3) : [];

  const previous = meetings.data ?? [];

  // Search applies only to /meetings (the All meetings list). Home keeps the
  // unfiltered Previous list since it's already chronologically grouped.
  const [search, setSearch] = React.useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const filtered = React.useMemo(() => {
    if (mode !== 'meetings') return previous;
    const needle = search.trim().toLowerCase();
    if (!needle) return previous;
    return previous.filter((m) => {
      const name = m.session_info.name?.toLowerCase() ?? '';
      const summary = m.summary?.toLowerCase() ?? '';
      return name.includes(needle) || summary.includes(needle);
    });
  }, [mode, previous, search]);
  const groups = React.useMemo(() => groupPrevious(filtered), [filtered]);

  const greeting = `Ready to capture beautiful notes`;
  const dateStr = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <MeetingsShell
      activeSummaryFile={null}
      contentAlign={emptyState && mode === 'home' ? 'center' : 'top'}
    >
      {meetings.isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-[color:var(--fg-2)]">
          Loading meetings…
        </div>
      ) : emptyState ? (
        <div className="flex flex-col items-center gap-8 text-center">
          <AppIcon size={56} />
          <div className="space-y-3">
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 44,
                lineHeight: 1.1,
                letterSpacing: '-0.025em',
                color: 'var(--fg-1)',
              }}
            >
              Welcome to StenoAI.
            </h1>
            <p
              className="text-[17px] leading-[1.55]"
              style={{ color: 'var(--fg-2)' }}
            >
              Capture your first meeting — transcription and summaries happen
              locally on your Mac.
            </p>
            <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
              Always get consent when transcribing others.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Button
              variant={isRecording ? 'destructive' : 'default'}
              onClick={onToggleRecording}
              className="gap-2"
            >
              {isRecording ? <Square className="size-4" /> : <PencilLine className="size-4" />}
              {isRecording ? 'Stop recording' : 'New note'}
            </Button>
            <p
              className="flex items-center gap-1.5 text-xs"
              style={{ color: 'var(--fg-muted)' }}
            >
              <span>Quick start:</span>
              <KbdKey>⌘</KbdKey>
              <KbdKey>⇧</KbdKey>
              <KbdKey>R</KbdKey>
              <span>from anywhere</span>
            </p>
          </div>
          <AboutSteps />
        </div>
      ) : (
        <>
          {mode === 'home' && (
            <div className="mb-10">
              <div className="mb-1.5 flex items-end justify-between gap-6">
                <h1 className="home-hello">
                  {greeting}
                  <span className="faint">.</span>
                </h1>
                <div
                  className="pb-2 text-[13px] tabular-nums"
                  style={{ color: 'var(--fg-2)' }}
                >
                  {dateStr}
                </div>
              </div>
              <p
                className="max-w-[52ch] text-sm leading-[1.55]"
                style={{ color: 'var(--fg-2)' }}
              >
                {summaryLine(upcoming.length)}
              </p>
            </div>
          )}

          {upcoming.length > 0 && mode === 'home' && (
            <section className="mb-10">
              <SectionHead
                title="Upcoming"
                count={upcoming.length}
                action={
                  <button
                    type="button"
                    className="inline-flex items-center rounded p-0.5 transition-colors hover:bg-[color:var(--surface-hover)] disabled:opacity-50"
                    title="Check for new calendar events"
                    onClick={() => calendar.refetch()}
                    disabled={calendar.isFetching}
                    style={{ color: 'var(--fg-2)' }}
                  >
                    <RefreshCw className={`size-3 ${calendar.isFetching ? 'animate-spin' : ''}`} />
                  </button>
                }
              />
              <div className="flex flex-col gap-2">
                {upcoming.map((event) => (
                  <UpcomingCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionHead
              title={mode === 'meetings' ? 'All notes' : 'Previous'}
              count={mode === 'meetings' ? filtered.length : previous.length}
              action={
                mode === 'meetings' ? (
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 size-[12px]"
                      style={{ color: 'var(--fg-muted)' }}
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search notes"
                      aria-label="Search notes"
                      className="h-[26px] w-[180px] rounded-md border-0 pl-7 pr-7 text-[12.5px] outline-none transition-colors focus:shadow-[inset_0_0_0_1px_hsl(var(--border))]"
                      style={{
                        background: 'rgba(27,27,25,0.04)',
                        color: 'var(--fg-1)',
                        fontFamily: 'var(--font-sans)',
                      }}
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch('');
                          searchInputRef.current?.focus();
                        }}
                        aria-label="Clear search"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex size-4 items-center justify-center rounded transition-colors hover:bg-[color:var(--surface-hover)]"
                        style={{ color: 'var(--fg-muted)' }}
                      >
                        <X className="size-[11px]" />
                      </button>
                    )}
                  </div>
                ) : undefined
              }
            />
            {groups.length === 0 && mode === 'meetings' && search.trim() ? (
              <div
                className="px-6 py-12 text-center text-[13px]"
                style={{ color: 'var(--fg-2)' }}
              >
                No meetings match &ldquo;{search.trim()}&rdquo;.
              </div>
            ) : (
              groups.map((g) => (
                <div key={g.label}>
                  <div
                    className="pb-2 pt-4 text-[11.5px] font-medium tracking-[0.02em]"
                    style={{ color: 'var(--fg-2)' }}
                  >
                    {g.label}
                  </div>
                  <div>
                    {g.items.map((m) => (
                      <PreviousRow
                        key={m.session_info.summary_file}
                        meeting={m}
                        folderName={firstFolderName(m, folderName)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>

          {mode === 'home' && <FeatureCarousel />}

          {mode === 'home' && <ContactForm />}

          {mode === 'home' && <ProjectInfo />}

          {mode === 'home' && <ContactInfo />}
        </>
      )}
    </MeetingsShell>
  );
}

interface SectionHeadProps {
  title: string;
  count: number;
  action?: React.ReactNode;
}

function SectionHead({ title, count, action }: SectionHeadProps) {
  return (
    <div
      className="mb-3.5 flex items-baseline justify-between pb-2.5"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-baseline gap-2.5">
        <h2
          className="text-sm font-medium tracking-[-0.005em]"
          style={{ color: 'var(--fg-1)', fontFamily: 'var(--font-sans)' }}
        >
          {title}
        </h2>
        <span
          className="text-[12.5px] tabular-nums"
          style={{ color: 'var(--fg-muted)' }}
        >
          {count}
        </span>
      </div>
      {action}
    </div>
  );
}

interface Step {
  icon: React.ReactNode;
  title: string;
  body: string;
}

const ABOUT_STEPS: Step[] = [
  {
    icon: <Mic className="size-[18px]" />,
    title: 'Record',
    body: 'Capture any meeting in one click — or start from anywhere with ⌘⇧R. Mic and system audio are both captured.',
  },
  {
    icon: <FileText className="size-[18px]" />,
    title: 'Transcribe',
    body: 'Audio is transcribed locally on your Mac with Whisper. Nothing is uploaded — it never leaves the device.',
  },
  {
    icon: <Sparkles className="size-[18px]" />,
    title: 'Summarize',
    body: 'Get clean notes, summaries, and answers from an on-device model. Ask questions across all your meetings.',
  },
];

// About section shown on the empty/welcome state — explains what StenoAI does
// in three on-device steps so first-time users understand the flow.
function AboutSteps() {
  return (
    <section className="mt-12 w-full max-w-[640px] text-left">
      <h2
        className="mb-5 text-center text-sm font-medium tracking-[-0.005em]"
        style={{ color: 'var(--fg-1)', fontFamily: 'var(--font-sans)' }}
      >
        How StenoAI works
      </h2>
      <ol className="flex flex-col gap-3">
        {ABOUT_STEPS.map((step, i) => (
          <li
            key={step.title}
            className="flex items-start gap-4 rounded-lg p-4"
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-md"
              style={{ background: 'var(--surface-hover)', color: 'var(--fg-1)' }}
            >
              {step.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-[12px] tabular-nums font-medium"
                  style={{ color: 'var(--fg-muted)' }}
                >
                  {i + 1}
                </span>
                <h3
                  className="text-sm font-medium"
                  style={{ color: 'var(--fg-1)', fontFamily: 'var(--font-sans)' }}
                >
                  {step.title}
                </h3>
              </div>
              <p
                className="mt-1 text-[13px] leading-[1.55]"
                style={{ color: 'var(--fg-2)' }}
              >
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

interface Contact {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
}

const CONTACTS: Contact[] = [
  {
    icon: <Mail className="size-[16px]" />,
    label: 'Email',
    value: 'support@stenoai.app',
    href: 'mailto:support@stenoai.app',
  },
  {
    icon: <Phone className="size-[16px]" />,
    label: 'Phone',
    value: '+1 (555) 010-2024',
    href: 'tel:+15550102024',
  },
  {
    icon: <Globe className="size-[16px]" />,
    label: 'Website',
    value: 'stenoai.app',
    href: 'https://stenoai.app',
  },
];

interface Slide {
  icon: React.ReactNode;
  title: string;
  body: string;
}

const CAROUSEL_SLIDES: Slide[] = [
  {
    icon: <Mic className="size-[18px]" />,
    title: 'One-click capture',
    body: 'Start recording any meeting instantly — or from anywhere with ⌘⇧R. Mic and system audio are captured together.',
  },
  {
    icon: <FileText className="size-[18px]" />,
    title: 'On-device transcription',
    body: 'Whisper transcribes your audio locally. Nothing is uploaded — your conversations never leave your Mac.',
  },
  {
    icon: <Sparkles className="size-[18px]" />,
    title: 'Instant summaries',
    body: 'A local model turns transcripts into clean notes and answers. Ask questions across every meeting you record.',
  },
  {
    icon: <Search className="size-[18px]" />,
    title: 'Search everything',
    body: 'Find any moment across all your notes in seconds with fast, full-text search over your meeting history.',
  },
];

// Feature carousel shown on the home view — a horizontally scrollable strip of
// highlight cards. Uses scroll-snap and dot indicators driven purely by local
// state, following the paper/ink styling of the page.
function FeatureCarousel() {
  const [active, setActive] = React.useState(0);
  const trackRef = React.useRef<HTMLDivElement>(null);

  const scrollTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[i] as HTMLElement | undefined;
    if (card) track.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
    setActive(i);
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const i = Math.round(track.scrollLeft / track.clientWidth);
    setActive(Math.max(0, Math.min(CAROUSEL_SLIDES.length - 1, i)));
  };

  return (
    <section className="mt-10">
      <SectionHead title="Highlights" count={CAROUSEL_SLIDES.length} />
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {CAROUSEL_SLIDES.map((slide) => (
          <div
            key={slide.title}
            className="flex min-w-full shrink-0 snap-start items-start gap-4 rounded-lg p-5"
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-md"
              style={{ background: 'var(--surface-hover)', color: 'var(--fg-1)' }}
            >
              {slide.icon}
            </div>
            <div className="min-w-0">
              <h3
                className="text-sm font-medium"
                style={{ color: 'var(--fg-1)', fontFamily: 'var(--font-sans)' }}
              >
                {slide.title}
              </h3>
              <p
                className="mt-1 text-[13px] leading-[1.55]"
                style={{ color: 'var(--fg-2)' }}
              >
                {slide.body}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {CAROUSEL_SLIDES.map((slide, i) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === active}
            className="size-1.5 rounded-full transition-colors"
            style={{
              background: i === active ? 'var(--fg-1)' : 'var(--border-subtle)',
            }}
          />
        ))}
      </div>
    </section>
  );
}

// Contact-form section shown on the home view — name, email, and message
// fields wired to local state, following the paper/ink styling of the page.
function ContactForm() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [sent, setSent] = React.useState(false);

  const fieldStyle: React.CSSProperties = {
    background: 'rgba(27,27,25,0.04)',
    color: 'var(--fg-1)',
    fontFamily: 'var(--font-sans)',
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <section className="mt-10">
      <SectionHead title="Get in touch" count={0} />
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 rounded-lg p-5"
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium tracking-[0.02em]" style={{ color: 'var(--fg-muted)' }}>
            Name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="h-9 rounded-md border-0 px-3 text-[13.5px] outline-none transition-shadow focus:shadow-[inset_0_0_0_1px_hsl(var(--border))]"
            style={fieldStyle}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium tracking-[0.02em]" style={{ color: 'var(--fg-muted)' }}>
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-9 rounded-md border-0 px-3 text-[13.5px] outline-none transition-shadow focus:shadow-[inset_0_0_0_1px_hsl(var(--border))]"
            style={fieldStyle}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium tracking-[0.02em]" style={{ color: 'var(--fg-muted)' }}>
            Message
          </span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="How can we help?"
            rows={4}
            className="resize-y rounded-md border-0 px-3 py-2 text-[13.5px] leading-[1.55] outline-none transition-shadow focus:shadow-[inset_0_0_0_1px_hsl(var(--border))]"
            style={fieldStyle}
          />
        </label>
        <div className="flex items-center gap-3">
          <Button type="submit" className="gap-2">
            <Mail className="size-4" />
            Send message
          </Button>
          {sent && (
            <span className="text-[13px]" style={{ color: 'var(--fg-2)' }}>
              Thanks — we&rsquo;ll be in touch.
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

// About-the-project section shown on the home view — a short paragraph
// describing what StenoAI is, following the paper/ink styling of the page.
function ProjectInfo() {
  return (
    <section className="mt-10">
      <SectionHead title="About the project" count={0} />
      <div
        className="rounded-lg p-5"
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <p
          className="text-[13.5px] leading-[1.65]"
          style={{ color: 'var(--fg-2)' }}
        >
          StenoAI is a privacy-first meeting companion that records, transcribes,
          and summarizes your conversations entirely on your own Mac. Audio is
          captured locally, transcribed with Whisper, and turned into clean notes
          and answers by an on-device model — nothing is ever uploaded to the
          cloud. The result is a fast, fully offline way to capture beautiful
          notes from any meeting while keeping your data in your hands.
        </p>
      </div>
    </section>
  );
}

// Contact section shown on the home view — a quiet card listing ways to reach
// support, following the same paper/ink styling as the rest of the home page.
function ContactInfo() {
  return (
    <section className="mt-10">
      <SectionHead title="Contact" count={CONTACTS.length} />
      <div className="flex flex-col gap-2">
        {CONTACTS.map((c) => (
          <a
            key={c.label}
            href={c.href}
            className="flex items-center gap-4 rounded-lg p-4 transition-colors hover:bg-[color:var(--surface-hover)]"
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-md"
              style={{ background: 'var(--surface-hover)', color: 'var(--fg-1)' }}
            >
              {c.icon}
            </div>
            <div className="min-w-0">
              <div
                className="text-[12px] font-medium tracking-[0.02em]"
                style={{ color: 'var(--fg-muted)' }}
              >
                {c.label}
              </div>
              <div
                className="mt-0.5 text-sm"
                style={{ color: 'var(--fg-1)', fontFamily: 'var(--font-sans)' }}
              >
                {c.value}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function summaryLine(_upcomingCount: number): string {
  return `Start recording from the top-right, or from anywhere with ${shortcut('⌘⇧R', 'Ctrl+Shift+R')}.`;
}

function firstFolderName(
  m: Meeting,
  folderName: Map<string, string>,
): string | undefined {
  const id = m.folders?.[0] ?? m.session_info.folders?.[0];
  if (!id) return undefined;
  return folderName.get(id);
}

interface Group {
  label: string;
  items: Meeting[];
}

function groupPrevious(meetings: Meeting[]): Group[] {
  const groups: Record<string, Meeting[]> = {};
  const order: string[] = [];
  const now = new Date();
  const sorted = [...meetings].sort((a, b) => {
    const ta = new Date(a.session_info.processed_at ?? a.session_info.updated_at ?? 0).getTime();
    const tb = new Date(b.session_info.processed_at ?? b.session_info.updated_at ?? 0).getTime();
    return tb - ta;
  });
  for (const m of sorted) {
    const raw = m.session_info.processed_at ?? m.session_info.updated_at;
    const label = raw ? groupLabel(new Date(raw), now) : 'Earlier';
    if (!groups[label]) {
      groups[label] = [];
      order.push(label);
    }
    groups[label].push(m);
  }
  return order.map((label) => ({ label, items: groups[label] }));
}

function groupLabel(d: Date, now: Date): string {
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, now)) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return 'Yesterday';
  const age = now.getTime() - d.getTime();
  if (age < 7 * 24 * 60 * 60 * 1000) {
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  }
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}
