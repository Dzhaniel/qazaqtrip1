// scripts/add-ko-phrases.mjs — ко аудармасы + pron_ko (hangul) барлық 59 сөзге (бір реттік)
import { readFileSync, writeFileSync } from 'node:fs';

const KO = {
  p1: { ko: '안녕하세요!', pron_ko: '살레멧시즈 베' },
  p2: { ko: '환영합니다!', pron_ko: '코시 켈딘니즈' },
  p3: { ko: '감사합니다!', pron_ko: '라흐메트' },
  p4: { ko: '안녕히 가세요!', pron_ko: '사우 볼리니즈' },
  p5: { ko: '네.', pron_ko: '이예' },
  p6: { ko: '아니요, 고마워요.', pron_ko: '조크, 라흐메트' },
  p7: { ko: '실례합니다.', pron_ko: '케시리니즈' },
  p8: { ko: '빈 방이 있나요?', pron_ko: '코나퀴데 옐린 바르 마?' },
  p9: { ko: '체크인할 수 있나요?', pron_ko: '틱켈레 아라인 바?' },
  p10: { ko: '아침식은 언제인가요?', pron_ko: '탐기 아스 카샨 보라디?' },
  p11: { ko: '방이 얼마인가요?', pron_ko: '볼메 칸사 투라디?' },
  p12: { ko: '와이파이 있나요?', pron_ko: '우이파이 바르 마?' },
  p13: { ko: '방이 깨끗한가요?', pron_ko: '볼메 타자 마?' },
  p14: { ko: '버스가 언제 오나요?', pron_ko: '아브토부스 카샨 켈레이디?' },
  p15: { ko: '택시를 부를 수 있나요?', pron_ko: '탁시 샤쿠루가 올라 마?' },
  p16: { ko: '어디로 가나요?', pron_ko: '카이다 바라디?' },
  p17: { ko: '표를 살 수 있나요?', pron_ko: '빌렛 사팁 알라 아라인 바?' },
  p18: { ko: '어디서 내릴까요?', pron_ko: '카이다 투수 케렉?' },
  p19: { ko: '차를 주세요.', pron_ko: '샤이 베리니즈시' },
  p20: { ko: '물을 주세요.', pron_ko: '수 베리니즈시' },
  p21: { ko: '고기 없는 음식이 있나요?', pron_ko: '엡시즈 타마크 바르 마?' },
  p22: { ko: '계산서를 주세요.', pron_ko: '쇼트티 베리니즈시' },
  p23: { ko: '저는 술을 마시지 않아요.', pron_ko: '멘 이쉬킬릭 이쉬페민' },
  p24: { ko: '이것이 무엇인가요?', pron_ko: '불 네?' },
  p25: { ko: '박물관이 어디인가요?', pron_ko: '무라자이 카이다?' },
  p26: { ko: '표가 얼마인가요?', pron_ko: '빌렛 칸사 투라디?' },
  p27: { ko: '사진 찍어도 될까요?', pron_ko: '수렛케 투스입 볼마이 마?' },
  p28: { ko: '박물관이 언제 닫나요?', pron_ko: '무라자이 카샨 자바라디?' },
  p29: { ko: '오디오 가이드가 있나요?', pron_ko: '다우스티크 기드 바르 마?' },
  p30: { ko: '정말 아름다워요!', pron_ko: '오테 애데미!' },
  p31: { ko: '이건 얼마인가요?', pron_ko: '불 칸사 투라디?' },
  p32: { ko: '비싸요!', pron_ko: '큼바트!' },
  p33: { ko: '싸게 해주시겠어요?', pron_ko: '아르잔다이 아라스즈 바?' },
  p34: { ko: '이거 살게요.', pron_ko: '부니 사팁 아라인' },
  p35: { ko: '반품할 수 있나요?', pron_ko: '카이루가 올라 마?' },
  p36: { ko: '도와주세요!', pron_ko: '코메크테시니즈시!' },
  p37: { ko: '구급차를 부르세요!', pron_ko: '제델 자르덤 샤쿠리니즈!' },
  p38: { ko: '경찰서가 어디인가요?', pron_ko: '폴리치야 카이다?' },
  p39: { ko: '약국이 어디인가요?', pron_ko: '다리하나 카이다?' },
  p40: { ko: '제 문서를 잃어버렸어요.', pron_ko: '메닌 쿠자팀 조갈디' },
  p41: { ko: '하나 (1)', pron_ko: '비르' },
  p42: { ko: '둘 (2)', pron_ko: '에키' },
  p43: { ko: '셋 (3)', pron_ko: '우쉬' },
  p44: { ko: '넷 (4)', pron_ko: '톨르트' },
  p45: { ko: '다섯 (5)', pron_ko: '베스' },
  p46: { ko: '여섯 (6)', pron_ko: '알티' },
  p47: { ko: '일곱 (7)', pron_ko: '제티' },
  p48: { ko: '여덟 (8)', pron_ko: '세기즈' },
  p49: { ko: '아홉 (9)', pron_ko: '토그즈' },
  p50: { ko: '열 (10)', pron_ko: '온' },
  p101: { ko: '오른쪽으로', pron_ko: '옅가' },
  p102: { ko: '왼쪽으로', pron_ko: '솔가' },
  p103: { ko: '직진', pron_ko: '투라' },
  p104: { ko: '가까워요', pron_ko: '자킨' },
  p105: { ko: '멀어요', pron_ko: '알리스' },
  p106: { ko: '이십 (20)', pron_ko: '지르마' },
  p107: { ko: '오십 (50)', pron_ko: '엘루' },
  p108: { ko: '일백 (100)', pron_ko: '쥐즈' },
  p109: { ko: '일천 (1000)', pron_ko: '민' },
};

const p = 'src/data/cities/kyzylorda.json';
const data = JSON.parse(readFileSync(p, 'utf8'));
const missing = [];
for (const ph of data.kazakh_phrases) {
  const v = KO[ph.id];
  if (!v) {
    missing.push(ph.id);
    continue;
  }
  ph.ko = v.ko;
  ph.pron_ko = v.pron_ko;
  ph.ko_reviewed = false;
}
writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(missing.length ? `JOQ: ${missing.join(', ')}` : 'OK: 59 сөзге ko + pron_ko қосылды');
