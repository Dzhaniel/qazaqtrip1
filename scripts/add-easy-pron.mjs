// scripts/add-easy-pron.mjs — «Жеңіл оқылу» қосымшасын барлық 59 сөзге қосады (бір реттік)
import { readFileSync, writeFileSync } from 'node:fs';

// Әріп сәйкестігі (ағылшын тіліндегі үшін): ә=e(eh) ғ=gh қ=k ң=ng ө=o ұ=oo ү=ee ы=i(sit) і=i(see) ж=j ш=sh ч=ch х=h
// Маңызы — үлкен әріппен (әдетте соңғы буын).
const EASY = {
  p1: 'sa-le-met-SIZ be',
  p2: 'kosh kel-DEEN-iz',
  p3: 'RAK-met',
  p4: 'SAW bo-LIN-yz',
  p5: 'EE-eh',
  p6: 'JOHK RAK-met',
  p7: 'ke-SHEE-ri-NEE-yz',
  p8: 'ko-NAK-oo-ee-deh OR-IN bar MA',
  p9: 'TEER-ke-leh a-LA-meen BA',
  p10: 'TANG-ghy AS kash-an bo-LA-dee',
  p11: 'BOHL-meh kash-NA too-RA-dee',
  p12: 'WAY-fye BAR MA',
  p13: 'BOHL-meh TA-zah MA',
  p14: 'AV-to-bus kash-an ke-LEH-dee',
  p15: 'TAK-see shah-KOO-ru-gha BO-lah MA',
  p16: 'KYAH-dah BA-ra-dee',
  p17: 'BI-let SA-teep a-LAH a-LA-meen BA',
  p18: 'KYAH-dah TOO-soo KE-rek',
  p19: 'SHYE be-REE-nee-yz-SHEE',
  p20: 'SOO be-REE-nee-yz-SHEE',
  p21: 'ET-siz TAH-mak BAR MA',
  p22: 'SHOT-tee be-REE-nee-yz-SHEE',
  p23: 'MEN eesh-kee-LEEK eesh-pay-MEEN',
  p24: 'BOOL ne',
  p25: 'MOO-ra-jay KYAH-dah',
  p26: 'BI-let kash-NA too-RA-dee',
  p27: 'soo-RET-kee TOO-sheep BOL-mye MA',
  p28: 'MOO-ra-jay kash-an ja-by-LA-dee',
  p29: 'DAW-ys-tek GHED bar MA',
  p30: 'OH-teh eh-DEE-mee',
  p31: 'BOOL kash-NA too-RA-dee',
  p32: 'KIM-bat',
  p33: 'AR-zan-dye a-LAS-yz BA',
  p34: 'BOO-ny SA-teep a-LA-meen',
  p35: 'KAH-ee-ru-gha BO-lah MA',
  p36: 'koh-MEK-te-SHEE-nee-yz-SHEE',
  p37: 'JE-del jar-DEM shah-KIR-ee-nee-yz',
  p38: 'po-LIT-see-ya KYAH-dah',
  p39: 'DA-ree-ka-na KYAH-dah',
  p40: 'ME-nee KWOO-da-tym jo-GA-la-dee',
  p41: 'BEE-er',
  p42: 'EH-kee',
  p43: 'OOSH',
  p44: 'TOHRT',
  p45: 'BESS',
  p46: 'AL-tee',
  p47: 'JET-tee',
  p48: 'SEH-geez',
  p49: 'TOH-gyz',
  p50: 'ON',
  p101: 'ONG-gha',
  p102: 'SOL-gha',
  p103: 'TOO-rah',
  p104: 'JAK-yeen',
  p105: 'AL-iss',
  p106: 'ZHEE-r-ma',
  p107: 'EH-loo',
  p108: 'JOOS',
  p109: 'MEEN',
};

const p = 'src/data/cities/kyzylorda.json';
const data = JSON.parse(readFileSync(p, 'utf8'));
let missing = [];
for (const ph of data.kazakh_phrases) {
  if (EASY[ph.id]) {
    ph.easy_pron = EASY[ph.id];
  } else {
    missing.push(ph.id);
  }
  ph.easy_pron_reviewed = false;
}
// easy_pron-ды kk-дан кейін орналастыру үшін қайта құрамыз (кілт тәртібі)
data.kazakh_phrases = data.kazakh_phrases.map((ph) => ({
  id: ph.id,
  kk: ph.kk,
  translit: ph.translit,
  easy_pron: ph.easy_pron,
  easy_pron_reviewed: false,
  en: ph.en,
  ru: ph.ru,
  topic: ph.topic,
  ...(ph.image ? { image: ph.image } : {}),
}));
writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(missing.length ? `JOQ: ${missing.join(', ')}` : 'OK: 59 сөзге de easy_pron қосылды');
