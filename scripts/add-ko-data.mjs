// scripts/add-ko-data.mjs
//
// Қосымша (additive) скрипт: kyzylorda.json-ның барлық көрінетін мәтіндік өрістеріне
// корейше (ko) аудармаларын қосады. kk/en/ru өрістеріне ЕСЕ ШАҚПАЙДЫ.
// Қайталанбалы: қайта іске қоссаң — соңғы мәндерді жаңартқаны ғана.
//
// Ережелер (brief 2026-11-06):
//  - атаулар: корейше бірінші, қазақ оригиналы компонентте кіші әріппен (nameParts());
//  - қалалардың бекітілген корей атаулары: Қызылорда=크질오르да, Астана=아스타나,
//    Алматы=ал마티, Түркістан=투르키斯坦, Шымкент=심켄트, Ақтау=악타우, Сырдария=시르다리야;
//  - әкімшілік сөздер: саябақ=공원, ескерткіш=기념비, мешіт=모스크, мұражай=박물관,
//    театр=극장, базар=시장, қонақүй=호텔/숙소, көше=거리, орталық=중심;
//  - сипаттама — көз мәтіннен ғана, жаңа факті/сан қосылмайды;
//  - барлық жаңа ko мәлімет ko_reviewed: false (entity деңгейінде).
//
// Іске қосу: node scripts/add-ko-data.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'src/data/cities/kyzylorda.json');
const d = JSON.parse(readFileSync(file, 'utf8'));

let changed = 0;
const set = (obj, key, val) => {
  if (obj[key] !== val) {
    obj[key] = val;
    changed++;
  }
};

// L10n объект ({kk,en,ru}) ішіне ko қосу
const l10n = (obj, ko) => {
  if (obj && typeof obj === 'object' && 'kk' in obj) set(obj, 'ko', ko);
};

/* ============ META ============ */
l10n(d.meta.disclaimer, '가격과 영업시간은 변경될 수 있습니다. 방문 전에 공식 출처에서 확인하세요.');
set(d.meta, 'ko_reviewed', false);

/* ============ CITY ============ */
const city = d.city;
l10n(city.name, '크질오르다');
l10n(city.region, '크질오르다 주');
l10n(
  city.description,
  '크질오르다는 시르다리야 강 옆에 자리한 도시입니다. 1820년 코칸트 칸국의 요새로 시작되어, 이후 카자흐 소비에트 자치공화국의 첫 도성이 되었습니다. 이곳은 코르키트 아타와 코비즈(거문고) 전통의 고향으로 여겨집니다.',
);
set(city, 'ko_reviewed', false);

const gt = Object.fromEntries(city.getting_there.map((g) => [g.type, g]));
// air
l10n(gt.air.name, '코르키트 아타 공항 (KZO)');
set(gt.air, 'distance_to_center_km_ko', '16-23km (출처마다 다름)');
set(gt.air, 'hours_ko', '08:00-20:00 (출처 1곳)');
l10n(gt.air.note, '알마티에서 직항편이 있습니다. 도착 라운대에서 택시를 호출할 수 있습니다.');
// train
l10n(gt.train.name, '크질오르다 역');
l10n(
  gt.train.note,
  '중심부에 가까워, 대부분의 호텔로 도보 또는 택시로 5~10분이면 닿습니다. 역 건물은 1905년에 지어졌습니다.',
);
// bus
l10n(gt.bus.name, '크질오르다 버스터미널');
set(gt.bus, 'address_ko', '레비이 베레그 지구 188 (아블라이 칸 거리 끝)');
set(gt.bus, 'hours_ko', '08:00-17:00 (Wikivoyage)');

