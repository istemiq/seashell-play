import '../load-env.js';
import { prepareRussianTtsText } from '../ruTtsStress.js';

const samples = [
  'На двери висит замок.',
  'Констатация факта',
  'Они ехали в Москву.',
  'Замок на двери.',
];

async function main() {
  for (const s of samples) {
    const m = await prepareRussianTtsText(s, null);
    console.log(JSON.stringify({ in: s, out: m }));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
