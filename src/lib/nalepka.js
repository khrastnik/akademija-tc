import QRCode from 'qrcode';

/** Podatki serviserja na nalepki – zamenjaj s svojimi, ko boš nalepke tiskal. */
export const SERVISER = {
  ime: 'Tvoje ime · Servis TČ',
  tel: '+386 XX XXX XXX',
};

/** Povezava, na katero vodi QR koda: prijava napake za napravo s to kodo (brez osebnih podatkov). */
export function prijavaUrl(koda) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return new URL(`${base}/servis/prijava/?n=${encodeURIComponent(koda)}`, import.meta.env.SITE).href;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/**
 * Nalepka 80 × 50 mm za tisk (SVG). Datumi so prazne črte – vpišeš jih ob servisu z alkoholnim flomastrom,
 * zato lahko pole z različnimi kodami natisneš vnaprej.
 */
export async function nalepkaSvg(koda, { ime = SERVISER.ime, tel = SERVISER.tel } = {}) {
  const qr = await QRCode.toString(prijavaUrl(koda), { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#221d17', light: '#ffffff' } });
  const inner = qr.replace(/^[\s\S]*?<svg[^>]*viewBox="([^"]+)"[^>]*>/, '<svg x="548" y="116" width="216" height="216" viewBox="$1">');
  const line = (y, label) =>
    `<text x="36" y="${y}" font-size="21" fill="#5b5246">${label}</text><line x1="250" y1="${y + 4}" x2="500" y2="${y + 4}" stroke="#8a7f70" stroke-width="2"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="80mm" height="50mm" viewBox="0 0 800 500" font-family="Arial, Helvetica, sans-serif" role="img" aria-label="Servisna nalepka, koda naprave ${esc(koda)}">
<rect x="2" y="2" width="796" height="496" rx="26" fill="#ffffff" stroke="#d9cfc0" stroke-width="4"/>
<path d="M2 28a26 26 0 0 1 26-26h744a26 26 0 0 1 26 26v62H2z" fill="#a4502a"/>
<text x="36" y="58" font-size="27" font-weight="700" fill="#ffffff" letter-spacing="2">SERVIS TOPLOTNE ČRPALKE</text>
<text x="36" y="146" font-size="30" font-weight="700" fill="#221d17">${esc(ime)}</text>
<text x="36" y="196" font-size="38" font-weight="700" fill="#221d17">${esc(tel)}</text>
<text x="36" y="238" font-size="21" fill="#5b5246">Napaka? Skeniraj kodo in jo prijavi.</text>
${line(302, 'Zadnji servis')}
${line(354, 'Naslednji servis do')}
${line(406, 'Pregled tesnosti do')}
<text x="36" y="462" font-size="16" fill="#8a7f70">Ne odstranjuj. Tablica naprave mora ostati vidna.</text>
<rect x="536" y="104" width="240" height="240" rx="10" fill="#ffffff"/>
${inner}
<text x="656" y="392" font-size="36" font-weight="700" fill="#221d17" text-anchor="middle" font-family="Consolas, 'Courier New', monospace" letter-spacing="6">${esc(koda)}</text>
<text x="656" y="422" font-size="18" fill="#5b5246" text-anchor="middle">koda naprave</text>
</svg>`;
}