/* ============ STANDARD TICKET NOTES (brief: std phrases) ============ */
const T_PRICE_UNKNOWN = '가격 미기재'; // «Баға нақтыланбаған»
const T_FREE_ENTRY = '입장 무료'; // «Кіру тегін»
const T_NO_FEE_INFO = '입장료 정보 없음'; // «Кіру ақысы туралы дерек жоқ»
const T_OPEN_MONUMENT = '야외 기념비'; // «Ашық монумент»
const T_OPEN_PARK = '야외 공원'; // «Ашық саябақ»
const T_OPEN_AREA = '야외 구역'; // «Ашық аймақ»
const T_PARK_FREE_NOTE = '입장료 정보는 없으며, 야외 공간으로 간주됩니다'; // «Саябаққа кіру ақысы…»

/* ============ ATTRACTIONS ============ */
const A = Object.fromEntries(d.attractions.map((a) => [a.id, a]));

{
  const a = A['korkyt-ata-memorial'];
  l10n(a.name, '코르키트 아타 기념 시설');
  l10n(
    a.short,
    '코비즈(카자흐 거문고)의 창시자이자 시인·연주자인 코르키트 아타를 기리는 기념 시설입니다. 시르다리야 강 유역 대초원의 한가운데에 자리하며, 시설 내에는 박물관이 운영됩니다.',
  );
  set(a, 'address_ko', '카르막시 군, 조사리(Жосалы) 마을에서 약 18km');
  l10n(a.travel_note, '크질오르다에서 차로 2시간 이상 (R-69 또는 E38 도로). 바이코누르에서 약 66km (약 1시간).');
  set(a.ticket, 'note_ko', T_PRICE_UNKNOWN);
  l10n(a.notes, '건설은 1980년에 시작되었고, 박물관은 2000년에 개관했습니다. 소장품은 약 700점입니다.');
  set(a, 'ko_reviewed', false);
}
{
  const a = A['baikonur'];
  l10n(a.name, '바이코누르 단지 (시, 우주 기지, 박물관)');
  l10n(
    a.short,
    '세계에서 가장 오래된 우주 기지입니다. 도시와 우주 기지가 통제 구역(제한 구역)이므로, 방문 전에 허가(입장 허가증)를 반드시 발급받아야 합니다.',
  );
  set(a, 'address_ko', '바이코누르 시');
  l10n(
    a.permit,
    '2026년 6월 정부 발표에 따르면 외국인 관광객의 허가 처리 기간은 최대 10일로 단축되었습니다(이전에는 약 1.5~2개월). 도시용과 우주 기지용, 두 개의 별도의 허가증이 필요합니다. 우주 기지는 조직된 단체 방문만 가능합니다. 신청서는 주최 측(바이코누르에 등록된 주민 또는 기관)이 제출합니다.',
  );
  set(a.permit, 'recommendation_ko', '여행사를 통해 발급하세요. 최소 10일 전, 예정된 발사일에는 그보다 더 일찍 시작해야 합니다.');
  set(
    a.ticket,
    'note_ko',
    '박물관 관람(오디오 가이드) 400루블, 우주 기지 단체 투어(최대 25명, 4시간) 7000루블, 허가증은 주최 측이 발급합니다. 2026년 9월 기준 자료이며, KZT로 환산되지 않았습니다.',
  );
  l10n(a.warnings, '허가 없이는 방문할 수 없습니다. 웹사이트와 챗봇은 바이코누르를 일반 일정에 넣기 전에 먼저 허가(입장 허가증)에 대해 안내해야 합니다.');
  set(a, 'ko_reviewed', false);
}
{
  const a = A['korkyt-ata-park'];
  l10n(a.name, '코르키트 아타 공원 및 기념비');
  l10n(
    a.short,
    '시 중심부의 기념비에서 코르키트 아타는 낙타를 타고 손에 코비즈를 든 모습으로 묘사되어 있습니다. 구(舊)시장 맞은편에 위치합니다.',
  );
  set(a, 'address_ko', '크질오르다 중심부, 구(舊)시장 맞은편');
  set(a.ticket, 'note_ko', T_PARK_FREE_NOTE);
  set(a, 'ko_reviewed', false);
}
{
  const a = A['syr-ana-monument'];
  l10n(a.name, '«시르-아나» 기념비');
  l10n(
    a.short,
    '시르다리야 강변의 높이 40m 스텔라로, 전통 복장의 여성상을 모셨으며 모성적 보호와 이 지역 민족의 단결을 상징합니다.',
  );
  set(a, 'address_ko', '시르다리야 강변');
  set(a.ticket, 'note_ko', T_OPEN_MONUMENT);
  set(a, 'ko_reviewed', false);
}
{
  const a = A['first-president-park-embankment'];
  l10n(a.name, '첫 대통령 공원 및 시르다리야 강변 산책로');
  l10n(
    a.short,
    '시르다리야 강변의 울창한 산책로와 입구의 아치 복도(콜로네이드)가 있으며, 근처에 국가 상징 광장이 있습니다. 한가로운 산책에 좋습니다.',
  );
  set(a, 'address_ko', '시르다리야 강변');
  set(a.ticket, 'note_ko', T_OPEN_PARK);
  set(a, 'ko_reviewed', false);
}
{
  const a = A['central-square-drama-theatre'];
  l10n(a.name, '나르타이 베케자노프 카자흐 음악·연극 극장 및 중앙 광장');
  l10n(
    a.short,
    '중앙 광장은 2024년에 정비되었습니다. 광장에는 로자 바글라노바 기념비가 있고, 극장은 민족적 장식을 더한 후기 소련식 구성주의 건물에 있습니다.',
  );
  set(a, 'address_ko', '아이테케 비 거리 44a');
  set(a.ticket, 'note_ko', '공연료와 공연 일정은 극장의 공식 채널에서 확인됩니다.');
  set(a, 'ko_reviewed', false);
}
{
  const a = A['regional-history-museum'];
  l10n(a.name, '크질오르다 주 역사·향토 박물관');
  l10n(
    a.short,
    '1939년 옛 정교회 성당 건물에 개관했습니다. 사카(시타크) 전사의 복원 모형, 시가낙 공주의 의상과 초원이 간직한 보물들이 전시되어 있습니다.',
  );
  set(a, 'address_ko', 'M. 아우에조프 거리 2a (일부 자료에서는 20)');
  l10n(a.hours, '화~일 09:00-19:00, 휴식 13:00-15:00; 월요일 휴무; 매월 마지막 금요일은 정비(청소)의 날');
  set(a.ticket, 'note_ko', '가격은 시 공식 포털(qorda.kz) 기준이며 날짜가 표시되지 않았습니다. 방문 전에 확인하세요.');
  set(a, 'ko_reviewed', false);
}
{
  const a = A['akmeshit-museum'];
  l10n(a.name, '«압메시트» 박물관 (역 광장)');
  l10n(
    a.short,
    '1905년에 지어진 역사적인 건물에 위치합니다. 도시가 압메시트(아크 메치트)로 불리던 시기의 생활 용품, 문서와 유물들이 전시되어 있습니다.',
  );
  set(a, 'address_ko', '크질오르다 역 앞 광장');
  set(a.ticket, 'note_ko', T_PRICE_UNKNOWN);
  set(a, 'ko_reviewed', false);
}
{
  const a = A['aitbayev-art-gallery'];
  l10n(a.name, 'S. 아트바이에프 미술관');
  l10n(
    a.short,
    '코르키트 아타 공원 옆에 있으며, 아랄 지역 화가들의 작품이 전시되어 있습니다. 크질오르다는 카자흐 전문 회화의 요람이었다고 합니다.',
  );
  set(a, 'address_ko', 'Y. 토크타바예프 거리 2/1');
  set(a.ticket, 'note_ko', T_PRICE_UNKNOWN);
  set(a, 'ko_reviewed', false);
}
{
  const a = A['philharmonic-palace-of-arts'];
  l10n(a.name, '주립 필하모닉 (예술의 전당)');
  l10n(a.short, '카자흐와 세계 음악 공연: 도무비(도브라), 피아노, 라이브 보컬까지. 최근 새로운 예술의 전당으로 이전했습니다.');
  set(a, 'address_ko', '술탄 베이바리스 거리 10a');
  set(a.ticket, 'note_ko', '공연 포스터와 가격은 추후 공지됩니다.');
  set(a, 'ko_reviewed', false);
}
{
  const a = A['akmeshit-syrdarya-mosque'];
  l10n(a.name, '«압메시트-시르다리야» 중앙 모스크');
  l10n(
    a.short,
    '이 지역의 주요 모스크입니다. 미나레트 4개, 청록색(터키색) 돔, 흰색 건물. 저녁에 조명이 켜질 때 특히 아름답습니다.',
  );
  set(a, 'address_ko', '술탄 베이바리스 거리 14');
  set(a.ticket, 'note_ko', T_NO_FEE_INFO);
  l10n(a.etiquette, '입장 시 단정한 복장을 권장합니다(편집부 조언).');
  set(a, 'ko_reviewed', false);
}
{
  const a = A['aitbay-mosque'];
  l10n(a.name, '아트바이 모스크');
  l10n(
    a.short,
    '크질오르다에서 가장 오래된 모스크로, 1878년 시민들의 기부와 부하라 상인 아트바이 발타바예프의 참여로 지어졌습니다. 미나레트는 1980년대 말에 증축되었습니다.',
  );
  set(a, 'address_ko', '사트파예프 거리 14/1');
  set(a.ticket, 'note_ko', T_NO_FEE_INFO);
  set(a, 'ko_reviewed', false);
}
{
  const a = A['kazan-church'];
  l10n(a.name, '성 카잔 성당');
  l10n(
    a.short,
    '도시에 있는 유일한 정교회 성당으로, 19세기 말 비잔틴 스타일로 지어졌습니다. 크질오르다에서 문화와 종교가 늘 만났음을 보여주는 상징입니다.',
  );
  set(a, 'address_ko', 'Y. 토크타바예프 거리 1a/1');
  set(a.ticket, 'note_ko', T_NO_FEE_INFO);
  set(a, 'ko_reviewed', false);
}
{
  const a = A['old-bazaar-sybaga'];
  l10n(a.name, '시바가 시장 (구 시장)');
  l10n(
    a.short,
    '코르키트 아타 공원과 카잔 성당 사이의 지붕 달린 파빌리온 거리: 의류, 직물, 그릇, 향신료와 뜨거운 삼사(고기 만두).',
  );
  set(a, 'address_ko', '코르키트 아타 공원과 카잔 성당 사이');
  set(a.ticket, 'note_ko', T_FREE_ENTRY);
  set(a, 'ko_reviewed', false);
}
{
  const a = A['victory-park-obelisk'];
  l10n(a.name, '승리 공원 (타즈ым 광장) 및 영원한 영광 기념탑');
  l10n(
    a.short,
    '대조국전쟁에서 희생된 이를 기리는 타이타늄 기념탑입니다. 타이타늄 판은 바이코누르 우주 기지에서 가져온 것입니다. 주변에는 다른 추모 기념비들도 있습니다.',
  );
  set(a, 'address_ko', '시립 문화·휴양 공원 옆');
  set(a.ticket, 'note_ko', T_OPEN_AREA);
  set(a, 'ko_reviewed', false);
}
{
  const a = A['city-culture-park'];
  l10n(a.name, '시립 문화·휴양 공원');
  l10n(
    a.short,
    '입구에 시르 지역 영웅(바투르) 기념비가 있고, 안에는 관람차, 스케이트 파크와 놀이 시설이 있습니다. 가족 단위 휴식에 좋습니다.',
  );
  set(a, 'address_ko', '쿠나예프, 이반 주르바, 카즈베크 비 거리 교차로');
  set(a.ticket, 'note_ko', '놀이 시설 이용료 미기재');
  set(a, 'ko_reviewed', false);
}
{
  const a = A['shukenov-park'];
  l10n(a.name, '바티르한 슈케노프 공원');
  l10n(
    a.short,
    '크질오르다의 유명한 인물, A-Studio 전 멤버를 기리는 공원입니다. 어린이 문화센터 앞에 색소폰을 든 조형물이 있습니다.',
  );
  set(a, 'address_ko', '어린이 문화센터 앞');
  set(a.ticket, 'note_ko', T_OPEN_PARK);
  set(a, 'ko_reviewed', false);
}

