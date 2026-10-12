// Preveri vsebino po pravilih PRD. Napaka ustavi build.
import { validateContent } from '../src/lib/content.js';

const errors = validateContent();
if (errors.length) {
  console.error(`\n✗ Vsebina ni objavljiva (${errors.length} napak):\n`);
  for (const e of errors) console.error('  - ' + e);
  console.error('');
  process.exit(1);
}
console.log('✓ Vsebina je skladna s pravili PRD.');
