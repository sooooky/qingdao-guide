interface TranslationResult {
  cn: string;
  pinyin: string;
  en: string;
}

// Built-in offline travel dictionary for guaranteed offline translation
const OFFLINE_DICTIONARY: { [key: string]: TranslationResult } = {
  '와이파이': { cn: '无线网络密码是多少？', pinyin: 'Wúxiàn wǎngluò mìmǎ shì duōshao?', en: 'What is the Wi-Fi password?' },
  '와이파이 비밀번호': { cn: '请问WiFi密码是多少？', pinyin: 'Qǐngwèn WiFi mìmǎ shì duōshao?', en: 'Could you tell me the Wi-Fi password?' },
  '트렁크': { cn: '师傅，请开一下后备箱。', pinyin: 'Shīfu, qǐng kāi yíxià hòubèixiāng.', en: 'Driver, please open the trunk.' },
  '트렁크 열어주세요': { cn: '师傅，请帮我开一下后备箱。', pinyin: 'Shīfu, qǐng bāng wǒ kāi yíxià hòubèixiāng.', en: 'Could you please open the trunk?' },
  '얼음물': { cn: '请给我一杯冰水。', pinyin: 'Qǐng gěi wǒ yībēi bīng shuǐ.', en: 'Please give me a glass of ice water.' },
  '따뜻한 물': { cn: '请给我一杯温水。', pinyin: 'Qǐng gěi wǒ yībēi wēn shuǐ.', en: 'Please give me warm water.' },
  '물티슈': { cn: '请给我湿纸巾。', pinyin: 'Qǐng gěi wǒ shīzhǐjīn.', en: 'Please bring wet tissues.' },
  '냅킨': { cn: '请给我餐巾纸。', pinyin: 'Qǐng gěi wǒ cānjīnzhǐ.', en: 'Napkins, please.' },
  '젓가락': { cn: '请再给我一双筷子。', pinyin: 'Qǐng zài gěi wǒ yīshuāng kuàizi.', en: 'Please give me another pair of chopsticks.' },
  '앞접시': { cn: '请给我一个小碗 / 碟子。', pinyin: 'Qǐng gěi wǒ yíge xiǎowǎn.', en: 'Please bring a small plate/bowl.' },
  '추천 메뉴': { cn: '请问有什么招牌菜推荐？', pinyin: 'Qǐngwèn yǒu shénme zhāopáicài tuījiàn?', en: 'What signature dish do you recommend?' },
  '포장': { cn: '请帮我打包。', pinyin: 'Qǐng bāng wǒ dǎbāo.', en: 'Please pack this to go.' },
  '영수증': { cn: '请给我小票 / 发票。', pinyin: 'Qǐng gěi wǒ xiǎopiào.', en: 'Please give me the receipt.' },
  '체크인': { cn: '我想办理入住，这是我的预订。', pinyin: 'Wǒ xiǎng bànlǐ rùzhù.', en: 'I would like to check in, here is my booking.' },
  '체크아웃': { cn: '我想退房。', pinyin: 'Wǒ xiǎng tuìfáng.', en: 'I would like to check out.' },
  '짐 보관': { cn: '可以帮我寄存一下行李吗？', pinyin: 'Kěyǐ bāng wǒ jìcún yíxià xíngli ma?', en: 'Could you please store my luggage?' },
  '수건 더 주세요': { cn: '请多给我两条毛巾。', pinyin: 'Qǐng duō gěi wǒ liǎngtiáo máojīn.', en: 'Please give me extra towels.' },
  '화장실': { cn: '请问洗手间在哪里？', pinyin: 'Qǐngwèn xǐshǒujiān zài nǎlǐ?', en: 'Where is the restroom?' },
  '얼마예요': { cn: '这个多少钱？', pinyin: 'Zhège duōshao qián?', en: 'How much is this?' },
  '깎아주세요': { cn: '可以便宜一点吗？', pinyin: 'Kěyǐ piányi yīdiǎn ma?', en: 'Could you give me a discount?' },
  '알리페이': { cn: '可以刷支付宝吗？', pinyin: 'Kěyǐ shuā Zhīfùbǎo ma?', en: 'Can I pay with Alipay?' },
  '미터기 켜주세요': { cn: '师傅，请打表。', pinyin: 'Shīfu, qǐng dǎbiǎo.', en: 'Please turn on the meter.' },
  '여기서 내려주세요': { cn: '师傅，就在这里下车。', pinyin: 'Shīfu, jiù zài zhèlǐ xiàchē.', en: 'Please let me off here.' },
  '도와주세요': { cn: '请帮帮我！', pinyin: 'Qǐng bāngbang wǒ!', en: 'Please help me!' },
};

