"use strict";

/*
 * Кожне завдання:
 *   ua / en               — повні речення-джерела двома мовами (показуються як завдання)
 *   enCorrect             — правильні англійські слова-пазли В ПРАВИЛЬНОМУ ПОРЯДКУ
 *   enDistract / uaDistract — зайві слова (їх НЕ треба використовувати)
 *
 * uaCorrect НЕ пишемо вручну — його беремо прямо з речення-джерела `ua`
 * (див. deriveUaAnswers нижче), щоб відповідь українською завжди збігалася
 * з тим самим реченням, що показується в англійській версії гри.
 *
 * Слова-плитки навмисно БЕЗ підказок: без великої літери на початку
 * та без крапки/знаку в кінці. Великими лишаються тільки "I" та власні
 * назви (Anya, Tom, Poland / Аня, Том, Польща), бо такими вони є будь-де.
 */
const DATA = [
  {
    ua: "Ми завжди бавимось разом.",
    en: "We always play together.",
    enCorrect: ["we", "always", "play", "together"],
    enDistract: ["played", "will play", "are playing"],
    uaDistract: ["граємо", "бавились", "будемо бавитись"]
  },
  {
    ua: "Я ніколи не був в Польщі.",
    en: "I have never been to Poland.",
    enCorrect: ["I", "have", "never", "been", "to", "Poland"],
    enDistract: ["was", "am", "will be"],
    uaDistract: ["буду", "є", "будемо"]
  },
  {
    ua: "Він знає Тома на протязі десяти років.",
    en: "He has known Tom for ten years.",
    enCorrect: ["he", "has", "known", "Tom", "for", "ten", "years"],
    enDistract: ["knew", "knows", "since"],
    uaDistract: ["знав", "знатиме", "з"]
  },
  {
    ua: "Мої батьки живуть тут з 2006 року.",
    en: "My parents have lived here since 2006.",
    enCorrect: ["my", "parents", "have", "lived", "here", "since", "2006"],
    enDistract: ["live", "for", "are living"],
    uaDistract: ["жили", "житимуть", "на"]
  },
  {
    ua: "Я вже зробив домашнє.",
    en: "I have already done my homework.",
    enCorrect: ["I", "have", "already", "done", "my", "homework"],
    enDistract: ["did", "do", "will do"],
    uaDistract: ["роблю", "робитиму", "ще"]
  },
  {
    ua: "Ти вже купив подарунок?",
    en: "Have you already bought the present?",
    enCorrect: ["have", "you", "already", "bought", "the", "present"],
    enDistract: ["did", "buy", "do"],
    uaDistract: ["купуєш", "купиш", "ще"]
  },
  {
    ua: "Ми були в школі вчора.",
    en: "We were at school yesterday.",
    enCorrect: ["we", "were", "at", "school", "yesterday"],
    enDistract: ["was", "are", "have been"],
    uaDistract: ["є", "будемо", "сьогодні"]
  },
  {
    ua: "Аня ще не прочитала цю книгу.",
    en: "Anya has not read this book yet.",
    enCorrect: ["Anya", "has", "not", "read", "this", "book", "yet"],
    enDistract: ["did", "reads", "already"],
    uaDistract: ["читає", "прочитає", "вже"]
  },
  {
    ua: "Я купив телефон вчора.",
    en: "I bought a phone yesterday.",
    enCorrect: ["I", "bought", "a", "phone", "yesterday"],
    enDistract: ["have bought", "buy", "will buy"],
    uaDistract: ["куплю", "купую", "завтра"]
  },
  {
    ua: "Наша бабуся приїде навідати нас наступного місяця.",
    en: "Our grandmother will come to visit us next month.",
    enCorrect: ["our", "grandmother", "will", "come", "to", "visit", "us", "next", "month"],
    enDistract: ["came", "comes", "is coming"],
    uaDistract: ["приїхала", "приїжджає", "минулого"]
  },
  {
    ua: "Аня не зможе прийти на вечірку.",
    en: "Anya will not be able to come to the party.",
    enCorrect: ["Anya", "will", "not", "be", "able", "to", "come", "to", "the", "party"],
    enDistract: ["can", "could", "is"],
    uaDistract: ["може", "змогла", "з"]
  },
  {
    ua: "Я буду співаком.",
    en: "I will be a singer.",
    enCorrect: ["I", "will", "be", "a", "singer"],
    enDistract: ["am", "was", "going"],
    uaDistract: ["є", "був", "співати"]
  },
  {
    ua: "Дивись! Наші однокласники грають у футбол.",
    en: "Look! Our classmates are playing football.",
    enCorrect: ["look", "our", "classmates", "are", "playing", "football"],
    enDistract: ["play", "played", "will play"],
    uaDistract: ["грали", "гратимуть", "на"]
  },
  {
    ua: "Я не могла подзвонити тобі вчора.",
    en: "I could not call you yesterday.",
    enCorrect: ["I", "could", "not", "call", "you", "yesterday"],
    enDistract: ["can", "cannot", "will"],
    uaDistract: ["можу", "зможу", "завтра"]
  },
  {
    ua: "Коли я повернувся зі школи, мама готувала обід.",
    en: "When I came back from school, mom was cooking lunch.",
    enCorrect: ["when", "I", "came", "back", "from", "school", "mom", "was", "cooking", "lunch"],
    enDistract: ["come", "cooked", "is cooking"],
    uaDistract: ["повертаюсь", "приготувала", "готує"]
  },
  {
    ua: "Завтра о 10 годині ранку я буду писати тест.",
    en: "Tomorrow at 10 a.m. I will be writing a test.",
    enCorrect: ["tomorrow", "at", "10", "a.m.", "I", "will", "be", "writing", "a", "test"],
    enDistract: ["am writing", "wrote", "write"],
    uaDistract: ["писав", "пишу", "напишу"]
  },
  {
    ua: "Я звик їсти багато овочів. (зараз така звичка)",
    en: "I am used to eating a lot of vegetables.",
    enCorrect: ["I", "am", "used", "to", "eating", "a", "lot", "of", "vegetables"],
    enDistract: ["eat", "ate", "use"],
    uaDistract: ["їв", "їм", "звикаю"]
  },
  {
    ua: "Я їв колись багато овочів. (раніше, але вже ні)",
    en: "I used to eat a lot of vegetables.",
    enCorrect: ["I", "used", "to", "eat", "a", "lot", "of", "vegetables"],
    enDistract: ["am used to", "ate", "eating"],
    uaDistract: ["звик", "їм", "їстиму"]
  }
];

