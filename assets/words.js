/* Amounts in words (tafqeet), Arabic and English, for the invoice generator.
 *   FMWords.ar(1050.5, 'AED') -> 'فقط ألف وخمسون درهماً إماراتياً وخمسون فلساً لا غير'
 *   FMWords.en(1050.5, 'AED') -> 'One thousand fifty UAE dirhams and fifty fils only'
 * Counted-noun rules: 1 and 2 use the noun's own singular/dual, 3–10 the plural, 11–99 the accusative singular,
 * and round hundreds/thousands the genitive singular. Feminine units (هللة، بيسة) use feminine numbers. */
(() => {
  const CUR = {
    AED: { dec: 2, ar: ['درهم إماراتي', 'درهمان إماراتيان', 'دراهم إماراتية', 'درهماً إماراتياً'], arf: ['فلس', 'فلسان', 'فلوس', 'فلساً'], en: ['UAE dirham', 'UAE dirhams'], enf: ['fils', 'fils'] },
    SAR: { dec: 2, ar: ['ريال سعودي', 'ريالان سعوديان', 'ريالات سعودية', 'ريالاً سعودياً'], arf: ['هللة', 'هللتان', 'هللات', 'هللةً'], fem: true, en: ['Saudi riyal', 'Saudi riyals'], enf: ['halala', 'halalas'] },
    EGP: { dec: 2, ar: ['جنيه مصري', 'جنيهان مصريان', 'جنيهات مصرية', 'جنيهاً مصرياً'], arf: ['قرش', 'قرشان', 'قروش', 'قرشاً'], en: ['Egyptian pound', 'Egyptian pounds'], enf: ['piastre', 'piastres'] },
    KWD: { dec: 3, ar: ['دينار كويتي', 'ديناران كويتيان', 'دنانير كويتية', 'ديناراً كويتياً'], arf: ['فلس', 'فلسان', 'فلوس', 'فلساً'], en: ['Kuwaiti dinar', 'Kuwaiti dinars'], enf: ['fils', 'fils'] },
    QAR: { dec: 2, ar: ['ريال قطري', 'ريالان قطريان', 'ريالات قطرية', 'ريالاً قطرياً'], arf: ['درهم', 'درهمان', 'دراهم', 'درهماً'], en: ['Qatari riyal', 'Qatari riyals'], enf: ['dirham', 'dirhams'] },
    BHD: { dec: 3, ar: ['دينار بحريني', 'ديناران بحرينيان', 'دنانير بحرينية', 'ديناراً بحرينياً'], arf: ['فلس', 'فلسان', 'فلوس', 'فلساً'], en: ['Bahraini dinar', 'Bahraini dinars'], enf: ['fils', 'fils'] },
    OMR: { dec: 3, ar: ['ريال عماني', 'ريالان عمانيان', 'ريالات عمانية', 'ريالاً عمانياً'], arf: ['بيسة', 'بيستان', 'بيسات', 'بيسةً'], fem: true, en: ['Omani rial', 'Omani rials'], enf: ['baisa', 'baisa'] },
    JOD: { dec: 3, ar: ['دينار أردني', 'ديناران أردنيان', 'دنانير أردنية', 'ديناراً أردنياً'], arf: ['فلس', 'فلسان', 'فلوس', 'فلساً'], en: ['Jordanian dinar', 'Jordanian dinars'], enf: ['fils', 'fils'] },
    USD: { dec: 2, ar: ['دولار أمريكي', 'دولاران أمريكيان', 'دولارات أمريكية', 'دولاراً أمريكياً'], arf: ['سنت', 'سنتان', 'سنتات', 'سنتاً'], en: ['US dollar', 'US dollars'], enf: ['cent', 'cents'] },
    EUR: { dec: 2, ar: ['يورو', 'يورو', 'يورو', 'يورو'], arf: ['سنت', 'سنتان', 'سنتات', 'سنتاً'], en: ['euro', 'euros'], enf: ['cent', 'cents'] },
    GBP: { dec: 2, ar: ['جنيه إسترليني', 'جنيهان إسترلينيان', 'جنيهات إسترلينية', 'جنيهاً إسترلينياً'], arf: ['بنس', 'بنسان', 'بنسات', 'بنساً'], en: ['pound sterling', 'pounds sterling'], enf: ['penny', 'pence'] },
  };

  // ---------------- Arabic
  const ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة'];
  const ONES_F = ['', 'واحدة', 'اثنتان', 'ثلاث', 'أربع', 'خمس', 'ست', 'سبع', 'ثماني', 'تسع', 'عشر'];
  const TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const HUND = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  function ar99(n, f) {
    const O = f ? ONES_F : ONES;
    if (n <= 10) return O[n];
    if (n === 11) return f ? 'إحدى عشرة' : 'أحد عشر';
    if (n === 12) return f ? 'اثنتا عشرة' : 'اثنا عشر';
    if (n < 20) return O[n - 10] + (f ? ' عشرة' : ' عشر');
    const o = n % 10;
    return (o ? O[o] + ' و' : '') + TENS[Math.floor(n / 10)];
  }
  function ar999(n, f) {
    const h = Math.floor(n / 100), r = n % 100;
    return [HUND[h], r ? ar99(r, f) : ''].filter(Boolean).join(' و');
  }
  // n of a counted noun with forms [singular, dual, plural, accusative]
  function counted(n, forms, f, words) {
    if (n === 1) return forms[0];
    if (n === 2) return forms[1];
    const r = n % 100;
    if (r >= 3 && r <= 10) return words + ' ' + forms[2];
    if (r >= 11) return words + ' ' + forms[3];
    return words + ' ' + forms[0];
  }
  // [singular, dual, plural, accusative, dual before a noun]
  const SCALES = [
    [1e9, ['مليار', 'ملياران', 'مليارات', 'ملياراً', 'مليارا']],
    [1e6, ['مليون', 'مليونان', 'ملايين', 'مليوناً', 'مليونا']],
    [1e3, ['ألف', 'ألفان', 'آلاف', 'ألفاً', 'ألفا']],
  ];
  function arInt(n, f) {
    if (n === 0) return 'صفر';
    const parts = [];
    for (const [v, forms] of SCALES) {
      const g = Math.floor(n / v) % 1000;
      if (!g) continue;
      // When nothing follows this group, the currency comes straight after it: أحد عشر ألف درهم، ألفا جنيه
      const last = n % v === 0;
      const fm = last ? [forms[0], forms[4], forms[2], forms[0]] : forms;
      parts.push(counted(g, fm, false, ar999(g, false)));
    }
    const rest = n % 1000;
    if (rest) parts.push(ar999(rest, f));
    return parts.join(' و');
  }
  // The number with its noun: 1 and 2 are said by the noun alone (درهم، درهمان).
  function arAmount(n, forms, f) {
    if (n === 1) return forms[0] + ' ' + (f ? 'واحدة' : 'واحد');
    if (n === 2) return forms[1];
    return counted(n, forms, f, arInt(n, f));
  }
  function split(x, dec) {
    const m = 10 ** dec;
    const t = Math.round(Math.abs(x) * m);
    return [Math.floor(t / m), t % m];
  }
  function ar(x, code) {
    const c = CUR[code] || CUR.USD;
    const [i, fr] = split(x, c.dec);
    const main = i ? arAmount(i, c.ar, false) : '';
    const sub = fr ? arAmount(fr, c.arf, !!c.fem) : '';
    if (!main && !sub) return 'صفر';
    return 'فقط ' + [main, sub].filter(Boolean).join(' و') + ' لا غير';
  }

  // ---------------- English
  const E1 = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const E10 = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function en999(n) {
    const h = Math.floor(n / 100), r = n % 100;
    const t = r < 20 ? E1[r] : E10[Math.floor(r / 10)] + (r % 10 ? '-' + E1[r % 10] : '');
    return [h ? E1[h] + ' hundred' : '', t].filter(Boolean).join(' ');
  }
  function enInt(n) {
    if (n === 0) return 'zero';
    const parts = [];
    for (const [v, w] of [[1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']]) {
      const g = Math.floor(n / v) % 1000;
      if (g) parts.push(en999(g) + ' ' + w);
    }
    if (n % 1000) parts.push(en999(n % 1000));
    return parts.join(' ');
  }
  function en(x, code) {
    const c = CUR[code] || CUR.USD;
    const [i, fr] = split(x, c.dec);
    const main = i ? `${enInt(i)} ${c.en[i === 1 ? 0 : 1]}` : '';
    const sub = fr ? `${enInt(fr)} ${c.enf[fr === 1 ? 0 : 1]}` : '';
    const s = [main, sub].filter(Boolean).join(' and ') || 'zero';
    return s.charAt(0).toUpperCase() + s.slice(1) + ' only';
  }

  window.FMWords = { ar, en, CUR, arInt, enInt };
})();
