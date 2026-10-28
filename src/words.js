/**
 * Built-in word lists, written for this game. Every word is lower case and uses
 * only letters of its language's alphabet (see alphabet.js); the tests enforce
 * that, the 4-12 letter length and the absence of duplicates.
 */

import { isLanguage } from './alphabet.js';

/** Category ids, in display order. Exported as a test seam. */
export const CATEGORIES = Object.freeze(['animals', 'cities', 'food', 'objects']);

const CATEGORY_LABELS = Object.freeze({
  animals: Object.freeze({ en: 'Animals', tr: 'Hayvanlar' }),
  cities: Object.freeze({ en: 'Cities', tr: 'Şehirler' }),
  food: Object.freeze({ en: 'Food', tr: 'Yiyecekler' }),
  objects: Object.freeze({ en: 'Objects', tr: 'Eşyalar' }),
});

/** Words per language and category, separated by whitespace. */
const SOURCES = {
  tr: {
    animals: `
      kedi köpek aslan kaplan zürafa maymun tavşan kaplumbağa kırlangıç baykuş
      kartal penguen yunus ahtapot kelebek karınca sincap kirpi tilki geyik
      deve eşek keçi horoz ördek leylek timsah gergedan papağan güvercin
      balina yengeç ıstakoz salyangoz kertenkele kurbağa örümcek çekirge bukalemun köstebek`,
    cities: `
      istanbul ankara izmir bursa antalya adana konya trabzon eskişehir gaziantep
      diyarbakır erzurum kayseri samsun mardin çanakkale edirne muğla nevşehir kırşehir
      şanlıurfa ığdır ısparta zonguldak londra paris roma viyana atina moskova
      tokyo kahire varşova budapeşte bükreş saraybosna bakü taşkent`,
    food: `
      ekmek peynir zeytin domates salatalık patlıcan havuç soğan sarımsak ıspanak
      pırasa armut kiraz çilek karpuz portakal mandalina limon üzüm şeftali
      kayısı fındık ceviz çorba köfte lahmacun börek gözleme simit poğaça
      baklava lokum sütlaç dondurma çikolata yoğurt yumurta mercimek`,
    objects: `
      masa sandalye kalem defter kitap makas şemsiye gözlük anahtar telefon
      bilgisayar televizyon buzdolabı tencere kaşık çatal bıçak bardak yastık battaniye
      lamba cüzdan şapka eldiven çorap ayakkabı düğme fermuar süpürge merdiven
      çekiç tornavida pusula dürbün uçurtma bisiklet harita keman`,
  },
  en: {
    animals: `
      tiger lion elephant giraffe zebra monkey rabbit turtle swallow eagle
      penguin dolphin octopus butterfly squirrel hedgehog wolf camel donkey horse
      hippopotamus chicken goose stork crocodile rhinoceros parrot pigeon whale lobster
      snail lizard spider kangaroo chameleon woodpecker walrus ostrich`,
    cities: `
      london paris rome berlin vienna athens moscow tokyo beijing cairo
      madrid lisbon warsaw prague budapest bucharest sarajevo tbilisi baku tashkent
      istanbul ankara izmir amsterdam brussels geneva venice florence barcelona stockholm
      copenhagen helsinki dublin toronto chicago sydney nairobi singapore`,
    food: `
      bread cheese olive tomato cucumber eggplant carrot potato onion garlic
      spinach mushroom apple cherry strawberry watermelon banana orange lemon grape
      peach apricot hazelnut walnut almond pistachio pasta soup pizza pancake
      waffle cookie yogurt honey chocolate popcorn dumpling pineapple`,
    objects: `
      table chair pencil notebook scissors umbrella glasses clock phone computer
      television fridge spoon fork knife teapot pillow blanket mirror candle
      wallet backpack suitcase glove button zipper broom ladder hammer screwdriver
      compass binoculars bicycle violin kite envelope telescope keyboard`,
  },
};

/**
 * @typedef {object} WordEntry
 * @property {string} word      Lower-case answer.
 * @property {string} category  One of {@link CATEGORIES}.
 */

const ENTRIES = Object.freeze({
  en: buildEntries(SOURCES.en),
  tr: buildEntries(SOURCES.tr),
});

/**
 * Returns every word of a language together with its category.
 * @param {'en'|'tr'} lang Word-list language.
 * @returns {readonly WordEntry[]}
 * @throws {RangeError} For an unsupported language.
 */
export function getWords(lang) {
  if (!isLanguage(lang)) throw new RangeError(`Unsupported language: ${String(lang)}`);
  return ENTRIES[lang];
}

/**
 * Returns the label of a category in the interface language.
 * @param {string} category Category id.
 * @param {'en'|'tr'} uiLang Interface language (independent of the word-list language).
 * @returns {string} The label, or the id itself for an unknown category or language.
 */
export function getCategoryLabel(category, uiLang) {
  if (!Object.hasOwn(CATEGORY_LABELS, category) || !isLanguage(uiLang)) return category;
  return CATEGORY_LABELS[category][uiLang];
}

/**
 * Splits the whitespace-separated sources into frozen word entries.
 * @param {Record<string, string>} source Words per category.
 * @returns {readonly WordEntry[]}
 */
function buildEntries(source) {
  return Object.freeze(
    CATEGORIES.flatMap((category) =>
      source[category]
        .trim()
        .split(/\s+/)
        .map((word) => Object.freeze({ word, category })),
    ),
  );
}
