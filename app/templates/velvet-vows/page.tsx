"use client";

import { useEffect, useState } from "react";

const defaults = { bride: "Rhea", groom: "Arjun", date: "2027-01-16", time: "17:30", venue: "The Oberoi Udaivilas", address: "Haridasji Ki Magri, Udaipur, Rajasthan 313001", maps: "https://maps.google.com/?q=The+Oberoi+Udaivilas+Udaipur", welcome: "together with their families", story: "What began with an unexpected conversation over coffee became a thousand shared sunsets, a few grand adventures, and a love that feels like home.", rsvp: "rheaandarjun@example.com" };
export type VelvetVowsDetails = typeof defaults;
export type VelvetVowsPhotos = { cover: string; bride: string; groom: string; gallery: string[] };
type SavedInvitation = { details: VelvetVowsDetails; photos: VelvetVowsPhotos };
const emptyPhotos: VelvetVowsPhotos = { cover: "", bride: "", groom: "", gallery: [] };
const formatDate = (date: string) => new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`));

function Countdown({ targetDate }: { targetDate: string }) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => {
      const difference = Math.max(0, new Date(`${targetDate}T17:30:00+05:30`).getTime() - Date.now());
      setTime({ days: Math.floor(difference / 86400000), hours: Math.floor((difference / 3600000) % 24), minutes: Math.floor((difference / 60000) % 60), seconds: Math.floor((difference / 1000) % 60) });
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [targetDate]);

  return <div className="vv-countdown" aria-label="Countdown to the wedding">{Object.entries(time).map(([label, value]) => <div key={label}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>)}</div>;
}

function Ornament() { return <span className="vv-ornament" aria-hidden="true">✦</span>; }

export function VelvetVowsInvitation({ invitation }: { invitation?: SavedInvitation }) {
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [details, setDetails] = useState<VelvetVowsDetails>(invitation?.details ?? defaults);
  const [photos, setPhotos] = useState<VelvetVowsPhotos>(invitation?.photos ?? emptyPhotos);
  useEffect(() => { if (invitation) return; const query = new URLSearchParams(window.location.search); setDetails((current) => ({ ...current, ...Object.fromEntries(Object.keys(defaults).map((key) => [key, query.get(key) || current[key as keyof VelvetVowsDetails]])) })); try { const savedPhotos = sessionStorage.getItem("velvet-vows-preview-photos"); if (savedPhotos) setPhotos({ ...emptyPhotos, ...JSON.parse(savedPhotos) }); } catch { setPhotos(emptyPhotos); } }, [invitation]);
  const shareMessage = encodeURIComponent(`${details.bride} & ${details.groom} are getting married! Join us on ${formatDate(details.date)}.`);

  return <main className="velvet-page">
    <button className={`vv-music ${musicPlaying ? "is-playing" : ""}`} onClick={() => setMusicPlaying(!musicPlaying)} aria-pressed={musicPlaying}><span>{musicPlaying ? "Ⅱ" : "♪"}</span>{musicPlaying ? "Music on" : "Play music"}</button>
    <a className="vv-home" href="/" aria-label="Back to Amora homepage">A</a>
    <a className="vv-customize" href="/templates/velvet-vows/customize">Customize This Invitation <span>→</span></a>

    <section className="vv-hero">
      <div className={`vv-hero-frame ${photos.cover ? "has-cover" : ""}`}>{photos.cover && <img className="vv-hero-cover" src={photos.cover} alt={`${details.bride} and ${details.groom}`} />}<div className="vv-corner top-left">❧</div><div className="vv-corner top-right">❧</div><p className="vv-script">{details.welcome}</p><p className="vv-kicker">We&apos;re getting married</p><h1>{details.bride} <em>&</em> {details.groom}</h1><Ornament /><p className="vv-date">{formatDate(details.date)} · {details.time}</p><p className="vv-place">{details.venue}</p><a href="#celebrate" className="vv-scroll">Scroll to celebrate <span>↓</span></a><div className="vv-corner bottom-left">❀</div><div className="vv-corner bottom-right">❀</div></div>
    </section>

    <section className="vv-section vv-count-section" id="celebrate"><p className="vv-overline">A little while longer</p><h2>Counting down to<br /><em>our forever</em></h2><Countdown targetDate={details.date} /></section>

    <section className="vv-section vv-story"><div className="vv-couple-photo"><div className="vv-photo-placeholder">{photos.cover ? <img src={photos.cover} alt={`${details.bride} and ${details.groom}`} /> : <><span>{details.bride[0]}</span><span>{details.groom[0]}</span></>}</div><p>the beginning<br />of always</p></div><div className="vv-story-copy"><p className="vv-overline">Our story</p><h2>A little bit of<br /><em>serendipity</em></h2><p>{details.story}</p><p>We cannot wait to celebrate the next chapter with the people who have filled ours with so much joy.</p>{(photos.bride || photos.groom) && <div className="vv-portrait-pair">{photos.bride && <img src={photos.bride} alt={details.bride} />}{photos.groom && <img src={photos.groom} alt={details.groom} />}</div>}<div className="vv-signature">{details.bride} <span>&</span> {details.groom}</div></div></section>

    <section className="vv-events"><div className="vv-events-inner"><p className="vv-overline">The celebrations</p><h2>Come celebrate<br /><em>with us</em></h2><div className="vv-event-grid"><article><span>01</span><h3>Mehendi soirée</h3><p>Friday, 15 January · 5:00 PM</p><small>Marigold courtyard, The Oberoi</small></article><article><span>02</span><h3>Wedding ceremony</h3><p>Saturday, 16 January · 5:30 PM</p><small>The lake pavilion, The Oberoi</small></article><article><span>03</span><h3>Dinner & dancing</h3><p>Saturday, 16 January · 8:30 PM</p><small>The grand ballroom, The Oberoi</small></article></div></div></section>

    <section className="vv-section vv-venue"><div className="vv-venue-copy"><p className="vv-overline">Where to find us</p><h2>By the shores of<br /><em>Lake Pichola</em></h2><p>We will exchange our vows as the sun sets over the lake, surrounded by old-world arches and the ones we love most.</p><p className="vv-address">{details.venue}<br />{details.address}</p><a className="vv-button" href={details.maps} target="_blank" rel="noreferrer">Open in Google Maps <span>↗</span></a></div><div className="vv-map"><div className="vv-map-line one" /><div className="vv-map-line two" /><div className="vv-map-line three" /><div className="vv-pin">♥</div><div className="vv-map-label">{details.venue}</div></div></section>

    <section className="vv-gallery"><div className="vv-gallery-title"><p className="vv-overline">A few favourite moments</p><h2>Our little<br /><em>love archive</em></h2></div><div className="vv-gallery-grid">{photos.gallery.length > 0 ? photos.gallery.map((photo, index) => <div className="vv-gallery-photo" key={photo}><img src={photo} alt={`A moment with ${details.bride} and ${details.groom} ${index + 1}`} /><span>{String(index + 1).padStart(2, "0")}</span></div>) : <><div className="vv-gallery-photo photo-one"><span>01</span></div><div className="vv-gallery-photo photo-two"><span>02</span></div><div className="vv-gallery-photo photo-three"><span>03</span></div><div className="vv-gallery-photo photo-four"><span>04</span></div></>}</div></section>

    <section className="vv-rsvp"><div className="vv-rsvp-inner"><p className="vv-overline">Will you be there?</p><h2>We hope you&apos;ll<br /><em>say yes</em></h2><p>Kindly let us know if we can save you a seat at our celebration.</p><div className="vv-rsvp-actions"><a className="vv-button vv-button-light" href={`tel:${details.rsvp}`}>RSVP now <span>→</span></a><a className="vv-share" href={`https://wa.me/?text=${shareMessage}`} target="_blank" rel="noreferrer">◌ Share on WhatsApp</a></div></div></section>

    <footer className="vv-footer"><Ornament /><p>With love and gratitude</p><h2>{details.bride} <em>&</em> {details.groom}</h2><span>{formatDate(details.date)}</span><a href="#top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Back to top ↑</a></footer>
  </main>;
}

export default VelvetVowsInvitation;
