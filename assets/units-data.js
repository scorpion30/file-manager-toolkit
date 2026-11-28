/* Units for the converters (assets/units.js) and for the ready tables that tools/util-pages.mjs writes into the pages.
 * f = how many base units one of this unit is (base: metre, kilogram, square metre, litre, metre per second).
 * Temperature has no factor: units.js converts it with formulas. */
(function (root) {
  const U = {
    length: {
      name: 'Length', base: 'm',
      units: {
        mm: { name: 'Millimetre', sym: 'mm', f: 0.001 },
        cm: { name: 'Centimetre', sym: 'cm', f: 0.01 },
        m: { name: 'Metre', sym: 'm', f: 1 },
        km: { name: 'Kilometre', sym: 'km', f: 1000 },
        in: { name: 'Inch', sym: 'in', f: 0.0254 },
        ft: { name: 'Foot', sym: 'ft', f: 0.3048 },
        yd: { name: 'Yard', sym: 'yd', f: 0.9144 },
        mi: { name: 'Mile', sym: 'mi', f: 1609.344 },
        nmi: { name: 'Nautical mile', sym: 'nmi', f: 1852 },
      },
    },
    mass: {
      name: 'Weight', base: 'kg',
      units: {
        mg: { name: 'Milligram', sym: 'mg', f: 1e-6 },
        g: { name: 'Gram', sym: 'g', f: 0.001 },
        kg: { name: 'Kilogram', sym: 'kg', f: 1 },
        t: { name: 'Tonne', sym: 't', f: 1000 },
        oz: { name: 'Ounce', sym: 'oz', f: 0.028349523125 },
        lb: { name: 'Pound', sym: 'lb', f: 0.45359237 },
        st: { name: 'Stone', sym: 'st', f: 6.35029318 },
        ton: { name: 'US ton', sym: 'US ton', f: 907.18474 },
      },
    },
    area: {
      name: 'Area', base: 'm2',
      units: {
        cm2: { name: 'Square centimetre', sym: 'cm²', f: 1e-4 },
        m2: { name: 'Square metre', sym: 'm²', f: 1 },
        km2: { name: 'Square kilometre', sym: 'km²', f: 1e6 },
        ha: { name: 'Hectare', sym: 'ha', f: 10000 },
        ft2: { name: 'Square foot', sym: 'ft²', f: 0.09290304 },
        yd2: { name: 'Square yard', sym: 'yd²', f: 0.83612736 },
        ac: { name: 'Acre', sym: 'ac', f: 4046.8564224 },
        mi2: { name: 'Square mile', sym: 'mi²', f: 2589988.110336 },
        feddan: { name: 'Feddan', sym: 'feddan', f: 4200.833 },
        qirat: { name: 'Qirat (Egypt)', sym: 'qirat', f: 4200.833 / 24 },
        dunam: { name: 'Dunam', sym: 'dunam', f: 1000 },
      },
    },
    volume: {
      name: 'Volume', base: 'l',
      units: {
        ml: { name: 'Millilitre', sym: 'ml', f: 0.001 },
        l: { name: 'Litre', sym: 'L', f: 1 },
        m3: { name: 'Cubic metre', sym: 'm³', f: 1000 },
        galus: { name: 'US gallon', sym: 'US gal', f: 3.785411784 },
        galuk: { name: 'UK gallon', sym: 'UK gal', f: 4.54609 },
        qt: { name: 'US quart', sym: 'qt', f: 0.946352946 },
        cup: { name: 'US cup', sym: 'cup', f: 0.2365882365 },
        floz: { name: 'US fluid ounce', sym: 'fl oz', f: 0.0295735295625 },
        ft3: { name: 'Cubic foot', sym: 'ft³', f: 28.316846592 },
      },
    },
    temp: {
      name: 'Temperature', base: 'c',
      units: {
        c: { name: 'Celsius', sym: '°C' },
        f: { name: 'Fahrenheit', sym: '°F' },
        k: { name: 'Kelvin', sym: 'K' },
      },
    },
    speed: {
      name: 'Speed', base: 'ms',
      units: {
        kmh: { name: 'Kilometres per hour', sym: 'km/h', f: 1 / 3.6 },
        ms: { name: 'Metres per second', sym: 'm/s', f: 1 },
        mph: { name: 'Miles per hour', sym: 'mph', f: 0.44704 },
        kn: { name: 'Knot', sym: 'kn', f: 1852 / 3600 },
        fts: { name: 'Feet per second', sym: 'ft/s', f: 0.3048 },
      },
    },
  };

  function toBase(cat, unit, v) {
    if (cat === 'temp') return unit === 'c' ? v : unit === 'f' ? (v - 32) * 5 / 9 : v - 273.15;
    return v * U[cat].units[unit].f;
  }
  function fromBase(cat, unit, v) {
    if (cat === 'temp') return unit === 'c' ? v : unit === 'f' ? v * 9 / 5 + 32 : v + 273.15;
    return v / U[cat].units[unit].f;
  }
  const convert = (cat, from, to, v) => fromBase(cat, to, toBase(cat, from, v));

  // Up to 6 decimals, no trailing zeros, Latin digits, thousands separated: 1,234.5678
  function fmt(v) {
    if (!isFinite(v)) return '';
    if (v !== 0 && Math.abs(v) < 0.000001) return v.toPrecision(4);
    const n = Number(v.toPrecision(12));
    return n.toLocaleString('en-US', { maximumFractionDigits: Math.abs(n) >= 1000 ? 2 : 6 });
  }

  root.FMUnits = { U, convert, fmt };
})(typeof window !== 'undefined' ? window : globalThis);
