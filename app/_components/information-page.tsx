import type { ReactNode } from "react";

type InformationSection = {
  title: string;
  body: ReactNode;
};

export function InformationPage({
  eyebrow,
  title,
  introduction,
  sections,
}: {
  eyebrow: string;
  title: string;
  introduction: string;
  sections: InformationSection[];
}) {
  return <main className="information-page">
    <header className="information-header">
      <a className="information-brand" href="/"><span>A</span><b>AMORA<small>INVITATIONS</small></b></a>
      <a className="information-home" href="/">← Back to home</a>
    </header>
    <section className="information-hero"><p>{eyebrow}</p><h1>{title}</h1><span>✦</span><p className="information-intro">{introduction}</p></section>
    <section className="information-content">{sections.map((section) => <article key={section.title}><h2>{section.title}</h2><div>{section.body}</div></article>)}</section>
    <footer className="information-footer"><p>AMORA INVITATIONS</p><nav aria-label="Information links"><a href="/contact">Contact</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/refund-cancellation">Refunds & cancellations</a></nav><span>© 2026 Amora Invitations</span></footer>
  </main>;
}

export function Placeholder({ children }: { children: ReactNode }) {
  return <aside className="information-placeholder"><strong>Owner confirmation needed</strong><span>{children}</span></aside>;
}