// Власні назви — лишаються з великої літери навіть на початку речення.
const UA_PROPER = new Set(["Аня", "Том", "Тома", "Тому", "Томе", "Польща", "Польщі", "Польщу"]);

// Розбиває речення-джерело на слова-відповіді:
//  • прибирає пояснення в дужках,
//  • знімає кінцеві розділові знаки (. , ! ? ; :),
//  • робить перше слово з малої літери (крім власних назв).
function uaAnswerFromSource(sentence) {
  const tokens = sentence
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const out = [];
  let atSentenceStart = true;
  for (const tok of tokens) {
    const word = tok.replace(/[.,!?;:]+$/u, "");
    if (word) {
      out.push(atSentenceStart && !UA_PROPER.has(word)
        ? word.charAt(0).toLowerCase() + word.slice(1)
        : word);
    }
    atSentenceStart = /[.!?]$/u.test(tok); // наступне слово відкриває нове речення
  }
  return out;
}

for (const d of DATA) {
  d.uaCorrect = uaAnswerFromSource(d.ua);
}

/*
 * Зв'язки "допоміжне слово → основне дієслово" для англійського речення.
 * Числа — це індекси слів у `en` (розбитому по пробілах), з 0.
 * Стрілка показується від допоміжного (be/was/have/has/will/...) до головного.
 * Порожній масив — стрілки немає (немає допоміжного дієслова).
 */
const EN_VERB_LINKS = [
  [],                  //  0  We always play together.
  [[1, 3]],            //  1  I [have] never [been] ...
  [[1, 2]],            //  2  He [has] [known] Tom ...
  [[2, 3]],            //  3  My parents [have] [lived] ...
  [[1, 3]],            //  4  I [have] already [done] ...
  [[0, 3]],            //  5  [Have] you already [bought] ...
  [],                  //  6  We were at school yesterday.
  [[1, 3]],            //  7  Anya [has] not [read] ...
  [],                  //  8  I bought a phone yesterday.
  [[2, 3]],            //  9  ... [will] [come] to visit ...
  [[1, 3]],            // 10  Anya [will] not [be] able ...
  [[1, 2]],            // 11  I [will] [be] a singer.
  [[3, 4]],            // 12  ... classmates [are] [playing] football.
  [[1, 3]],            // 13  I [could] not [call] ...
  [[7, 8]],            // 14  ... mom [was] [cooking] lunch.
  [[5, 6], [6, 7]],    // 15  ... I [will] [be] [writing] a test.
  [],                  // 16  I am used to eating a lot of vegetables.
  []                   // 17  I used to eat a lot of vegetables.
];

DATA.forEach((d, i) => { d.verbLinks = EN_VERB_LINKS[i] || []; });