/* ============ HOTELS ============ */
const H = Object.fromEntries(d.hotels.map((h) => [h.id, h]));

{
  const h = H['hotel-syrdarya'];
  l10n(h.name, '«시르다리야» 호텔');
  set(h, 'price_note_ko', '스탠다드 12,000₸, 발코니 포함 14,000₸, 스위트 15,000~17,000₸ (apartamenty.kz)');
  set(h, 'address_ko', '차이 톤 하크 거리 11');
  l10n(h.district, '중심 지구');
  set(h, 'ko_reviewed', false);
}
{
  const h = H['hotel-kyzylorda'];
  l10n(h.name, '«크질오르다» 호텔');
  set(
    h,
    'price_note_ko',
    'apartamenty.kz 기준 13,000~27,500₸; 2ГИС와 Booking은 더 높은 가격을 표시 (2ГИС: 40,000₸~; Booking: 약 129USD~). 예약 전에 확인하세요.',
  );
  set(h, 'address_ko', 'A. 토크마함베토브 거리 19');
  l10n(h.district, '중심부 근방 (약 700m)');
  set(h, 'ko_reviewed', false);
}
{
  const h = H['hotel-syr-arna'];
  l10n(h.name, '«시르 아르나» 호텔 단지');
  set(h, 'price_note_ko', '스탠다드 9,000₸, 세미 스위트 12,000₸, 스위트 16,000₸ (apartamenty.kz)');
  set(h, 'address_ko', '벡쇼라 거리 22');
  set(h, 'ko_reviewed', false);
}
{
  const h = H['hotel-sapar-de-lux'];
  l10n(h.name, 'Sapar De Lux Hotel');
  set(h, 'price_note_ko', '2ГИС 기준 22,000₸~');
  set(h, 'address_ko', '벡쇼라우리 거리 18');
  set(h, 'ko_reviewed', false);
}
{
  const h = H['hostel-meruert'];
  l10n(h.name, 'Meruert Hostel');
  set(
    h,
    'price_note_ko',
    'Expedia 기준 1박 약 26USD (2인) — KZT로 환산되지 않았습니다. 저가(예산)형.',
  );
  set(h, 'address_ko', '길브라트 거리 1 (Expedia 표기 기준)');
  set(h, 'ko_reviewed', false);
}

