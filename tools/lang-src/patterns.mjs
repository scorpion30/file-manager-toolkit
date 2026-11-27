// Text with numbers or names in it, per language: [English regular expression, translation with $1, $2...].
// The English side is the same for every language (the list E below); each language gives its translations in the same order.
const r = String.raw;
const E = [
  r`^(\d+) files are ready$`,
  r`^(.+) · done in ([\d.]+) s, on your computer$`,
  r`^(\d+) file\(s\) · (\d+) page\(s\) · (.+)$`,
  r`^(\d+) image\(s\) · (.+)$`,
  r`^Saved (\d+) file\(s\) into “(.*)”\.$`,
  r`^(\d+) of (\d+)$`,
  r`^Page (\d+)$`,
  r`^Downloading the AI model, first time only: (\d+) of (\d+) MB$`,
  r`^Finding the subject: (.*)$`,
  r`^Background removed from (\d+) photos$`,
  r`^(\d+) photo\(s\)$`,
  r`^(\d+) image\(s\)$`,
  r`^(\d+) image\(s\) → (.+)$`,
  r`^(\d+) page\(s\) in the new PDF$`,
  r`^Your PDFs? (?:is|are) (\d+)% smaller$`,
  r`^(\d+) files → 1 PDF of (\d+) pages$`,
  r`^Page (\d+): (.*)$`,
  r`^Comparing page (\d+) of (\d+)…$`,
  r`^(\d+) of (\d+) page\(s\) changed$`,
  r`^Converting: (.*)$`,
  r`^(\d+) files? · (\d+) pages?$`,
  r`^(\d+) pages?$`,
  r`^(\d+) files?$`,
];
const T = {
  fr: ['$1 fichiers sont prêts', '$1 · terminé en $2 s, sur votre ordinateur', '$1 fichier(s) · $2 page(s) · $3', '$1 image(s) · $2',
    '$1 fichier(s) enregistré(s) dans « $2 ».', '$1 sur $2', 'Page $1', 'Téléchargement du modèle d\'IA, première fois seulement : $1 sur $2 Mo',
    'Recherche du sujet : $1', 'Arrière-plan supprimé de $1 photos', '$1 photo(s)', '$1 image(s)', '$1 image(s) → $2', '$1 page(s) dans le nouveau PDF',
    'Vos PDF sont $1 % plus légers', '$1 fichiers → 1 PDF de $2 pages', 'Page $1 : $2', 'Comparaison de la page $1 sur $2…', '$1 page(s) modifiée(s) sur $2', 'Conversion : $1',
    '$1 fichier(s) · $2 page(s)', '$1 page(s)', '$1 fichier(s)'],
  es: ['$1 archivos listos', '$1 · hecho en $2 s, en tu ordenador', '$1 archivo(s) · $2 página(s) · $3', '$1 imagen(es) · $2',
    'Se guardaron $1 archivo(s) en «$2».', '$1 de $2', 'Página $1', 'Descargando el modelo de IA, solo la primera vez: $1 de $2 MB',
    'Buscando el sujeto: $1', 'Fondo eliminado de $1 fotos', '$1 foto(s)', '$1 imagen(es)', '$1 imagen(es) → $2', '$1 página(s) en el nuevo PDF',
    'Tus PDF pesan un $1 % menos', '$1 archivos → 1 PDF de $2 páginas', 'Página $1: $2', 'Comparando la página $1 de $2…', '$1 de $2 página(s) cambiaron', 'Convirtiendo: $1',
    '$1 archivo(s) · $2 página(s)', '$1 página(s)', '$1 archivo(s)'],
  pt: ['$1 arquivos prontos', '$1 · feito em $2 s, no seu computador', '$1 arquivo(s) · $2 página(s) · $3', '$1 imagem(ns) · $2',
    '$1 arquivo(s) salvo(s) em “$2”.', '$1 de $2', 'Página $1', 'Baixando o modelo de IA, só na primeira vez: $1 de $2 MB',
    'Encontrando o objeto: $1', 'Fundo removido de $1 fotos', '$1 foto(s)', '$1 imagem(ns)', '$1 imagem(ns) → $2', '$1 página(s) no novo PDF',
    'Seus PDFs ficaram $1% menores', '$1 arquivos → 1 PDF de $2 páginas', 'Página $1: $2', 'Comparando a página $1 de $2…', '$1 de $2 página(s) mudaram', 'Convertendo: $1',
    '$1 arquivo(s) · $2 página(s)', '$1 página(s)', '$1 arquivo(s)'],
  id: ['$1 file siap', '$1 · selesai dalam $2 dtk, di komputer Anda', '$1 file · $2 halaman · $3', '$1 gambar · $2',
    '$1 file disimpan ke “$2”.', '$1 dari $2', 'Halaman $1', 'Mengunduh model AI, hanya pertama kali: $1 dari $2 MB',
    'Mencari objek utama: $1', 'Latar belakang dihapus dari $1 foto', '$1 foto', '$1 gambar', '$1 gambar → $2', '$1 halaman di PDF baru',
    'PDF Anda $1% lebih kecil', '$1 file → 1 PDF berisi $2 halaman', 'Halaman $1: $2', 'Membandingkan halaman $1 dari $2…', '$1 dari $2 halaman berubah', 'Mengonversi: $1',
    '$1 file · $2 halaman', '$1 halaman', '$1 file'],
  tr: ['$1 dosya hazır', '$1 · $2 sn\'de bitti, kendi bilgisayarınızda', '$1 dosya · $2 sayfa · $3', '$1 görsel · $2',
    '$1 dosya “$2” klasörüne kaydedildi.', '$1 / $2', 'Sayfa $1', 'Yapay zekâ modeli indiriliyor, yalnızca ilk sefer: $1 / $2 MB',
    'Nesne bulunuyor: $1', '$1 fotoğrafın arka planı kaldırıldı', '$1 fotoğraf', '$1 görsel', '$1 görsel → $2', 'Yeni PDF\'te $1 sayfa',
    'PDF\'leriniz %$1 küçüldü', '$1 dosya → $2 sayfalık 1 PDF', 'Sayfa $1: $2', 'Sayfa $1 / $2 karşılaştırılıyor…', '$2 sayfadan $1 tanesi değişti', 'Dönüştürülüyor: $1',
    '$1 dosya · $2 sayfa', '$1 sayfa', '$1 dosya'],
  hi: ['$1 फ़ाइलें तैयार हैं', '$1 · $2 सेकंड में हो गया, आपके कंप्यूटर पर', '$1 फ़ाइल · $2 पेज · $3', '$1 इमेज · $2',
    '$1 फ़ाइल “$2” में सेव हुईं।', '$2 में से $1', 'पेज $1', 'AI मॉडल डाउनलोड हो रहा है, सिर्फ़ पहली बार: $2 में से $1 MB',
    'मुख्य चीज़ ढूँढ़ी जा रही है: $1', '$1 फ़ोटो का बैकग्राउंड हटाया गया', '$1 फ़ोटो', '$1 इमेज', '$1 इमेज → $2', 'नई PDF में $1 पेज',
    'आपकी PDF $1% छोटी हो गईं', '$1 फ़ाइलें → $2 पेज की 1 PDF', 'पेज $1: $2', 'पेज $1 / $2 की तुलना हो रही है…', '$2 में से $1 पेज बदले', 'कन्वर्ट हो रहा है: $1',
    '$1 फ़ाइल · $2 पेज', '$1 पेज', '$1 फ़ाइल'],
};
const out = {};
for (const [lang, list] of Object.entries(T)) {
  if (list.length !== E.length) throw new Error(`patterns.mjs: ${lang} has ${list.length} of ${E.length}`);
  out[lang] = E.map((re, i) => [re, list[i]]);
}
export default out;