/**
 * Translates Korean text to Simplified Chinese (with Pinyin) and English.
 * Works seamlessly with Google Translation Web API + offline dictionary fallback.
 */
export async function translateKoreanText(korean: string): Promise<TranslationResult> {
  const query = korean.trim();
  if (!query) {
    return { cn: '', pinyin: '', en: '' };
  }

  // 1. Check exact match in offline dictionary
  if (OFFLINE_DICTIONARY[query]) {
    return OFFLINE_DICTIONARY[query];
  }

  // 2. Try online real-time translation with fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // Call Google Translation Web API for Chinese + Romanization
    const zhUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=zh-CN&dt=t&dt=rm&q=${encodeURIComponent(
      query
    )}`;
    const enUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=en&dt=t&q=${encodeURIComponent(
      query
    )}`;

    const [zhRes, enRes] = await Promise.all([
      fetch(zhUrl, { signal: controller.signal }),
      fetch(enUrl, { signal: controller.signal }),
    ]);

    clearTimeout(timeoutId);

    if (zhRes.ok && enRes.ok) {
      const zhData = await zhRes.json();
      const enData = await enRes.json();

      // Extract translated Chinese text
      let cnTranslated = '';
      let pinyinExtracted = '';

      if (Array.isArray(zhData[0])) {
        cnTranslated = zhData[0]
          .map((item: any) => item[0])
          .filter(Boolean)
          .join('');

        // Find romanization if present in zhData
        const rmItem = zhData[0].find((item: any) => item[2] || item[3]);
        if (rmItem) {
          pinyinExtracted = rmItem[2] || rmItem[3] || '';
        }
      }

      // Extract English text
      let enTranslated = '';
      if (Array.isArray(enData[0])) {
        enTranslated = enData[0]
          .map((item: any) => item[0])
          .filter(Boolean)
          .join('');
      }

      if (cnTranslated) {
        return {
          cn: cnTranslated,
          pinyin: pinyinExtracted || generateSimplePinyinHint(cnTranslated),
          en: enTranslated || query,
        };
      }
    }
  } catch (err) {
    console.warn('Online translation failed or timed out, trying keyword match', err);
  }

  // 3. Keyword / partial matching in offline dictionary
  for (const [key, value] of Object.entries(OFFLINE_DICTIONARY)) {
    if (query.includes(key)) {
      return value;
    }
  }

  // 4. Default fallback
  return {
    cn: query,
    pinyin: '',
    en: query,
  };
}

function generateSimplePinyinHint(cnText: string): string {
  // Common character phonetic guides
  const map: { [c: string]: string } = {
    请: 'qǐng',
    带: 'dài',
    我: 'wǒ',
    去: 'qù',
    不: 'bù',
    要: 'yào',
    香: 'xiāng',
    菜: 'cài',
    多: 'duō',
    少: 'shǎo',
    钱: 'qián',
    买: 'mǎi',
    单: 'dān',
    水: 'shuǐ',
    冰: 'bīng',
    啤: 'pí',
    酒: 'jiǔ',
  };

  const words = Array.from(cnText)
    .map((c) => map[c] || '')
    .filter(Boolean);

  return words.join(' ');
}
