// CLAUDE GENERATED STUB PAGE
const PARAGRAPH =
  'Readability test paragraph. The quick brown fox jumps over the lazy dog, then reads a long sentence about nothing in particular so the line length, leading and contrast can be judged against the navigation surface. Scroll behind the nav and check that the blur keeps the labels legible.';

const SECTIONS = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  title: `Section ${i + 1}`,
}));

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl px-6 pb-40 pt-28">
      <h1 className="text-4xl font-semibold tracking-tight">Nav readability test</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">
        Muted text. Check this against both themes. Hotkeys: <code>[</code> for IN, <code>]</code> for FORM.
      </p>

      {/* Hotkey guardrail test: [ and ] must type normally here and must not toggle the nav. */}
      <div className="mt-8 space-y-3">
        <input
          type="text"
          placeholder="Type [ and ] here, nav must not react"
          className="w-full rounded-lg border border-neutral-900/15 bg-transparent px-3 py-2 dark:border-white/15"
        />
        <textarea
          rows={2}
          placeholder="Same for textarea"
          className="w-full rounded-lg border border-neutral-900/15 bg-transparent px-3 py-2 dark:border-white/15"
        />
        <div
          contentEditable
          suppressContentEditableWarning
          className="rounded-lg border border-neutral-900/15 px-3 py-2 dark:border-white/15"
        >
          contenteditable, same test
        </div>
      </div>

      {/* Busy backgrounds so backdrop-blur and surface contrast are actually exercised. */}
      <div className="mt-10 h-24 rounded-2xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-400" />
      <div
        className="mt-4 h-24 rounded-2xl"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #000 0 12px, #fff 12px 24px)',
        }}
      />

      {SECTIONS.map((s) => (
        <section key={s.id} className="mt-12">
          <h2 className="text-2xl font-semibold">{s.title}</h2>
          <p className="mt-3 leading-7">{PARAGRAPH}</p>
          <p className="mt-3 leading-7 text-neutral-600 dark:text-neutral-400">{PARAGRAPH}</p>
          <a href="#" className="mt-3 inline-block text-indigo-600 underline dark:text-indigo-400">
            Sample link
          </a>
        </section>
      ))}

      {/* Bottom content: verify the compact FAB doesn't hide anything unreachable. */}
      <div className="mt-16 rounded-2xl bg-neutral-200 p-6 dark:bg-neutral-800">
        End of page. In compact mode, the FAB sits over the bottom-right corner of this box.
      </div>
    </div>
  );
}