/* ============ LOCAL FOOD ============ */
set(d.local_food, 'note_ko', '구체적인 식당 이름은 없습니다: 식당 정보는 미확인 상태입니다. 챗봇은 카페 이름을 임의로 만들어서는 안 됩니다.');
const FOOD_KO = [
  '베스바르막',
  '솝파 (고기 국물)',
  '바우르삭 (튀긴 반죽)',
  '삼사 (시바가 시장)',
  '김츠(발효 말유), 쉬밧(발효 우유)',
];
d.local_food.items.forEach((item, i) => l10n(item, FOOD_KO[i]));
set(d.local_food, 'ko_reviewed', false);

/* ============ INTEREST OPTIONS ============ */
const INTEREST_KO = {
  history: '역사',
  culture: '문화',
  museum: '박물관',
  theatre: '극장',
  music: '음악',
  space: '우주',
  religion: '종교 시설',
  nature: '자연',
  food: '전통 음식',
  shopping: '시장, 쇼핑',
  photo: '사진',
};
for (const o of d.interest_options) set(o, 'ko', INTEREST_KO[o.id]);

writeFileSync(file, JSON.stringify(d, null, 2) + '\n', 'utf8');
console.log(`OK: ${changed} ko fields written to kyzylorda.json (additive, kk/en/ru untouched)`);
