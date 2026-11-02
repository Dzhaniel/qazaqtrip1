// Кеңейтілген фразалар (50) — 2021 латын транслитерация, тақырыптар.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const p = join(__dirname, '..', 'src/data/cities/kyzylorda.json');
const d = JSON.parse(readFileSync(p, 'utf8'));

let n = 0;
const P = (kk, translit, en, ru, topic) => ({ id: 'p' + ++n, kk, translit, en, ru, topic });

d.kazakh_phrases = [
  // ---- greetings ----
  P('Сәлеметсіз бе!', 'Sälemetsiz be!', 'Hello! (formal)', 'Здравствуйте!', 'greetings'),
  P('Қош келдіңіз!', 'Qosh keldingiz!', 'Welcome!', 'Добро пожаловать!', 'greetings'),
  P('Рақмет!', 'Raqmet!', 'Thank you!', 'Спасибо!', 'greetings'),
  P('Сау болыңыз!', 'Sau bolungyz!', 'Goodbye!', 'До свидания!', 'greetings'),
  P('Иә.', 'Iya.', 'Yes.', 'Да.', 'greetings'),
  P('Жоқ, рақмет.', 'Joq, raqmet.', 'No, thank you.', 'Нет, спасибо.', 'greetings'),
  P('Кешіріңіз.', 'Keshiringiz.', 'Excuse me / I am sorry.', 'Извините / простите.', 'greetings'),
  // ---- hotel ----
  P('Қонақүйде орын бар ма?', 'Qonaquyde oryn bar ma?', 'Is there a free room?', 'Есть свободный номер?', 'hotel'),
  P('Тіркеле аламын ба?', 'Tirkelen alayin ba?', 'Can I check in?', 'Можно оформить заселение?', 'hotel'),
  P('Таңғы ас қашан болады?', 'Tangy as qashan bolady?', 'When is breakfast?', 'Когда завтрак?', 'hotel'),
  P('Бөлме қанша тұрады?', 'Bolme qansha turady?', 'How much is the room?', 'Сколько стоит номер?', 'hotel'),
  P('Уай-фай бар ма?', 'Uay-fai bar ma?', 'Is there Wi-Fi?', 'Есть ли Wi-Fi?', 'hotel'),
  P('Бөлме таза ма?', 'Bolme taza ma?', 'Is the room clean?', 'Номер чистый?', 'hotel'),
  // ---- transport ----
  P('Автобус қашан келеді?', 'Avtobus qashan keledi?', 'When does the bus come?', 'Когда приедет автобус?', 'transport'),
  P('Такси шақыруға бола ма?', 'Taksi shakyrǵa bola ma?', 'Can I get a taxi?', 'Можно вызвать такси?', 'transport'),
  P('Қайда барады?', 'Qayda barady?', 'Where does it go?', 'Куда идёт (транспорт)?', 'transport'),
  P('Билет сатып ала аламын ба?', 'Bilet satyp alayin ba?', 'Can I buy a ticket?', 'Можно купить билет?', 'transport'),
  P('Қайда түсу керек?', 'Qayda tüsü kerek?', 'Where should I get off?', 'Где мне выйти?', 'transport'),
  // ---- food ----
  P('Шай беріңізші.', 'Shai beringsizshi.', 'Tea, please.', 'Чай, пожалуйста.', 'food'),
  P('Су беріңізші.', 'Su beringsizshi.', 'Water, please.', 'Воды, пожалуйста.', 'food'),
  P('Етсіз тамақ бар ма?', 'Etsiz tamak bar ma?', 'Is there food without meat?', 'Есть ли еда без мяса?', 'food'),
  P('Шотты беріңізші.', 'Shottı beringsizshi.', 'The bill, please.', 'Счёт, пожалуйста.', 'food'),
  P('Мен ішкілік ішпеймін.', 'Men ishiklik ishpemin.', 'I do not drink alcohol.', 'Я не пью алкоголь.', 'food'),
  P('Бұл не?', 'Bul ne?', 'What is this?', 'Что это?', 'food'),
  // ---- museum ----
  P('Мұражай қайда?', 'Murazhaj qayda?', 'Where is the museum?', 'Где музей?', 'museum'),
  P('Билет қанша тұрады?', 'Bilet qansha turady?', 'How much is a ticket?', 'Сколько стоит билет?', 'museum'),
  P('Суретке түсіп болмай ма?', 'Suretke tüsip bolmay ma?', 'Can I take photos?', 'Можно ли фотографировать?', 'museum'),
  P('Мұражай қашан жабылады?', 'Murazhaj qashan jabylady?', 'When does the museum close?', 'Когда музей закрывается?', 'museum'),
  P('Дауыстық гид бар ма?', 'Dauystyq gide bar ma?', 'Is there an audio guide?', 'Есть ли аудиогид?', 'museum'),
  P('Өте әдемі!', 'Öte ädemi!', 'Very beautiful!', 'Очень красиво!', 'museum'),
  // ---- shopping ----
  P('Бұл қанша тұрады?', 'Bul qansha turady?', 'How much is this?', 'Сколько это стоит?', 'shopping'),
  P('Қымбат!', 'Qymbat!', 'Expensive!', 'Дорого!', 'shopping'),
  P('Арзандай аласыз ба?', 'Arzanday lasiz ba?', 'Can you make it cheaper?', 'Невозможно подешевле?', 'shopping'),
  P('Бұны сатып аламын.', 'Buny satyp alayin.', 'I will take this.', 'Возьму это.', 'shopping'),
  P('Қайыруға бола ма?', 'Qayyrǵa bola ma?', 'Can I return it?', 'Можно ли вернуть (товар)?', 'shopping'),
  // ---- emergency ----
  P('Көмектесіңізші!', 'Kömektesingizhi!', 'Please help me!', 'Помогите, пожалуйста!', 'emergency'),
  P('Жедел жәрдем шақырыңыз!', 'Jedel jar-dem shakırınız!', 'Call an ambulance!', 'Позвоните в скорую!', 'emergency'),
  P('Полиция қайда?', 'Politsiya qayda?', 'Where is the police?', 'Где полиция?', 'emergency'),
  P('Дәріхана қайда?', 'Darikana qayda?', 'Where is the pharmacy?', 'Где аптека?', 'emergency'),
  P('Менің құжатым жоғалды.', 'Menıng qūjatım jogaladı.', 'I lost my documents.', 'Я потерял(а) документы.', 'emergency'),
  // ---- numbers ----
  P('Бір', 'Bir', 'One (1)', 'Один (1)', 'numbers'),
  P('Екі', 'Eki', 'Two (2)', 'Два (2)', 'numbers'),
  P('Үш', 'Üsh', 'Three (3)', 'Три (3)', 'numbers'),
  P('Төрт', 'Tört', 'Four (4)', 'Четыре (4)', 'numbers'),
  P('Бес', 'Bes', 'Five (5)', 'Пять (5)', 'numbers'),
  P('Алты', 'Altı', 'Six (6)', 'Шесть (6)', 'numbers'),
  P('Жеті', 'Jeti', 'Seven (7)', 'Семь (7)', 'numbers'),
  P('Сегіз', 'Segiz', 'Eight (8)', 'Восемь (8)', 'numbers'),
  P('Тоғыз', 'Toǵyz', 'Nine (9)', 'Девять (9)', 'numbers'),
  P('Он', 'On', 'Ten (10)', 'Десять (10)', 'numbers'),
];

writeFileSync(p, JSON.stringify(d, null, 2) + '\n');
console.log('phrases:', d.kazakh_phrases.length);
