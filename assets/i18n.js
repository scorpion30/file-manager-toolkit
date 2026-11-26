/* English / Arabic switch. Loaded in <head>: sets the page direction before it paints,
 * then translates text, placeholders and titles - including text the tools create later -
 * using an English-to-Arabic dictionary. File names and user data are never translated. */
(() => {
  'use strict';
  const KEY = 'fm-lang';
  const root = document.documentElement;

  const AR = {
    // ----- home: first screen -----
    'Extract file names to Excel': 'استخراج أسماء الملفات في Excel',
    'Pick a folder': 'اختار الفولدر',
    'Export it': 'صدّر',
    'Excel is ready': 'الإكسل جاهز',
    'Box the drawing number': 'حدّد رقم اللوحة',
    'Check the names': 'راجع الأسماء',
    'Rename them': 'سمّي الملفات',
    'Box the values': 'حدّد القيم',
    'Read every PDF': 'بيقرا كل PDF',
    'Download Excel': 'نزّل الإكسل',
    'Type the change': 'اكتب التعديل',
    'See the preview': 'شوف المعاينة',
    '✓ Free': '✓ مجاني',
    '✓ No sign-up': '✓ بدون تسجيل',
    '✓ Files stay on your computer': '✓ ملفاتك ما بتخرجش من جهازك',
    'Hours renaming and listing drawings by hand?': 'ساعات بتضيع في تسمية الرسومات وحصرها يدويًا؟',
    'Do it in one click': 'خلّصها بضغطة واحدة',
    ', without uploading a single file.': ' من غير ما ترفع ولا ملف.',
    'Tools made for architects and engineers. They run in your browser, on your own computer.': 'أدوات معمولة للمعماريين والمهندسين، بتشتغل في المتصفح على جهازك أنت.',
    'Rename PDFs from the title block': 'تسمية ملفات PDF من الـ Title Block',
    'Reads the drawing number and title from each sheet and names the file after them.': 'بتقرا رقم اللوحة واسمها من كل شيت وتسمي الملف بيهم.',
    'Hundreds of sheets renamed in seconds': 'مئات اللوحات بتتسمّى في ثواني',
    'Drawing list from the title blocks': 'قائمة اللوحات من الـ Title Block',
    'Mark the number, title and revision once. It reads them from every PDF into Excel.': 'حدّد مكان الرقم والاسم والـ Revision مرة واحدة، وهي تقراهم من كل PDF في شيت Excel.',
    'A ready drawing register, revisions included': 'Drawing register جاهز بالـ Revisions',
    'Folders': 'فولدرات',
    'List folders to Excel': 'أسماء ملفات الفولدرات في Excel',
    'Every file in a folder and its subfolders, a tab per folder, and a count of each file type.': 'كل الملفات في الفولدر والفولدرات اللي جواه، تاب لكل فولدر، وعدد كل نوع ملف.',
    'Thousands of files listed in one click': 'آلاف الملفات في قائمة بضغطة واحدة',
    'Rename hundreds of files': 'إعادة تسمية مئات الملفات',
    'Add a prefix, replace a word or fix the revision in every name at once, with undo.': 'زوّد بادئة، غيّر كلمة، أو صحّح الـ Revision في كل الأسماء مرة واحدة، مع إمكانية التراجع.',
    'See every new name before you apply': 'بتشوف كل اسم جديد قبل ما تطبّق',
    'Open the tool': 'افتح الأداة',
    '▷ Example': '▷ مثال',
    '+ 7 more tools:': '+ 7 أدوات تانية:',
    'merge and split PDF, MIDP check, comment sheet and more.': 'دمج وتقسيم PDF، مراجعة MIDP، شيت التعليقات وغيرها.',
    'See all tools ↓': 'كل الأدوات ↓',
    // ----- example files: rename / title block / PDF to Excel -----
    'No files with you? Use an example folder of 12 drawings with messy names.': 'مش معاك ملفات دلوقتي؟ جرّب على فولدر مثال فيه 12 رسمة بأسماء ملخبطة.',
    'An example folder is open.': 'فتحنالك فولدر مثال.',
    'These are made-up files. The boxes are already filled in: press': 'دي ملفات وهمية، والخانات متعبّية جاهزة: دوس',
    'to add the project code, then': 'عشان تضيف كود المشروع، وبعدين',
    'to fix the revision. Watch the new names, then press': 'عشان تصحّح الـ Revision. بص على الأسماء الجديدة، وبعدين دوس',
    'The project code was added to every name, and the revision was fixed in all of them': 'كود المشروع اتضاف لكل الأسماء، والـ Revision اتصحّح فيهم كلهم',
    'On your own folder, the files are renamed right where they are, and you can undo': 'على الفولدر بتاعك، الملفات بتتسمّى في مكانها، وتقدر تتراجع',
    'You see every new name before anything changes': 'بتشوف كل اسم جديد قبل ما أي حاجة تتغير',
    'Now rename your own files': 'دلوقتي جرّبها على ملفاتك',
    'No drawings with you? Use 8 example drawings exported as Sheet_001.pdf, Sheet_002.pdf…': 'مش معاك رسومات دلوقتي؟ جرّب على 8 لوحات مثال متصدّرة بأسماء Sheet_001.pdf و Sheet_002.pdf…',
    'Your turn:': 'دورك:',
    'drag a box around the drawing number': 'اسحب مربع حوالين رقم اللوحة',
    'at the bottom right of the drawing. Then press': 'تحت على اليمين في الرسمة. وبعدين دوس',
    'Mark it for me': 'حدّده إنت',
    'Mark them for me': 'حدّدهم إنت',
    'The drawing number was read from every PDF: no typing, no copy and paste': 'رقم اللوحة اتقرا من كل PDF: من غير كتابة ولا نسخ ولصق',
    'Now rename your own drawings': 'دلوقتي جرّبها على رسوماتك',
    'No drawings with you? Use 8 example drawings and make a drawing register from them.': 'مش معاك رسومات دلوقتي؟ جرّب على 8 لوحات مثال واعمل منها Drawing register.',
    'in the title block at the bottom right, drag a box around the drawing number': 'في الـ Title Block تحت على اليمين، اسحب مربع حوالين رقم اللوحة',
    ', then the title, then the revision': '، وبعدين اسم اللوحة، وبعدين الـ Revision',
    '. Then press': '. وبعدين دوس',
    'Every drawing was read.': 'كل اللوحات اتقرت.',
    'Check the table, then press': 'راجع الجدول، وبعدين دوس',
    'to get your drawing register.': 'وهتاخد الـ Drawing register بتاعك.',
    'Your drawing register is ready. Open it from your downloads.': 'الـ Drawing register جاهز. افتحه من التنزيلات.',
    'The values are read from the title block of every PDF: no typing': 'القيم اتقرت من الـ Title Block في كل PDF: من غير كتابة',
    'Works the same on hundreds of drawings, and can add to your own Excel sheet': 'بتشتغل بنفس الطريقة على مئات اللوحات، وممكن تضيف على شيت Excel بتاعك',
    'Now read your own drawings': 'دلوقتي جرّبها على رسوماتك',
    'Could not load the example files. Check your connection and try again.': 'معرفناش نحمّل الملفات الجاهزة. اتأكد من النت وجرّب تاني.',
    // ----- example files -----
    'Drop a folder here, or select one': 'اسحب الفولدر هنا، أو اختاره',
    '📋 Use example files': '📋 جرّب بملفات جاهزة',
    'No files with you? Use an example project submission: 4 consultants, about 100 files.': 'مش معاك ملفات دلوقتي؟ جرّب على Submission مشروع مثال: 4 استشاريين وحوالي 100 ملف.',
    'An example project is open.': 'فتحنالك مشروع مثال.',
    'These are made-up files, already listed below. Press': 'دي ملفات وهمية، وقايمتها ظاهرة تحت. دوس',
    'to get the Excel file.': 'وهتاخد ملف الإكسل.',
    'Your Excel file is ready. Open it from your downloads.': 'ملف الإكسل جاهز. افتحه من التنزيلات.',
    'A sheet for each folder. Click a folder name in the Summary to jump to it': 'شيت لكل فولدر. دوس على اسم الفولدر في الملخص يوديك عليه',
    'Now list your own folder': 'دلوقتي جرّبها على الفولدر بتاعك',
    'Send the link to myself on WhatsApp': 'ابعت اللينك لنفسي على واتساب',
    'Copy the link': 'انسخ اللينك',
    'Link copied.': 'اتنسخ اللينك.',
    'Your own folders work on a computer, in Chrome or Edge. Free, no sign-up.': 'فولدراتك الحقيقية بتشتغل من الكمبيوتر على Chrome أو Edge. مجاني ومن غير تسجيل.',
    'Free, no sign-up. Your files stay on your computer.': 'مجاني ومن غير تسجيل. ملفاتك ما بتخرجش من جهازك.',
    'Drop a folder, not a file. Or use Select Folder.': 'اسحب فولدر مش ملف، أو دوس "اختر فولدر".',
    // ----- header / footer / shared -----
    'File tools': 'أدوات الملفات',
    'PDF tools': 'أدوات PDF',
    'All tools': 'كل الأدوات',
    '♥ Donate': '♥ تبرّع',
    'Donate': 'تبرّع',
    'Source code': 'الكود المصدري',
    'About': 'عن الموقع',
    'Free file and PDF tools that run in your browser.': 'أدوات مجانية للملفات و PDF تعمل داخل متصفحك.',
    '© File Manager Toolkit · All processing happens locally in your browser.': '© File Manager Toolkit · كل المعالجة تتم على جهازك داخل المتصفح.',
    'Switch light or dark mode': 'تبديل الوضع الفاتح أو الداكن',
    'Light mode': 'الوضع الفاتح',
    'Dark mode': 'الوضع الداكن',
    'Cancel': 'إلغاء',
    'OK': 'موافق',
    'Confirm': 'تأكيد',
    'Change': 'تغيير',
    'Clear': 'مسح',
    'Clear all': 'مسح الكل',
    'Remove': 'إزالة',
    'Move up': 'تحريك لأعلى',
    'Move down': 'تحريك لأسفل',
    'Drag to reorder': 'اسحب لتغيير الترتيب',
    'Edit name': 'تعديل الاسم',
    'Draw again': 'ارسم مرة أخرى',
    'Zoom in': 'تكبير',
    'Zoom out': 'تصغير',
    'Fit': 'ملء العرض',
    'Add a PDF to see it here': 'أضف ملف PDF ليظهر هنا',
    'Drag on the page to draw the area. Esc to cancel.': 'اسحب على الصفحة لرسم المنطقة. Esc للإلغاء.',
    'Add a PDF first.': 'أضف ملف PDF أولاً.',
    'Select Folder': 'اختر فولدر',
    '↻ Refresh': '↻ تحديث',
    'Read the folder again': 'قراءة الفولدر من جديد',
    'Reading folder…': 'جارٍ قراءة الفولدر…',
    'Current folder only': 'الفولدر الحالي فقط',
    'All subfolders': 'كل الفولدرات الفرعية',
    'Select subfolders…': 'اختيار فولدرات فرعية…',
    'Which folders to include': 'الفولدرات المشمولة',
    'File types:': 'أنواع الملفات:',
    'All': 'الكل',
    'none': 'لا شيء',
    '(no extension)': '(بدون امتداد)',
    'Select folders': 'اختر الفولدرات',
    'Select subfolders': 'اختر الفولدرات الفرعية',
    'Files in the checked folders (and the folders inside them) will be included.': 'سيتم تضمين الملفات في الفولدرات المحددة (والفولدرات التي بداخلها).',
    'Files in the checked folders (and the folders inside them) will be shown.': 'ستظهر الملفات في الفولدرات المحددة (والفولدرات التي بداخلها).',
    'No folders were selected.': 'لم يتم اختيار أي فولدر.',
    'This folder has no subfolders.': 'هذا الفولدر لا يحتوي على فولدرات فرعية.',
    'Drop PDF files here.': 'اسحب ملفات PDF هنا.',
    'Could not load a required library. Check your internet connection.': 'تعذر تحميل مكتبة مطلوبة. تأكد من اتصالك بالإنترنت.',
    'Not a valid PDF file': 'ملف PDF غير صالح',
    'This PDF is password-protected': 'ملف PDF هذا محمي بكلمة مرور',
    'Permission to edit the folder was not given.': 'لم يتم منح الإذن بتعديل الفولدر.',
    'Excel file downloaded.': 'تم تنزيل ملف Excel.',
    'No files to export.': 'لا توجد ملفات للتصدير.',
    'Export to Excel': 'تصدير إلى Excel',
    'Preparing…': 'جارٍ التجهيز…',
    'Saving…': 'جارٍ الحفظ…',
    'Zipping…': 'جارٍ الضغط…',
    'Create ZIP': 'إنشاء ZIP',
    'No PDF files in that folder.': 'لا توجد ملفات PDF في هذا الفولدر.',
    'Add PDF files first.': 'أضف ملفات PDF أولاً.',
    'or': 'أو',
    'on a computer.': 'على الكمبيوتر.',
    'Done': 'تم',
    'error': 'خطأ',
    'Yes': 'نعم',
    'No': 'لا',
    'Match': 'تطابق',
    'File': 'الملف',
    'Results': 'النتائج',
    'Page': 'الصفحة',
    'Page to read': 'الصفحة المطلوب قراءتها',
    'Name': 'الاسم',
    'Ext': 'الامتداد',
    'Folder': 'الفولدر',
    'Size': 'الحجم',
    'Modified': 'تاريخ التعديل',
    'From': 'من',
    'To': 'إلى',
    'Into': 'إلى',
    'Moved': 'تم نقل',
    'Copied': 'تم نسخ',
    'file(s).': 'ملف.',
    'file(s)?': 'ملف؟',
    'file(s). Log saved as': 'ملف. تم حفظ السجل باسم',

    // ----- home -----
    'Free · Private · No sign-up': 'مجاني · خاص · بدون تسجيل',
    'Handle thousands of files': 'تعامل مع آلاف الملفات',
    'in seconds': 'في ثوانٍ',
    'Rename, list and organize whole folders. Merge, split, read and edit PDFs. Made for engineers, architects and anyone who lives in folders full of drawings.':
      'أعد تسمية الفولدرات بالكامل، واستخرج قوائمها ونظّمها. ادمج ملفات PDF وقسّمها واقرأها وعدّلها. مصمم للمهندسين والمعماريين وكل من يعمل وسط فولدرات مليئة باللوحات.',
    'Explore the tools': 'استكشف الأدوات',
    'Rename files now': 'أعد تسمية ملفاتك الآن',
    'Files never leave your device': 'ملفاتك لا تغادر جهازك',
    '100% free': 'مجاني 100%',
    'Nothing to install': 'لا يحتاج تثبيت',
    'Original': 'الاسم الأصلي',
    'New name': 'الاسم الجديد',
    '→': '←',
    '4 files ready': '4 ملفات جاهزة',
    'Apply Rename': 'تطبيق إعادة التسمية',
    'Summary · 12 folders · 1,284 files': 'ملخص · 12 فولدر · 1,284 ملف',
    'Work on whole folders: thousands of files at once, including folders inside folders.': 'اعمل على فولدرات كاملة: آلاف الملفات مرة واحدة، حتى الفولدرات داخل الفولدرات.',
    'Built on the same PDF engine as professional desktop software. Works with CAD and Revit exports.': 'مبني على نفس محرك PDF المستخدم في البرامج الاحترافية. يعمل مع ملفات CAD و Revit.',
    'Open tool →': 'افتح الأداة ←',
    'Rename Files': 'إعادة تسمية الملفات',
    'Prefix, suffix, find & replace, edit any name, delete, and undo.': 'إضافة بادئة ولاحقة، بحث واستبدال، تعديل أي اسم، حذف، وتراجع.',
    'Files to Excel': 'قائمة الملفات إلى Excel',
    'List every file in a folder tree. A sheet per folder or per file type, with a summary.': 'قائمة بكل الملفات في الفولدر والفولدرات التي بداخله. شيت لكل فولدر أو لكل نوع، مع ملخص.',
    'Organize Files': 'تنظيم الملفات',
    'Move or copy files into folders by type (PDF, DWG…) or by a word in the name.': 'انقل أو انسخ الملفات إلى فولدرات حسب النوع (PDF، DWG…) أو حسب كلمة في الاسم.',
    'New': 'جديد',
    'Rename from Title Block': 'التسمية من الـ Title Block',
    'Read the drawing number and title from each PDF and name the file after them.': 'اقرأ رقم اللوحة وعنوانها من كل PDF وسمِّ الملف بهما.',
    'Merge PDF': 'دمج PDF',
    'Combine several PDFs into one, in the order you choose.': 'ادمج عدة ملفات PDF في ملف واحد بالترتيب الذي تختاره.',
    'Split PDF': 'تقسيم PDF',
    'Take page ranges like 1-3, 5, 8-10 into separate files, or every page on its own.': 'استخرج نطاقات صفحات مثل 1-3، 5، 8-10 في ملفات منفصلة، أو كل صفحة في ملف.',
    'OCR · Arabic & English': 'OCR · عربي وإنجليزي',
    'PDF to Excel': 'PDF إلى Excel',
    'Draw boxes on a drawing and read the same boxes from every PDF into a spreadsheet.': 'ارسم مربعات على لوحة واقرأ نفس المربعات من كل ملفات PDF إلى جدول Excel.',
    'Edit PDF Text': 'تعديل نص PDF',
    'Replace a value inside an area, like a title block field, across many PDFs at once.': 'استبدل قيمة داخل منطقة، مثل خانة في الـ Title Block، في ملفات PDF كثيرة مرة واحدة.',
    'How it works': 'طريقة العمل',
    'Pick your files': 'اختر ملفاتك',
    'Choose a folder or drop PDFs. Your browser opens them on your own computer.': 'اختر فولدر أو اسحب ملفات PDF. المتصفح يفتحها على جهازك أنت.',
    'Preview the result': 'عاين النتيجة',
    'See every new name, sheet or page before anything changes.': 'شاهد كل اسم جديد أو شيت أو صفحة قبل أن يتغير أي شيء.',
    'Apply or download': 'طبّق أو نزّل',
    'Rename in place, save to a folder, or download the result.': 'أعد التسمية في مكانها، أو احفظ في فولدر، أو نزّل النتيجة.',
    'Private by design': 'خصوصية كاملة',
    'There is no server that receives your files. Everything is processed inside your browser.': 'لا يوجد سيرفر يستقبل ملفاتك. كل شيء تتم معالجته داخل متصفحك.',
    'Made for drawings': 'مصمم للوحات الهندسية',
    'Reads title blocks, rotated text and scanned sheets. Tested with CAD and Revit PDF exports.': 'يقرأ الـ Title Block والنصوص المائلة واللوحات الممسوحة ضوئياً. تمت تجربته على ملفات CAD و Revit.',
    'Free, no limits': 'مجاني بلا حدود',
    'No account, no watermark, no daily limit. If it saves you time, you can support it with a donation.': 'بدون حساب، بدون علامة مائية، بدون حد يومي. إذا وفّر لك وقتاً يمكنك دعمه بتبرع.',
    'Questions': 'أسئلة شائعة',
    'Are my files uploaded anywhere?': 'هل يتم رفع ملفاتي إلى أي مكان؟',
    'No. The tools run in your browser. Files are read from your computer and the results are saved back to it.': 'لا. الأدوات تعمل داخل متصفحك. الملفات تُقرأ من جهازك والنتائج تُحفظ عليه.',
    'Which browser should I use?': 'أي متصفح أستخدم؟',
    'Google Chrome or Microsoft Edge on a computer can rename, move and delete files directly in your folders. Other browsers work too, and give you the result as a download.':
      'Google Chrome أو Microsoft Edge على الكمبيوتر يستطيعان إعادة التسمية والنقل والحذف مباشرة في فولدراتك. المتصفحات الأخرى تعمل أيضاً وتعطيك النتيجة كملف للتنزيل.',
    'Can it handle big folders?': 'هل يتعامل مع فولدرات كبيرة؟',
    "Yes, thousands of files are fine. Very large PDFs depend on your computer's memory.": 'نعم، آلاف الملفات لا مشكلة. ملفات PDF الضخمة جداً تعتمد على ذاكرة جهازك.',
    'Does OCR work in Arabic?': 'هل يعمل الـ OCR باللغة العربية؟',
    'Yes. PDF to Excel reads real PDF text directly, and uses OCR in English, Arabic or both when an area is scanned.': 'نعم. أداة PDF إلى Excel تقرأ نص الـ PDF مباشرة، وتستخدم OCR بالإنجليزي أو العربي أو الاثنين عندما تكون المنطقة ممسوحة ضوئياً.',
    'Saved you an afternoon?': 'وفّر عليك ساعات من الشغل؟',
    'File Manager Toolkit is free and stays free. A small donation keeps new tools coming.': 'File Manager Toolkit مجاني وسيظل مجانياً. تبرع صغير يساعد على إضافة أدوات جديدة.',
    '♥ Donate with PayPal': '♥ تبرّع عبر PayPal',

    // ----- rename -----
    'Pick a folder, preview the new names, then apply. Nothing is uploaded.': 'اختر فولدر، عاين الأسماء الجديدة، ثم طبّق. لا يتم رفع أي شيء.',
    "This browser can't rename files directly on your computer.": 'هذا المتصفح لا يستطيع إعادة تسمية الملفات مباشرة على جهازك.',
    'You can still preview the new names, export to Excel, and download the renamed files as a ZIP. For direct renaming, open this page in':
      'لا يزال بإمكانك معاينة الأسماء الجديدة والتصدير إلى Excel وتنزيل الملفات المعاد تسميتها كملف ZIP. لإعادة التسمية مباشرة افتح هذه الصفحة في',
    'Select a folder to start': 'اختر فولدر للبدء',
    'Your browser will ask for permission to view and edit files in that folder.': 'سيطلب المتصفح إذناً لعرض وتعديل الملفات في هذا الفولدر.',
    'Your browser will ask you to confirm access to the folder’s files.': 'سيطلب منك المتصفح تأكيد الوصول إلى ملفات الفولدر.',
    'Prefix / Suffix': 'بادئة / لاحقة',
    'Only names containing': 'فقط الأسماء التي تحتوي على',
    '(optional)': '(اختياري)',
    'Prefix': 'بادئة',
    'Suffix': 'لاحقة',
    'e.g. 2026_': 'مثال: 2026_',
    'e.g. _final': 'مثال: _final',
    'Apply': 'تطبيق',
    'Find / Replace': 'بحث / استبدال',
    'Find': 'بحث',
    'text to find': 'النص المطلوب',
    'Replace with': 'استبدال بـ',
    '(empty = remove)': '(فارغ = حذف)',
    'Match case': 'مطابقة حالة الأحرف',
    'Replace': 'استبدال',
    'Delete files': 'حذف الملفات',
    'Show names containing': 'عرض الأسماء التي تحتوي على',
    'Select all': 'تحديد الكل',
    'Unselect all': 'إلغاء التحديد',
    'Delete': 'حذف',
    'Discard changes': 'تجاهل التغييرات',
    'Undo last rename': 'تراجع عن آخر تسمية',
    'Select all shown': 'تحديد كل المعروض',
    'Original name': 'الاسم الأصلي',
    'No files match the current filters.': 'لا توجد ملفات مطابقة للفلاتر الحالية.',
    'Files:': 'الملفات:',
    'Shown:': 'المعروض:',
    'Selected:': 'المحدد:',
    'Pending renames:': 'تسميات معلّقة:',
    'Problems:': 'مشاكل:',
    'Filtered by name · clear ✕': 'مفلتر بالاسم · مسح ✕',
    'Type a prefix or a suffix first.': 'اكتب بادئة أو لاحقة أولاً.',
    'No files to update.': 'لا توجد ملفات للتعديل.',
    'Type the text to find first.': 'اكتب النص المطلوب أولاً.',
    'Fix the names marked in red first.': 'صحّح الأسماء المعلّمة بالأحمر أولاً.',
    'file(s) with problems will be skipped.': 'ملف به مشاكل سيتم تخطيه.',
    'Rename files': 'إعادة تسمية الملفات',
    'Renaming…': 'جارٍ إعادة التسمية…',
    'Undo last rename?': 'التراجع عن آخر تسمية؟',
    'Undo': 'تراجع',
    'The file may be open in another program, or the folder is read-only.': 'قد يكون الملف مفتوحاً في برنامج آخر، أو أن الفولدر للقراءة فقط.',
    'Download renamed files': 'تنزيل الملفات المعاد تسميتها',
    'Download renamed (ZIP)': 'تنزيل الملفات المعاد تسميتها (ZIP)',
    "Your browser can't rename files in place, so a ZIP will be created with": 'متصفحك لا يستطيع إعادة التسمية في المكان، لذلك سيتم إنشاء ملف ZIP يحتوي على',
    'For direct renaming, use Google Chrome or Microsoft Edge on a computer.': 'لإعادة التسمية مباشرة استخدم Google Chrome أو Microsoft Edge على الكمبيوتر.',
    'Files are deleted permanently. They do not go to the Recycle Bin, and this cannot be undone.': 'سيتم حذف الملفات نهائياً. لن تذهب إلى سلة المحذوفات ولا يمكن التراجع.',
    'Delete permanently': 'حذف نهائي',
    'Discard pending changes?': 'تجاهل التغييرات المعلّقة؟',
    'You have new names that were not applied yet.': 'لديك أسماء جديدة لم يتم تطبيقها بعد.',
    'Discard': 'تجاهل',
    'That folder is empty.': 'هذا الفولدر فارغ.',
    'Name cannot be empty': 'الاسم لا يمكن أن يكون فارغاً',
    'Name cannot contain \\ / : * ? " < > |': 'الاسم لا يمكن أن يحتوي على \\ / : * ? " < > |',
    'Name cannot end with a space or a dot': 'الاسم لا يمكن أن ينتهي بمسافة أو نقطة',
    'This name is reserved by Windows': 'هذا الاسم محجوز في ويندوز',
    'Name is too long': 'الاسم طويل جداً',
    'Another file in this folder has the same name': 'يوجد ملف آخر في هذا الفولدر بنفس الاسم',

    // ----- files to excel -----
    'List every file in a folder, including folders inside folders, and export the list to Excel.': 'اعرض كل ملف في الفولدر، حتى داخل الفولدرات الفرعية، وصدّر القائمة إلى Excel.',
    'Select a folder to list': 'اختر الفولدر المطلوب',
    'The folder is only read. Nothing is changed or uploaded.': 'يتم قراءة الفولدر فقط. لا يتم تغيير أو رفع أي شيء.',
    'Filter': 'فلتر',
    'Name contains': 'الاسم يحتوي على',
    'Folder location on your computer (optional)': 'مكان الفولدر على جهازك (اختياري)',
    'e.g. D:\\Projects': 'مثال: D:\\Projects',
    'Excel sheets': 'شيتات Excel',
    'Summary (count of each file type per folder)': 'ملخص (عدد كل نوع ملفات في كل فولدر)',
    'One sheet with all files': 'شيت واحد بكل الملفات',
    'Also split into sheets by': 'وتقسيم إلى شيتات حسب',
    'Folder (a sheet for each folder)': 'الفولدر (شيت لكل فولدر)',
    'File type (a sheet for each type)': 'نوع الملف (شيت لكل نوع)',
    "Don't split": 'بدون تقسيم',
    'Columns': 'الأعمدة',
    'Date modified': 'تاريخ التعديل',
    'Full path': 'المسار الكامل',
    'Folders:': 'الفولدرات:',
    'Total size:': 'الحجم الكلي:',
    'Reading sizes…': 'جارٍ قراءة الأحجام…',
    'Reading file details…': 'جارٍ قراءة بيانات الملفات…',
    'Choose at least one kind of sheet.': 'اختر نوعاً واحداً على الأقل من الشيتات.',

    // ----- organize -----
    'Put files into folders by type (PDF, DWG, JPG…) or by a word in their name.': 'ضع الملفات في فولدرات حسب النوع (PDF، DWG، JPG…) أو حسب كلمة في اسمها.',
    "This browser can't move files on your computer.": 'هذا المتصفح لا يستطيع نقل الملفات على جهازك.',
    "You'll get a ZIP with the organized folders instead. To move or copy files directly, open this page in": 'ستحصل بدلاً من ذلك على ملف ZIP بالفولدرات المنظمة. لنقل أو نسخ الملفات مباشرة افتح هذه الصفحة في',
    'Select the folder to organize': 'اختر الفولدر المطلوب تنظيمه',
    'Your browser will ask for permission to edit files in that folder.': 'سيطلب المتصفح إذناً لتعديل الملفات في هذا الفولدر.',
    'Which files': 'أي ملفات',
    'Name contains (optional, comma-separated, all must match)': 'الاسم يحتوي على (اختياري، افصل بفاصلة، ويجب أن تتطابق كلها)',
    'e.g. A-1, plan': 'مثال: A-1, plan',
    'Put them in': 'ضعها في',
    'Folder name (optional)': 'اسم الفولدر (اختياري)',
    'Empty = a folder per type: PDF, DWG…': 'فارغ = فولدر لكل نوع: PDF، DWG…',
    'Inside the selected folder': 'داخل الفولدر المختار',
    'Another folder:': 'فولدر آخر:',
    'Choose…': 'اختر…',
    'Action': 'الإجراء',
    'Move files': 'نقل الملفات',
    'Copy files (keep the originals)': 'نسخ الملفات (مع الاحتفاظ بالأصل)',
    'Copy files': 'نسخ الملفات',
    'Save a log file of what was done': 'حفظ ملف سجل بما تم',
    'Start Organizing': 'ابدأ التنظيم',
    'No files match. Check the file types and the name filter.': 'لا توجد ملفات مطابقة. راجع أنواع الملفات وفلتر الاسم.',
    'Files to move:': 'ملفات للنقل:',
    'Files to copy:': 'ملفات للنسخ:',
    'Into folders:': 'إلى فولدرات:',
    '(choose a folder)': '(اختر فولدر)',
    'Download organized (ZIP)': 'تنزيل الملفات المنظمة (ZIP)',
    'Download organized files': 'تنزيل الملفات المنظمة',
    "Your browser can't move files on your computer, so a ZIP will be created with": 'متصفحك لا يستطيع نقل الملفات على جهازك، لذلك سيتم إنشاء ملف ZIP يحتوي على',
    'file(s) sorted into folders.': 'ملف مرتبة في فولدرات.',
    'Choose the destination folder first.': 'اختر فولدر الوجهة أولاً.',
    'Choosing another folder needs Chrome or Edge.': 'اختيار فولدر آخر يحتاج Chrome أو Edge.',
    'Finished with some problems': 'انتهى مع بعض المشاكل',
    'The folder name cannot contain \\ / : * ? " < > | or end with a space or dot.': 'اسم الفولدر لا يمكن أن يحتوي على \\ / : * ? " < > | أو ينتهي بمسافة أو نقطة.',

    // ----- merge / split -----
    'Combine PDFs into one file, in the order you want.': 'ادمج ملفات PDF في ملف واحد بالترتيب الذي تريده.',
    'Select PDF files': 'اختر ملفات PDF',
    'or drop them here': 'أو اسحبها إلى هنا',
    'Add PDF files': 'إضافة ملفات PDF',
    'Add a folder': 'إضافة فولدر',
    '+ Add files': '+ إضافة ملفات',
    'Sort A→Z': 'ترتيب أبجدي',
    'Drag the rows, or use the arrows, to set the order.': 'اسحب الصفوف أو استخدم الأسهم لتحديد الترتيب.',
    'File name': 'اسم الملف',
    'Add at least 2 PDF files.': 'أضف ملفين PDF على الأقل.',
    'Take pages out of a PDF into separate files.': 'استخرج صفحات من PDF إلى ملفات منفصلة.',
    'Select a PDF file': 'اختر ملف PDF',
    'or drop it here': 'أو اسحبه إلى هنا',
    'Choose PDF': 'اختر PDF',
    'Choose another PDF': 'اختر PDF آخر',
    'How to split': 'طريقة التقسيم',
    'By page ranges (a file for each range)': 'حسب نطاقات الصفحات (ملف لكل نطاق)',
    'Every page as its own file': 'كل صفحة في ملف مستقل',
    'Pick pages into ONE new file': 'اختر صفحات في ملف واحد جديد',
    'Pages': 'الصفحات',
    'e.g. 1-3,5,8-10': 'مثال: 1-3,5,8-10',
    'Save': 'الحفظ',
    'Download (several files come as one ZIP)': 'تنزيل (عدة ملفات تأتي في ZIP واحد)',
    'Save into a folder on my computer': 'حفظ في فولدر على جهازي',
    'Files are named like the old app:': 'تتم تسمية الملفات مثل البرنامج القديم:',
    'Type the pages to take, e.g. 1-3,5,8-10': 'اكتب الصفحات المطلوبة، مثال: 1-3,5,8-10',
    'Saving into a folder needs Chrome or Edge. Choose “Download”.': 'الحفظ في فولدر يحتاج Chrome أو Edge. اختر "تنزيل".',
    'Saving into a folder needs Chrome or Edge.': 'الحفظ في فولدر يحتاج Chrome أو Edge.',

    // ----- PDF to Excel -----
    'Draw boxes on one PDF, then read the text in the same boxes from all your PDFs into Excel.': 'ارسم مربعات على ملف PDF واحد، ثم اقرأ النص في نفس المربعات من كل ملفاتك إلى Excel.',
    '1 · PDF files': '1 · ملفات PDF',
    'Add PDFs': 'إضافة PDF',
    'Add folder': 'إضافة فولدر',
    'Click a file to show it on the right. Drop PDFs anywhere on this page.': 'اضغط على ملف لعرضه. يمكنك سحب ملفات PDF إلى أي مكان في الصفحة.',
    'Click a file to show it on the right.': 'اضغط على ملف لعرضه.',
    '2 · Areas to read': '2 · المناطق المطلوب قراءتها',
    '+ Draw area': '+ رسم منطقة',
    'Clear areas': 'مسح المناطق',
    'Each area becomes a column in Excel. Rename the column here. Zoom with the mouse wheel.': 'كل منطقة تصبح عموداً في Excel. غيّر اسم العمود هنا. التكبير بعجلة الماوس.',
    '3 · Read the text': '3 · قراءة النص',
    'Real PDF text is read directly. If an area has no text (scanned or outlined), OCR is used.': 'نص الـ PDF الحقيقي يُقرأ مباشرة. إذا لم يوجد نص في المنطقة (ممسوحة ضوئياً أو مرسومة) يتم استخدام OCR.',
    'OCR language': 'لغة OCR',
    'English': 'الإنجليزية',
    'Arabic': 'العربية',
    'English + Arabic': 'الإنجليزية + العربية',
    'OCR DPI': 'دقة OCR',
    'OCR reads': 'يقرأ الـ OCR',
    'Codes only (A–Z, 0–9, - _) like the old app': 'أكواد فقط (A–Z، 0–9، - _) مثل البرنامج القديم',
    'Codes only (A–Z, 0–9, - _)': 'أكواد فقط (A–Z، 0–9، - _)',
    'Any text': 'أي نص',
    'Convert to UPPER CASE': 'تحويل إلى أحرف كبيرة',
    'Remove repeated words': 'حذف الكلمات المكررة',
    'Process PDFs': 'معالجة ملفات PDF',
    '4 · Export to Excel': '4 · تصدير إلى Excel',
    'Sheet name': 'اسم الشيت',
    'Start cell': 'خلية البداية',
    'Include header': 'تضمين العناوين',
    'Include file name': 'تضمين اسم الملف',
    'Compare area 1 with the file name': 'مقارنة المنطقة 1 باسم الملف',
    'Add to an existing Excel…': 'إضافة إلى ملف Excel موجود…',
    'Use a new file instead': 'استخدام ملف جديد بدلاً منه',
    'A new Excel file will be created.': 'سيتم إنشاء ملف Excel جديد.',
    'Insert mode (write into the sheet without clearing it)': 'وضع الإدراج (الكتابة في الشيت بدون مسحه)',
    'You can click a cell to fix it before exporting.': 'يمكنك الضغط على أي خلية لتصحيحها قبل التصدير.',
    'Draw at least one area first.': 'ارسم منطقة واحدة على الأقل أولاً.',
    'Processing complete!': 'اكتملت المعالجة!',
    'Process the PDFs first.': 'قم بمعالجة ملفات PDF أولاً.',
    'Start cell must look like A1 or C5.': 'خلية البداية يجب أن تكون مثل A1 أو C5.',
    'Replace it, or keep it and add the data in a new sheet?': 'هل تريد استبداله، أم الاحتفاظ به وإضافة البيانات في شيت جديد؟',
    'New sheet': 'شيت جديد',
    'Permission to save the Excel file was not given.': 'لم يتم منح الإذن بحفظ ملف Excel.',

    // ----- Edit PDF text -----
    'Replace a value inside one area (for example a title block field) in many PDFs at once.': 'استبدل قيمة داخل منطقة واحدة (مثل خانة في الـ Title Block) في ملفات PDF كثيرة مرة واحدة.',
    '2 · Area': '2 · المنطقة',
    'Draw area': 'رسم المنطقة',
    'No area yet.': 'لا توجد منطقة بعد.',
    'Area set. Draw again to change it.': 'تم تحديد المنطقة. ارسم مرة أخرى لتغييرها.',
    'Only text inside this area is changed. Works where the PDF has real (selectable) text.': 'يتم تغيير النص داخل هذه المنطقة فقط. يعمل عندما يحتوي الـ PDF على نص حقيقي (قابل للتحديد).',
    '3 · Find & replace': '3 · بحث واستبدال',
    'Text angle': 'زاوية النص',
    'Auto-detect': 'اكتشاف تلقائي',
    '0° (normal)': '0° (عادي)',
    '90° (reads upward)': '90° (يُقرأ لأعلى)',
    '180° (upside down)': '180° (مقلوب)',
    '270° (reads downward)': '270° (يُقرأ لأسفل)',
    'Font': 'الخط',
    'Auto (closest to the original)': 'تلقائي (الأقرب للأصلي)',
    'Helvetica / Arial': 'Helvetica / Arial',
    'Times New Roman': 'Times New Roman',
    'Courier New': 'Courier New',
    'Font file (.ttf / .otf)…': 'ملف خط (.ttf / .otf)…',
    'Force bold': 'فرض الخط العريض',
    'Force italic': 'فرض الخط المائل',
    'Tip: to match Calibri or another Windows font, choose “Font file” and pick it from C:\\Windows\\Fonts.': 'نصيحة: لمطابقة Calibri أو أي خط ويندوز آخر، اختر "ملف خط" ثم اختره من C:\\Windows\\Fonts.',
    '4 · Save': '4 · الحفظ',
    'Download copies with suffix': 'تنزيل نسخ بلاحقة',
    'Save copies into a folder': 'حفظ النسخ في فولدر',
    'Overwrite the original files (no undo)': 'الكتابة فوق الملفات الأصلية (بدون تراجع)',
    'Preview matches': 'معاينة النتائج',
    'Apply replace': 'تطبيق الاستبدال',
    'Type the text to find.': 'اكتب النص المطلوب.',
    'Draw the area first.': 'ارسم المنطقة أولاً.',
    'Choose the font file first.': 'اختر ملف الخط أولاً.',
    'Size must be a number or “Auto”.': 'الحجم يجب أن يكون رقماً أو "Auto".',
    'Overwrite original files?': 'الكتابة فوق الملفات الأصلية؟',
    'This will permanently overwrite': 'سيتم الكتابة نهائياً فوق',
    'original PDF file(s). This cannot be undone.': 'ملف PDF أصلي. لا يمكن التراجع.',
    'Overwrite': 'كتابة فوق',
    'Replace text?': 'استبدال النص؟',
    'Batch text edit complete.': 'اكتمل تعديل النصوص.',
    "The replacement has letters the standard fonts can't show. Choose a font file (.ttf) instead.": 'النص الجديد به حروف لا تظهر بالخطوط القياسية. اختر ملف خط (.ttf) بدلاً منها.',

    // ----- Title block -----
    "Name every PDF after what's written in its title block, like the drawing number and title.": 'سمِّ كل PDF حسب المكتوب في الـ Title Block الخاص به، مثل رقم اللوحة وعنوانها.',
    "This browser can't rename files on your computer.": 'هذا المتصفح لا يستطيع إعادة تسمية الملفات على جهازك.',
    "You'll get a ZIP with the renamed copies instead. To rename in place, use Google Chrome or Microsoft Edge on a computer.": 'ستحصل بدلاً من ذلك على ملف ZIP بالنسخ المعاد تسميتها. لإعادة التسمية في المكان استخدم Google Chrome أو Microsoft Edge على الكمبيوتر.',
    '1 · Folder of PDFs': '1 · فولدر ملفات PDF',
    'Include subfolders': 'تضمين الفولدرات الفرعية',
    'Choose the folder with your drawings.': 'اختر الفولدر الذي يحتوي على لوحاتك.',
    'Draw a box around the drawing number, then (optionally) the title or revision.': 'ارسم مربعاً حول رقم اللوحة، ثم (اختيارياً) العنوان أو رقم المراجعة.',
    '3 · New name': '3 · الاسم الجديد',
    'Name pattern': 'نمط الاسم',
    '{1}, {2}… are the areas. {name} is the current file name. Example:': '{1}، {2}… هي المناطق. {name} هو اسم الملف الحالي. مثال:',
    'If two files get the same name, add (2), (3)…': 'إذا حصل ملفان على نفس الاسم، أضف (2)، (3)…',
    'OCR settings (for scanned drawings)': 'إعدادات OCR (للوحات الممسوحة ضوئياً)',
    'Read names': 'قراءة الأسماء',
    'Export list to Excel': 'تصدير القائمة إلى Excel',
    'Select all': 'تحديد الكل',
    'Current name': 'الاسم الحالي',
    'Note': 'ملاحظة',
    'Files read:': 'ملفات تمت قراءتها:',
    'Will be renamed:': 'ستتم إعادة تسميتها:',
    'renumbered': 'تمت إضافة رقم',
    'same name': 'نفس الاسم',
    'nothing read': 'لم تتم قراءة شيء',
    'duplicate': 'مكرر',
    'reserved name': 'اسم محجوز',
    'Select a folder with PDF files first.': 'اختر فولدر به ملفات PDF أولاً.',

    // ----- step-by-step tools -----
    '← Back': '→ رجوع',
    'Remove all': 'إزالة الكل',
    'Remove all areas': 'إزالة كل المناطق',
    'Showing': 'المعروض',
    'Areas': 'المناطق',
    'Options': 'خيارات',
    'Example': 'مثال',
    'Choose PDF files': 'اختر ملفات PDF',
    'Choose a folder': 'اختر فولدر',
    'PDF files added': 'ملف PDF تمت إضافتها',
    'Drop them here, or choose files or a whole folder.': 'اسحبها إلى هنا، أو اختر ملفات أو فولدر كامل.',
    'Drag on the drawing to mark an area · Mouse wheel to zoom · Shift + drag to move': 'اسحب على اللوحة لتحديد منطقة · عجلة الماوس للتكبير · Shift + سحب للتحريك',
    'No areas yet. Drag on the drawing to add one.': 'لا توجد مناطق بعد. اسحب على اللوحة لإضافة منطقة.',
    'Add at least one PDF first.': 'أضف ملف PDF واحداً على الأقل أولاً.',
    'The drawings to read': 'اللوحات المطلوب قراءتها',
    'Mark the areas': 'حدد المناطق',
    'Draw a box around each value': 'ارسم مربعاً حول كل قيمة',
    'Get the Excel': 'احصل على ملف Excel',
    'Check the results and download': 'راجع النتائج ونزّل الملف',
    'Add the PDFs you want to read': 'أضف ملفات PDF التي تريد قراءتها',
    'Next: mark the areas →': 'التالي: تحديد المناطق ←',
    'Drag on the drawing': 'اسحب على اللوحة',
    'to draw a box around each value you want, for example the drawing number and the title. Each box becomes a column in Excel.': 'لرسم مربع حول كل قيمة تريدها، مثل رقم اللوحة والعنوان. كل مربع يصبح عموداً في Excel.',
    'Column name, e.g. Drawing No': 'اسم العمود، مثال: رقم اللوحة',
    'Next: read →': 'التالي: القراءة ←',
    '⬇ Download Excel': '⬇ تنزيل ملف Excel',
    'Read again': 'إعادة القراءة',
    'Click any cell to fix it before downloading.': 'اضغط على أي خلية لتصحيحها قبل التنزيل.',
    'Excel options': 'خيارات Excel',
    'Reading options (OCR for scanned drawings)': 'خيارات القراءة (OCR للوحات الممسوحة ضوئياً)',
    'Changed something? Click “Read again”.': 'غيّرت شيئاً؟ اضغط "إعادة القراءة".',
    '← Back to the areas': '→ الرجوع إلى المناطق',
    'Draw at least one area on the drawing first.': 'ارسم منطقة واحدة على الأقل على اللوحة أولاً.',
    'Choose folder': 'اختر الفولدر',
    'Where your drawings are': 'مكان لوحاتك',
    'Mark the drawing number': 'حدد رقم اللوحة',
    'Draw a box on one drawing': 'ارسم مربعاً على لوحة واحدة',
    'Check & rename': 'راجع وأعد التسمية',
    'See the new names, then apply': 'شاهد الأسماء الجديدة ثم طبّق',
    'Choose the folder with your drawings': 'اختر الفولدر الذي يحتوي على لوحاتك',
    'Every PDF in it will be renamed after what\'s written in its title block.': 'كل ملف PDF فيه ستتم تسميته حسب المكتوب في الـ Title Block الخاص به.',
    'Next: mark the drawing number →': 'التالي: تحديد رقم اللوحة ←',
    'Drag a box around the drawing number': 'اسحب مربعاً حول رقم اللوحة',
    'on the drawing. You can add more boxes (title, revision) to use them in the name too.': 'على اللوحة. يمكنك إضافة مربعات أخرى (العنوان، المراجعة) لاستخدامها في الاسم أيضاً.',
    'Next: read names →': 'التالي: قراءة الأسماء ←',
    'New file name': 'اسم الملف الجديد',
    'Click a box name above to add it. Example:': 'اضغط على اسم مربع بالأعلى لإضافته. مثال:',
    'Choose a folder with PDF files first.': 'اختر فولدر به ملفات PDF أولاً.',
    'Draw a box around the drawing number first.': 'ارسم مربعاً حول رقم اللوحة أولاً.',
    'The files to change': 'الملفات المطلوب تعديلها',
    'What to change': 'ماذا تريد أن تغيّر',
    'Draw a box, type old and new text': 'ارسم مربعاً واكتب النص القديم والجديد',
    'Choose how to save, then replace': 'اختر طريقة الحفظ ثم استبدل',
    'Add the PDFs you want to change': 'أضف ملفات PDF التي تريد تعديلها',
    'Next: what to change →': 'التالي: ماذا تريد أن تغيّر ←',
    'Drag a box': 'اسحب مربعاً',
    'around the text you want to change, for example a field in the title block. Only text inside the box is changed.': 'حول النص الذي تريد تغييره، مثل خانة في الـ Title Block. يتم تغيير النص داخل المربع فقط.',
    'No box yet. Drag on the drawing.': 'لا يوجد مربع بعد. اسحب على اللوحة.',
    'Box set. Drag again to move it.': 'تم تحديد المربع. اسحب مرة أخرى لتغييره.',
    'e.g. PL': 'مثال: PL',
    'e.g. AR': 'مثال: AR',
    'Draw a box and type the text to find.': 'ارسم مربعاً واكتب النص المطلوب.',
    'Checking…': 'جارٍ الفحص…',
    'Not found. There is no editable text in this box (it may be a drawing or an image).': 'غير موجود. لا يوجد نص قابل للتعديل في هذا المربع (قد يكون رسماً أو صورة).',
    'Next: save →': 'التالي: الحفظ ←',
    'How to save': 'طريقة الحفظ',
    'Download copies': 'تنزيل نسخ',
    'The originals stay as they are. Copies get a suffix:': 'الملفات الأصلية تبقى كما هي. النسخ تأخذ لاحقة:',
    'You choose the folder. Chrome or Edge.': 'أنت تختار الفولدر. Chrome أو Edge.',
    'Overwrite the original files': 'الكتابة فوق الملفات الأصلية',
    'No undo. Only for files added with Chrome or Edge.': 'بدون تراجع. فقط للملفات المضافة من Chrome أو Edge.',
    'Text style': 'شكل النص',
    'By default the new text copies the original font size, width and position. Change these only if the result looks wrong.': 'افتراضياً يأخذ النص الجديد نفس حجم وعرض ومكان النص الأصلي. غيّر هذه الإعدادات فقط إذا كانت النتيجة غير صحيحة.',
    'Font and angle (optional)': 'الخط والزاوية (اختياري)',
    'Drag a box around the text first.': 'اسحب مربعاً حول النص أولاً.',

    // ----- review tools -----
    'Comment sheet': 'جدول التعليقات',
    'Drawing No.': 'رقم اللوحة',
    'Review': 'المراجعة',
    'Review & document control': 'المراجعة وضبط المستندات',
    'For submissions: client comments, and checks before you send an issue.': 'للتسليمات: تعليقات العميل، وفحص اللوحات قبل الإرسال.',
    'Comment Sheet': 'جدول التعليقات',
    'Turn the client\'s PDF review comments into an Excel response sheet, with the sheet number, date and a picture of each comment.': 'حوّل تعليقات العميل على ملفات PDF إلى جدول Excel للرد، مع رقم اللوحة والتاريخ وصورة لكل تعليق.',
    'Pre-flight Check': 'فحص قبل التسليم',
    'Before sending an issue: duplicate numbers, wrong file names, missing drawings and revisions that don\'t match the list.': 'قبل إرسال أي تسليم: أرقام مكررة، أسماء ملفات خاطئة، لوحات ناقصة، ومراجعات غير مطابقة للقائمة.',
    'Turn the client\'s PDF review comments into an Excel sheet ready for your responses.': 'حوّل تعليقات العميل على ملفات PDF إلى جدول Excel جاهز لردودك.',
    'Add review PDFs': 'أضف ملفات المراجعة',
    'The marked-up drawings': 'اللوحات التي عليها تعليقات',
    'Mark the sheet number': 'حدد رقم اللوحة',
    'Optional: a box on one drawing': 'اختياري: مربع على لوحة واحدة',
    'Check and download Excel': 'راجع ونزّل ملف Excel',
    'Add the PDFs with the client\'s comments': 'أضف ملفات PDF التي عليها تعليقات العميل',
    'Drop them here, or choose files or a whole folder. Comments made in Bluebeam, Acrobat or any PDF reader are read.': 'اسحبها إلى هنا، أو اختر ملفات أو فولدر كامل. يتم قراءة التعليقات المكتوبة في Bluebeam أو Acrobat أو أي برنامج PDF.',
    'comments found in': 'تعليق في',
    'file(s)': 'ملف',
    'No comments were found. If the reviewer "flattened" the PDF, the markups became part of the drawing and can\'t be read as comments.': 'لم يتم العثور على تعليقات. إذا قام المراجع "بتثبيت" (flatten) الملف، تصبح التعليقات جزءاً من الرسم ولا يمكن قراءتها كتعليقات.',
    'Next: sheet number →': 'التالي: رقم اللوحة ←',
    'Drag a box around the sheet number': 'اسحب مربعاً حول رقم اللوحة',
    'in the title block, so every comment gets its sheet number. Need more from the title block, like the title or the revision? Drag more boxes: each one becomes its own column. This step is optional: without a box, the file name is used.': 'في الـ Title Block، ليأخذ كل تعليق رقم لوحته. تحتاج بيانات أخرى من الـ Title Block مثل العنوان أو المراجعة؟ اسحب مربعات أخرى: كل مربع يصبح عموداً مستقلاً. هذه الخطوة اختيارية: بدون مربع يُستخدم اسم الملف.',
    'No box yet. The file name will be used as the sheet number.': 'لا يوجد مربع بعد. سيُستخدم اسم الملف كرقم للوحة.',
    'Next: comment sheet →': 'التالي: جدول التعليقات ←',
    '⬇ Download comment sheet (Excel)': '⬇ تنزيل جدول التعليقات (Excel)',
    'Click a comment or sheet number to fix it before downloading.': 'اضغط على أي تعليق أو رقم لوحة لتصحيحه قبل التنزيل.',
    'No.': 'م',
    'Sheet No.': 'رقم اللوحة',
    'Comment': 'التعليق',
    'Snapshot': 'صورة',
    'By': 'بواسطة',
    'Date': 'التاريخ',
    'Comments:': 'التعليقات:',
    'In the sheet:': 'في الجدول:',
    'Preparing snapshots…': 'جارٍ تجهيز الصور…',
    'Sheet header (optional)': 'رأس الجدول (اختياري)',
    'Project': 'المشروع',
    'Submission / reference': 'التسليم / المرجع',
    'Reviewed by': 'المراجِع',
    'e.g. Mamsha Palm Residences': 'مثال: Mamsha Palm Residences',
    'e.g. Tender submission 02': 'مثال: Tender submission 02',
    'e.g. Client / Consultant': 'مثال: العميل / الاستشاري',
    'Which markups': 'أي تعليقات',
    'Also include markups without text (clouds, arrows, highlights)': 'تضمين العلامات بدون نص أيضاً (سحابات، أسهم، تظليل)',
    'Add replies to the comment they answer': 'إضافة الردود إلى التعليق الذي ترد عليه',
    'Changed something? The list updates automatically.': 'غيّرت شيئاً؟ القائمة تتحدث تلقائياً.',
    'Still reading the comments, one moment…': 'جارٍ قراءة التعليقات، لحظة…',
    'No comments were found in these PDFs.': 'لم يتم العثور على تعليقات في هذه الملفات.',
    'Catch mistakes in a drawing issue before you send it.': 'اكتشف الأخطاء في تسليم اللوحات قبل إرساله.',
    'Drawings & list': 'اللوحات والقائمة',
    'The issue folder, and your drawing list': 'فولدر التسليم وقائمة اللوحات',
    'Mark the title block': 'حدد الـ Title Block',
    'Drawing number and revision': 'رقم اللوحة ورقم المراجعة',
    'Report': 'التقرير',
    'What to fix before sending': 'ما يجب إصلاحه قبل الإرسال',
    '1. The drawings to issue': '1. اللوحات المطلوب تسليمها',
    'Choose the folder with the PDFs you are about to send.': 'اختر الفولدر الذي يحتوي على ملفات PDF التي ستُرسلها.',
    'or choose PDF files': 'أو اختر ملفات PDF',
    'PDF files': 'ملف PDF',
    '2. Your drawing list': '2. قائمة اللوحات',
    'An Excel register or document list. It lets the check find missing drawings and wrong revisions.': 'سجل اللوحات أو قائمة المستندات في Excel. تسمح باكتشاف اللوحات الناقصة والمراجعات الخاطئة.',
    'Choose Excel file…': 'اختر ملف Excel…',
    'Don\'t use a list': 'بدون قائمة',
    'Sheet': 'الشيت',
    'Drawing number column': 'عمود رقم اللوحة',
    'Revision column': 'عمود رقم المراجعة',
    '(none)': '(لا يوجد)',
    'Next: mark the title block →': 'التالي: تحديد الـ Title Block ←',
    'in the title block, then a second box around the': 'في الـ Title Block، ثم مربعاً ثانياً حول',
    'revision': 'رقم المراجعة',
    '. A third box for the title is optional.': '. المربع الثالث للعنوان اختياري.',
    'Next: check →': 'التالي: الفحص ←',
    '⬇ Download report (Excel)': '⬇ تنزيل التقرير (Excel)',
    'Drawings': 'اللوحات',
    'Show only drawings with problems': 'عرض اللوحات التي بها مشاكل فقط',
    'Drawing No. (title block)': 'رقم اللوحة (Title Block)',
    'Rev.': 'المراجعة',
    'Rev. in list': 'المراجعة في القائمة',
    'Problems': 'المشاكل',
    'In the drawing list but no PDF': 'موجودة في القائمة لكن بدون PDF',
    '✓ Ready to send. No problems found.': '✓ جاهز للإرسال. لا توجد مشاكل.',
    'Every drawing number was read': 'تمت قراءة كل أرقام اللوحات',
    'No duplicate drawing numbers': 'لا توجد أرقام لوحات مكررة',
    'All file names match the title block': 'كل أسماء الملفات مطابقة للـ Title Block',
    'Every revision was read': 'تمت قراءة كل أرقام المراجعة',
    'Every drawing in the list has a PDF': 'كل لوحات القائمة لها ملف PDF',
    'Every PDF is in the drawing list': 'كل ملفات PDF موجودة في القائمة',
    'All revisions match the drawing list': 'كل أرقام المراجعة مطابقة للقائمة',
    'Add your drawing list in step 1 to also check missing drawings and revisions.': 'أضف قائمة اللوحات في الخطوة 1 لفحص اللوحات الناقصة وأرقام المراجعة أيضاً.',
    'Drawing number could not be read': 'تعذرت قراءة رقم اللوحة',
    'Same drawing number as another file': 'نفس رقم لوحة ملف آخر',
    'File name does not match the drawing number': 'اسم الملف لا يطابق رقم اللوحة',
    'Revision could not be read': 'تعذرت قراءة رقم المراجعة',
    'Not in the drawing list': 'غير موجودة في القائمة',
    'Revision differs from the drawing list': 'رقم المراجعة مختلف عن القائمة',
    'Choose the folder with the drawings first.': 'اختر فولدر اللوحات أولاً.',
  };

  // Messages with numbers or names inside. Each entry: [regex, replacement].
  const PATTERNS = [
    [/^(\d+) files renamed in one click\.$/, '$1 ملف اتسمّوا بضغطة واحدة.'],
    [/^(\d+) drawings renamed from their title block\.$/, '$1 لوحات اتسمّت من الـ Title Block بتاعها.'],
    [/^For example, Sheet_001\.pdf is now “(.*)”$/, 'مثلًا، Sheet_001.pdf بقى اسمه "$1"'],
    [/^One row for each of the (\d+) drawings, one column for each box you drew$/, 'صف لكل لوحة من الـ $1، وعمود لكل مربع رسمته'],
    [/^Summary: how many PDF, DWG, DOCX… files are in each of the (\d+) folders$/, 'ملخص: عدد ملفات PDF و DWG و DOCX… في كل فولدر من الـ $1'],
    [/^One sheet with all (\d+) files, with size and date$/, 'شيت فيه كل الـ $1 ملف، بالحجم والتاريخ'],
    [/^Reading folder… (\d+) files$/, 'جارٍ قراءة الفولدر… $1 ملف'],
    [/^Show more \((\d+) remaining\)$/, 'عرض المزيد (متبقي $1)'],
    [/^(\d+) of (\d+)$/, '$1 من $2'],
    [/^of (\d+)$/, 'من $1'],
    [/^Updated (\d+) name\(s\) in the preview\. Click “Apply Rename” to save\.$/, 'تم تعديل $1 اسم في المعاينة. اضغط "تطبيق إعادة التسمية" للحفظ.'],
    [/^No names contain “(.*)”\.$/, 'لا توجد أسماء تحتوي على "$1".'],
    [/^Rename (\d+) file\(s\)\?$/, 'إعادة تسمية $1 ملف؟'],
    [/^…and (\d+) more\.$/, '…و $1 ملف آخر.'],
    [/^Renamed (\d+) file\(s\)\.$/, 'تمت إعادة تسمية $1 ملف.'],
    [/^(\d+) file\(s\) could not be renamed$/, 'تعذرت إعادة تسمية $1 ملف'],
    [/^(\d+) file\(s\) will get their previous names back\.$/, 'سيعود $1 ملف إلى أسمائه السابقة.'],
    [/^Delete (\d+) file\(s\)\?$/, 'حذف $1 ملف؟'],
    [/^Deleted (\d+) file\(s\)\.$/, 'تم حذف $1 ملف.'],
    [/^Could not delete (\d+) file\(s\)\. (.*)$/, 'تعذر حذف $1 ملف. $2'],
    [/^file\(s\) \((\d+) with new names\), keeping the same folder structure\.$/, 'ملف ($1 بأسماء جديدة) مع الحفاظ على نفس ترتيب الفولدرات.'],
    [/^(.+) \(everything\)$/, '$1 (الكل)'],
    [/^(Move|Copy) (\d+) file\(s\)\?$/, (verb, n) => `${verb === 'Move' ? 'نقل' : 'نسخ'} ${n} ملف؟`],
    [/^(Moving|Copying)… (\d+)\/(\d+)$/, (verb, a, b) => `${verb === 'Moving' ? 'جارٍ النقل' : 'جارٍ النسخ'}… ${a}/${b}`],
    [/^(\d+) file\(s\) were already in the right folder\.$/, '$1 ملف كان بالفعل في الفولدر الصحيح.'],
    [/^(\d+) file\(s\) failed:$/, 'فشل $1 ملف:'],
    [/^— (\d+) file\(s\)$/, '— $1 ملف'],
    [/^(\d+) file\(s\) · (\d+) page\(s\)$/, '$1 ملف · $2 صفحة'],
    [/^(\d+) p · (.+)$/, '$1 صفحة · $2'],
    [/^Merging… (\d+)\/(\d+)$/, 'جارٍ الدمج… $1/$2'],
    [/^Merged (\d+) files into (.+)\.$/, 'تم دمج $1 ملف في $2.'],
    [/^Could not merge: (.*)$/, 'تعذر الدمج: $1'],
    [/^· (\d+) page\(s\) · (.+)$/, '· $1 صفحة · $2'],
    [/^Will create (\d+) files\.$/, 'سيتم إنشاء $1 ملف.'],
    [/^Pages 1 to (\d+)\. Separate ranges with commas\.$/, 'الصفحات من 1 إلى $1. افصل بين النطاقات بفاصلة.'],
    [/^Splitting… (\d+)\/(\d+)$/, 'جارٍ التقسيم… $1/$2'],
    [/^Created (\d+) files\.$/, 'تم إنشاء $1 ملف.'],
    [/^Saved (\d+) file\(s\) into “(.+)”\.$/, 'تم حفظ $1 ملف في "$2".'],
    [/^Invalid range “(.+)” for a (\d+)-page document\.$/, 'النطاق "$1" غير صالح لملف من $2 صفحة.'],
    [/^“(.+)” is not a page or range\.$/, '"$1" ليس صفحة أو نطاقاً.'],
    [/^Could not split: (.*)$/, 'تعذر التقسيم: $1'],
    [/^(\d+) file\(s\)\. Click a file to show it on the right\.$/, '$1 ملف. اضغط على ملف لعرضه.'],
    [/^(\d+) file\(s\)\. Click one to show it\.$/, '$1 ملف. اضغط على ملف لعرضه.'],
    [/^Loading OCR \((.+)\)… first time can take a minute\.$/, 'جارٍ تحميل OCR ($1)… أول مرة قد تستغرق دقيقة.'],
    [/^Processing… (\d+)\/(\d+)$/, 'جارٍ المعالجة… $1/$2'],
    [/^Sheet “(.+)” already exists$/, 'الشيت "$1" موجود بالفعل'],
    [/^Saved into “(.+)”, sheet “(.+)”\.$/, 'تم الحفظ في "$1"، شيت "$2".'],
    [/^Will add to “(.+)” and save it in place\.$/, 'ستتم الإضافة إلى "$1" وحفظه في مكانه.'],
    [/^Will add to “(.+)” and download the updated copy\.$/, 'ستتم الإضافة إلى "$1" وتنزيل النسخة المحدّثة.'],
    [/^Export failed: (.*)$/, 'فشل التصدير: $1'],
    [/^Replace “(.*)” with “(.*)” inside the area in$/, 'استبدال "$1" بـ "$2" داخل المنطقة في'],
    [/^Font: (.+)$/, 'الخط: $1'],
    [/^(\d+) match$/, '$1 نتيجة'],
    [/^\((\d+)\/(\d+)\) (.+): (\d+) match\(es\)$/, '($1/$2) $3: $4 نتيجة'],
    [/^\((\d+)\/(\d+)\) (.+): replaced (\d+) occurrence\(s\)$/, '($1/$2) $3: تم استبدال $4'],
    [/^\((\d+)\/(\d+)\) (.+): (?:0 match\(es\)|no matches)\. NO TEXT LAYER in this box \(likely an outline\/image field, not editable text\)$/, '($1/$2) $3: لا نتائج. لا يوجد نص في هذه المنطقة (غالباً مرسوم أو صورة وليس نصاً قابلاً للتعديل)'],
    [/^\((\d+)\/(\d+)\) (.+): (?:0 match\(es\)|no matches)\. Text found in box: "(.*)"$/, '($1/$2) $3: لا نتائج. النص الموجود في المنطقة: "$4"'],
    [/^\((\d+)\/(\d+)\) (.+): ERROR - (.*)$/, '($1/$2) $3: خطأ - $4'],
    [/^\((\d+)\/(\d+)\) (.+): has only (\d+) page\(s\)$/, '($1/$2) $3: يحتوي على $4 صفحة فقط'],
    [/^Preview complete — (\d+) total match\(es\) across (\d+) file\(s\)\.$/, 'اكتملت المعاينة — $1 نتيجة في $2 ملف.'],
    [/^(\d+) PDF file\(s\) in “(.+)”\. Click one to show it\.$/, '$1 ملف PDF في "$2". اضغط على ملف لعرضه.'],
    [/^Reading… (\d+)\/(\d+)$/, 'جارٍ القراءة… $1/$2'],
    [/^Read (\d+) file\(s\)\.$/, 'تمت قراءة $1 ملف.'],
    [/^Column name for area (\d+)$/, 'اسم العمود للمنطقة $1'],
    [/^PDF files found in “(.+)”$/, 'ملف PDF في "$1"'],
    [/^✓ Found in all (\d+) file\(s\)\.$/, '✓ موجود في كل الملفات ($1 ملف).'],
    [/^Found in (\d+) of (\d+) file\(s\)\. Not found in: (.*)$/, 'موجود في $1 من $2 ملف. غير موجود في: $3'],
    [/^Not found\. The box on this drawing contains: "(.*)"$/, 'غير موجود. المربع في هذه اللوحة يحتوي على: "$1"'],
    [/^Replace in (\d+) file\(s\)$/, 'استبدال في $1 ملف'],
    [/^Column (\d+)$/, 'عمود $1'],
    [/^(\d+) problem\(s\) to check before sending$/, '$1 مشكلة يجب مراجعتها قبل الإرسال'],
    [/^(\d+) drawing\(s\): the drawing number could not be read$/, '$1 لوحة: تعذرت قراءة رقم اللوحة'],
    [/^(\d+) drawing number\(s\) are used by more than one file$/, '$1 رقم لوحة مستخدم في أكثر من ملف'],
    [/^(\d+) file name\(s\) don't match the drawing number in the title block$/, '$1 اسم ملف لا يطابق رقم اللوحة في الـ Title Block'],
    [/^(\d+) drawing\(s\): the revision could not be read$/, '$1 لوحة: تعذرت قراءة رقم المراجعة'],
    [/^(\d+) drawing\(s\) in the list have no PDF$/, '$1 لوحة في القائمة بدون ملف PDF'],
    [/^(\d+) PDF\(s\) are not in the drawing list$/, '$1 ملف PDF غير موجود في القائمة'],
    [/^(\d+) revision\(s\) differ from the drawing list$/, '$1 رقم مراجعة مختلف عن القائمة'],
    [/^(\d+) file\(s\) have more than one page \(only page (\d+) was checked\)$/, '$1 ملف به أكثر من صفحة (تم فحص الصفحة $2 فقط)'],
    [/^File has (\d+) pages$/, 'الملف به $1 صفحات'],
    [/^Could not open: (.*)$/, 'تعذر فتح الملف: $1'],
    [/^Using “(.+)”\.$/, 'باستخدام "$1".'],
    [/^(\d+) drawing\(s\) in the list\.$/, '$1 لوحة في القائمة.'],
    [/^Name for area (\d+)$/, 'اسم المنطقة $1'],
  ];

  // Where text is the user's own data (file names, folder names): never translate.
  const SKIP = 'script, style, code, textarea, .brand, .fname, td.name, td.orig, td.cur-name, td.folder, td.comment, td.sheet, .preview-list, .folder-name, #folderName, #fileLabel, .mock-row:not(.head), .mock-chip b, .pv-rect, [translate="no"]';
  const ALLOW_INSIDE_SKIP = '.err, .edit-btn';
  const ATTRS = ['placeholder', 'title', 'aria-label'];

  let stored = '';
  try { stored = localStorage.getItem(KEY) || ''; } catch { /* ignore */ }
  const browserAr = (navigator.language || '').toLowerCase().startsWith('ar');
  let lang = stored === 'ar' || stored === 'en' ? stored : (browserAr ? 'ar' : 'en');

  // Pages built in both languages (see tools/build.mjs) carry data-lang-page and
  // <link rel="alternate" hreflang>. The switch then moves to the other page instead of
  // translating in place, so each language has its own address for search engines.
  // The address decides the language: an English link always opens in English and an /ar/
  // link in Arabic (no automatic redirect), so shared links open as sent.
  const pageLang = root.getAttribute('data-lang-page');
  const altHref = (l) => {
    const link = document.querySelector(`link[rel="alternate"][hreflang="${l}"]`);
    return link ? link.getAttribute('data-switch') || link.getAttribute('href') : null;
  };
  if (pageLang) lang = pageLang;
  setDirection();

  function setDirection() {
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  const norm = (s) => s.replace(/\s+/g, ' ').trim();

  // Arabic plural after numbers 3-10: "7 ملف" -> "7 ملفات", "5 صفحة" -> "5 صفحات".
  const PLURALS = { 'ملف': 'ملفات', 'صفحة': 'صفحات', 'فولدر': 'فولدرات', 'اسم': 'أسماء', 'نتيجة': 'نتائج' };
  const pluralize = (s) => s.replace(/(\d+) (ملف|صفحة|فولدر|اسم|نتيجة)(?![؀-ۿ])/g,
    (all, n, word) => (Number(n) >= 3 && Number(n) <= 10 ? `${n} ${PLURALS[word]}` : all));

  function lookup(key) {
    if (Object.prototype.hasOwnProperty.call(AR, key)) return AR[key];
    for (const [re, rep] of PATTERNS) {
      const m = key.match(re);
      if (!m) continue;
      const v = typeof rep === 'function' ? rep(...m.slice(1)) : key.replace(re, rep);
      if (v != null) return pluralize(v);
    }
    return null;
  }

  function skipped(el) {
    if (!el) return true;
    if (el.closest(ALLOW_INSIDE_SKIP)) return false;
    return !!el.closest(SKIP);
  }

  function translateText(node) {
    if (node.__fmSet !== undefined && node.__fmSet === node.data) return; // our own write
    const orig = node.data;
    const key = norm(orig);
    if (!key || !/[A-Za-z→]/.test(key) || skipped(node.parentElement)) return;
    const value = lookup(key);
    if (value == null) return;
    const lead = orig.match(/^\s*/)[0];
    const trail = orig.match(/\s*$/)[0];
    node.__fmEn = orig;
    node.__fmSet = lead + value + trail;
    node.data = node.__fmSet;
  }

  function translateAttrs(el) {
    if (skipped(el) && !el.matches(ALLOW_INSIDE_SKIP)) return;
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (!v) continue;
      el.__fmAttr = el.__fmAttr || {};
      if (el.__fmAttr[a] && el.__fmAttr[a].set === v) continue;
      const t = lookup(norm(v));
      if (t == null) continue;
      el.__fmAttr[a] = { en: v, set: t };
      el.setAttribute(a, t);
    }
  }

  function walk(rootNode) {
    if (rootNode.nodeType === 3) { translateText(rootNode); return; }
    if (rootNode.nodeType !== 1) return;
    translateAttrs(rootNode);
    const it = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = it.nextNode())) {
      if (n.nodeType === 3) translateText(n);
      else translateAttrs(n);
    }
  }

  function restore() {
    const it = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = it.nextNode())) {
      if (n.nodeType === 3) {
        if (n.__fmEn !== undefined && n.data === n.__fmSet) n.data = n.__fmEn;
        n.__fmSet = undefined;
        n.__fmEn = undefined;
      } else if (n.__fmAttr) {
        for (const [a, { en, set }] of Object.entries(n.__fmAttr)) if (n.getAttribute(a) === set) n.setAttribute(a, en);
        n.__fmAttr = undefined;
      }
    }
  }

  let originalTitle = '';
  function applyTitle() {
    if (!originalTitle) originalTitle = document.title;
    document.title = lang === 'ar' ? (lookup(originalTitle) || originalTitle) : originalTitle;
  }

  const observer = new MutationObserver((mutations) => {
    if (lang !== 'ar') return;
    for (const m of mutations) {
      if (m.type === 'childList') m.addedNodes.forEach(walk);
      else if (m.type === 'characterData') translateText(m.target);
      else if (m.type === 'attributes') translateAttrs(m.target);
    }
  });

  function loadArabicFont() {
    if (document.getElementById('fm-ar-font')) return;
    const link = document.createElement('link');
    link.id = 'fm-ar-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }

  function paintButton() {
    document.querySelectorAll('[data-lang-toggle]').forEach((b) => {
      b.textContent = lang === 'ar' ? 'EN' : 'عربي';
      b.title = lang === 'ar' ? 'English' : 'العربية';
      b.lang = lang === 'ar' ? 'en' : 'ar';
    });
  }

  function addButton() {
    const nav = document.querySelector('.site-header nav');
    if (!nav || nav.querySelector('[data-lang-toggle]')) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'theme-btn lang-btn';
    b.setAttribute('data-lang-toggle', '');
    b.setAttribute('translate', 'no');
    const theme = nav.querySelector('[data-theme-toggle]');
    nav.insertBefore(b, theme || nav.lastElementChild);
    b.addEventListener('click', () => setLang(lang === 'ar' ? 'en' : 'ar'));
  }

  function setLang(next) {
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
    if (pageLang && altHref(next)) { location.href = altHref(next) + location.hash; return; }
    lang = next;
    setDirection();
    if (lang === 'ar') { loadArabicFont(); walk(document.body); } else restore();
    applyTitle();
    paintButton();
  }

  document.addEventListener('DOMContentLoaded', () => {
    addButton();
    paintButton();
    applyTitle();
    if (lang === 'ar') { loadArabicFont(); walk(document.body); }
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  });

  AR['File Manager Toolkit'] = 'File Manager Toolkit';
  AR['Need a tool for your office?'] = 'محتاج أداة مخصوصة لمكتبك؟';
  AR['Every office has its own drawing lists, title blocks and naming rules. Tell us what takes your team hours, and we can build a tool for it.'] =
    'كل مكتب له قوائم لوحات و Title Block وقواعد تسمية خاصة بيه. قولنا إيه الشغل اللي بياخد من فريقك ساعات، ونقدر نعملك أداة ليه.';
  AR['Tell us what you need'] = 'قولنا محتاج إيه';
  AR['PDF files found'] = 'ملفات PDF موجودة';
  AR['Your files stay on your computer. Nothing is uploaded.'] = 'ملفاتك بتفضل على جهازك. مفيش أي حاجة بتترفع.';
  AR['Your files never leave your computer'] = 'ملفاتك عمرها ما بتخرج من جهازك';
  AR['11 free tools'] = '11 أداة مجانية';
  AR['MIDP Check'] = 'مراجعة الـ MIDP';
  AR['Check a whole submission, every discipline and file type, against the MIDP and TIDPs: missing, extra, wrong revisions.'] =
    'راجع التسليم كله، لكل الأقسام وكل أنواع الملفات، على الـ MIDP والـ TIDPs: الناقص، والزيادة، والـ Revision الغلط.';
  AR['Check every file in a submission against the MIDP and the TIDPs of all disciplines.'] = 'راجع كل ملف في التسليم على الـ MIDP والـ TIDPs بتاعة كل الأقسام.';
  AR['MIDP / TIDPs'] = 'الـ MIDP / الـ TIDPs';
  AR['The deliverables lists in Excel'] = 'قوائم المستندات على Excel';
  AR['Received files'] = 'الملفات المستلمة';
  AR['The submission folders'] = 'فولدرات التسليم';
  AR['Missing, extra and wrong names'] = 'الناقص والزيادة والأسامي الغلط';
  AR['Deliverables lists'] = 'قوائم المستندات';
  AR['Add the MIDP, or one TIDP per discipline. For each file, pick the column that holds the document number (the file name each deliverable should have).'] =
    'ضيف الـ MIDP، أو TIDP لكل قسم. ولكل ملف اختار العمود اللي فيه رقم المستند (يعني الاسم اللي المفروض الملف يتسمّى بيه).';
  AR['+ Add Excel file…'] = '+ ضيف ملف Excel…';
  AR['Naming rule'] = 'قاعدة التسمية';
  AR['Check every file name field by field, for example ISO 19650 names like PRJ-ORG-VOL-LVL-TYP-ROL-NUM. Let the tool learn the rule from the received files, or type one correct name, then adjust each field.'] =
    'راجع اسم كل ملف خانة بخانة، زي أسامي ISO 19650 من نوع PRJ-ORG-VOL-LVL-TYP-ROL-NUM. خلّي الأداة تتعلّم القاعدة من الملفات المستلمة، أو اكتب اسم واحد صح، وبعدين ظبّط كل خانة.';
  AR['A correct name'] = 'اسم صح';
  AR['Split into fields'] = 'قسّمه لخانات';
  AR['Learn from the files'] = 'اتعلّم من الملفات';
  AR['Field'] = 'الخانة';
  AR['Example'] = 'مثال';
  AR['Characters'] = 'عدد الحروف';
  AR['Type'] = 'النوع';
  AR['Fixed value(s)'] = 'قيمة ثابتة';
  AR['Found in the files'] = 'الموجود في الملفات';
  AR['Characters: one number (3) or a range (3-5), empty = any length. Fixed value(s): leave empty if the field changes from file to file, or list the allowed values separated by commas.'] =
    'عدد الحروف: رقم واحد (3) أو مدى (3-5)، وفاضي يعني أي طول. القيمة الثابتة: سيبها فاضية لو الخانة بتتغيّر من ملف للتاني، أو اكتب القيم المسموحة وبينهم فاصلة.';
  AR['No MIDP yet? Skip this step and check only the file names.'] = 'مفيش MIDP؟ اتخطّى الخطوة دي وراجع أسامي الملفات بس.';
  AR['Excel lists (optional)'] = 'قوائم Excel (اختياري)';
  AR['File names'] = 'أسامي الملفات';
  AR['Naming rule'] = 'قاعدة التسمية';
  AR['Check names against this rule'] = 'راجع الأسامي على القاعدة دي';
  AR['Separator'] = 'الفاصل';
  AR['Number of fields'] = 'عدد الخانات';
  AR['Next: received files →'] = 'التالي: الملفات المستلمة ←';
  AR['Choose the submission folder. You can add one folder per discipline. Every file type counts: PDF, DWG, RVT, IFC, NWC, DOCX, XLSX…'] =
    'اختار فولدر التسليم. تقدر تضيف فولدر لكل قسم. كل أنواع الملفات بتتحسب: PDF و DWG و RVT و IFC و NWC و DOCX و XLSX…';
  AR['+ Add folder'] = '+ ضيف فولدر';
  AR['File names include the revision (for example A-101_P02.pdf)'] = 'أسامي الملفات فيها الـ Revision (زي A-101_P02.pdf)';
  AR['files'] = 'ملف';
  AR['By discipline'] = 'حسب القسم';
  AR['Discipline / TIDP'] = 'القسم / الـ TIDP';
  AR['Expected'] = 'المطلوب';
  AR['Received'] = 'المستلم';
  AR['Missing'] = 'الناقص';
  AR['Wrong revision'] = 'Revision غلط';
  AR['Deliverables'] = 'المستندات';
  AR['Show only problems'] = 'اعرض المشاكل بس';
  AR['Document No.'] = 'رقم المستند';
  AR['Title'] = 'العنوان';
  AR['Discipline'] = 'القسم';
  AR['Files received'] = 'الملفات المستلمة';
  AR['Status'] = 'الحالة';
  AR['Received but not in the MIDP'] = 'مستلم بس مش موجود في الـ MIDP';
  AR['Problem'] = 'المشكلة';
  AR['Less file work.'] ='أنجز أكتر. بخطوات أقل.';
  AR['Zero uploads.'] = 'وملفاتك ما تخرجش من جهازك.';
  AR['Rename hundreds of drawings from their title block, list folders to Excel, merge, split and check PDFs. Everything runs in your browser, on your own computer.'] =
    'سمِّ مئات اللوحات من الـ Title Block، وطلّع قوايم الفولدرات على Excel، وادمج وقسّم وافحص ملفات PDF. كل ده بيشتغل جوه المتصفح، على جهازك إنت.';
  AR['Find your tool'] = 'اختار أداتك';
  AR['Try the title block rename'] = 'جرّب التسمية من الـ Title Block';
  AR['Your files never leave your computer. No accounts.'] = 'ملفاتك ما بتخرجش من جهازك. ومن غير حساب.';
  AR['100% on your device'] = '100% على جهازك';
  AR['Your drawings. Your business.'] = 'رسوماتك تخصك إنت بس.';
  AR['Built for the whole batch'] = 'معمولة للدفعة كلها';
  AR['Preview before you apply'] = 'شوف النتيجة قبل ما تطبّق';
  AR['English & Arabic, naturally'] = 'عربي وإنجليزي';
  AR['Find a tool…'] = 'دوّر على أداة…';
  AR['Find a tool'] = 'دوّر على أداة';
  AR['★ My favorites'] = '★ المفضلة';
  AR['No tool matches that. Try another word, or tell us what you need with the Feedback button.'] =
    'مفيش أداة بالاسم ده. جرّب كلمة تانية، أو قولنا محتاج إيه من زرار "رأيك".';
  AR['Drawing and file tools that'] ='أدوات للرسومات والملفات';
  AR['never upload your files'] = 'من غير ما ملفاتك تترفع';
  AR['Rename hundreds of drawings from their title block, list folders to Excel, merge, split and check PDFs. All inside your browser, on your own computer.'] =
    'سمِّ مئات اللوحات من الـ Title Block، وطلّع قوايم الفولدرات على Excel، وادمج وقسّم وافحص ملفات PDF. كل ده جوه المتصفح، على جهازك إنت.';
  AR['Rename drawings from title block'] = 'سمِّ اللوحات من الـ Title Block';
  AR['See all 10 tools'] = 'شوف الـ 10 أدوات';
  AR['files uploaded'] = 'ملفات بتترفع';
  AR['free tools'] = 'أدوات مجانية';
  AR['OCR for scans'] = 'OCR للملفات الممسوحة';
  AR['free, no account'] = 'مجاني، من غير حساب';
  AR['Processed on this computer'] = 'بيتعالج على جهازك إنت';
  AR['0 bytes sent to any server'] = 'ولا بايت بيتبعت لأي سيرفر';
  AR['10 free tools'] = '10 أدوات مجانية';
  AR['Pick a tool and start'] = 'اختار أداة وابدأ';
  AR['Need another tool?'] = 'محتاج أداة تانية؟';
  AR['Tell us what you still do by hand every week. The most requested tools get built next.'] =
    'قولنا إيه الشغل اللي لسه بتعمله بإيدك كل أسبوع. الأدوات اللي بتتطلب أكتر هي اللي بتتعمل الأول.';
  AR['Suggest a tool →'] = 'اقترح أداة ←';
  AR['Simple by design'] = 'بسيطة من الأساس';
  AR['For offices'] = 'للمكاتب';
  AR['Free forever'] = 'مجاني على طول';
  AR['Something else? Use the Feedback button and we will reply.'] = 'عندك سؤال تاني؟ ابعتلنا من زرار "رأيك" وهنرد عليك.';
  AR['Why use this instead of AI chats or upload sites?'] = 'ليه تستخدم الأداة دي بدل الذكاء الاصطناعي أو مواقع الرفع؟';
  AR['AI chats and online file sites'] = 'الذكاء الاصطناعي ومواقع الملفات أونلاين';
  AR["Your drawings are uploaded and processed on someone else's servers."] = 'رسوماتك بتترفع وبتتعالج على سيرفرات حد تاني.';
  AR['Your browser does the work on your own computer. Nothing is uploaded.'] = 'المتصفح بيشتغل على جهازك إنت. مفيش أي حاجة بتترفع.';
  AR['Whole folders at once'] = 'فولدرات كاملة مرة واحدة';
  AR['Hundreds of drawings in one go, not a few files per chat.'] = 'مئات اللوحات في مرة واحدة، مش كام ملف في كل محادثة.';
  AR['Exact, not a guess'] = 'دقيق، مش تخمين';
  AR['Reads the real text from the title block. You see every result first, and can undo.'] = 'بيقرأ النص الحقيقي من الـ Title Block، وبتشوف كل النتايج الأول، وتقدر تتراجع.';
  AR['Three clicks, no prompts'] = 'تلات ضغطات، من غير أوامر';
  AR['Pick the folder, check the preview, apply. Nothing to explain or retry.'] = 'اختار الفولدر، راجع المعاينة، طبّق. مش محتاج تشرح ولا تعيد.';
  AR['Done in your folder'] = 'بيخلص جوه الفولدر بتاعك';
  AR['Files are renamed and saved where they are. No downloading and sorting afterwards.'] = 'الملفات بتتسمّى وتتحفظ في مكانها. مفيش تنزيل وترتيب بعدين.';
  AR['Client drawings and project files are confidential. Here they are opened by your own browser, on your own computer, and nobody else receives them.'] =
    'رسومات العملاء وملفات المشاريع سرية. هنا المتصفح بتاعك هو اللي بيفتحها على جهازك إنت، ومحدش غيرك بيستلمها.';
  AR['Most online PDF and file sites'] = 'أغلب مواقع الـ PDF والملفات أونلاين';
  AR['You upload your files to their servers'] = 'بترفع ملفاتك على السيرفرات بتاعتهم';
  AR["Your files sit on someone else's computer while they are processed"] = 'ملفاتك بتبقى على جهاز حد تاني وهي بتتعالج';
  AR['You download the result back'] = 'بتنزّل النتيجة تاني على جهازك';
  AR['Your browser opens the files on your computer'] = 'المتصفح بيفتح الملفات على جهازك';
  AR['Nothing is uploaded: not the files, not their names, not their content'] = 'مفيش حاجة بتترفع: لا الملفات، ولا أساميها، ولا محتواها';
  AR['Renamed files and results are saved straight to your folder'] = 'الملفات بعد التسمية والنتايج بتتحفظ في الفولدر بتاعك على طول';
  AR['Only the tool itself is downloaded from the internet, the same way any web page is. You can check it: the source code is public on GitHub.'] =
    'الأداة نفسها بس هي اللي بتتحمّل من الإنترنت، زي أي صفحة ويب. وتقدر تتأكد بنفسك: الكود المصدر متاح للكل على GitHub.';
  // Guide links (footer, tool pages, home FAQ). The guide pages' own text is in tools/guides-ar.mjs.
  AR['Guides'] = 'شروحات';
  AR['Step-by-step guides →'] = 'شروحات خطوة بخطوة ←';
  AR['Rename PDFs from title block'] = 'تسمية PDF من جدول العنوان';
  AR['Drawing register from PDFs'] = 'قائمة لوحات من PDF';
  AR['Merge PDF without uploading'] = 'دمج PDF بدون رفع';
  AR['Folder file list to Excel'] = 'أسماء الملفات إلى Excel';
  AR['PDF comments to Excel'] = 'تعليقات PDF إلى Excel';
  AR['Step-by-step guide:'] = 'شرح خطوة بخطوة:';
  AR['How to rename PDF drawings from the title block'] = 'طريقة إعادة تسمية ملفات PDF للوحات من جدول العنوان';
  AR['How to make a drawing register in Excel from PDF drawings'] = 'طريقة عمل قائمة لوحات في Excel من ملفات PDF';
  AR['How to merge PDF files without uploading them'] = 'طريقة دمج ملفات PDF بدون رفعها';
  AR['How to list all files in a folder and subfolders to Excel'] = 'طريقة نسخ أسماء كل الملفات في فولدر وفولدراته الفرعية إلى Excel';
  AR['How to export PDF comments to an Excel comment sheet'] = 'طريقة تصدير تعليقات PDF إلى جدول تعليقات Excel';
  AR["Split a PDF drawing set"] = "تقسيم ملف لوحات PDF";
  AR["Edit title block text"] = "تعديل نص جدول العنوان";
  AR["MIDP / ISO 19650 check"] = "مراجعة MIDP / ISO 19650";
  AR["How to split a PDF drawing set into sheets named by drawing number"] = "طريقة تقسيم ملف لوحات PDF إلى ملف لكل لوحة باسم رقمها";
  AR["How to change title block text in many PDF drawings without CAD"] = "طريقة تعديل نص جدول العنوان في ملفات PDF كثيرة بدون CAD";
  AR["How to check a submission against the MIDP and ISO 19650 file naming"] = "طريقة مراجعة التسليم على الـ MIDP وقاعدة تسمية ISO 19650";
  AR['Is there a step-by-step guide for each tool?'] = 'فيه شرح خطوة بخطوة لكل أداة؟';
  AR['Yes, with screenshots:'] = 'أيوه، بالصور:';
  // ----- Split & Rename PDF -----
  Object.assign(AR, {
    'Split & Rename PDF': 'تقسيم وتسمية PDF',
    'Split a combined drawing set into one PDF per sheet, each named from its own title block.': 'قسّم ملف لوحات مجمّع لملف PDF لكل لوحة، وكل ملف باسمه من الـ Title Block بتاعه.',
    'Choose the PDF': 'اختار الـ PDF',
    'One file with many sheets': 'ملف واحد فيه لوحات كتير',
    'Draw a box on one sheet': 'ارسم مربع على لوحة واحدة',
    'Check & split': 'راجع وقسّم',
    'See every name, then split': 'شوف كل الأسماء، وبعدين قسّم',
    'Choose the combined PDF': 'اختار ملف الـ PDF المجمّع',
    "Every sheet becomes its own PDF, named after what's written in its title block. You can also drop the file here.": 'كل لوحة هتبقى ملف PDF لوحدها، باسم المكتوب في الـ Title Block بتاعها. وممكن كمان تسحب الملف وترميه هنا.',
    '📋 Use an example file': '📋 جرّب بملف جاهز',
    'No drawings with you? Use an example set: one PDF with a cover page and 9 drawing pages.': 'مش معاك رسومات دلوقتي؟ جرّب على ملف مثال: PDF واحد فيه صفحة غلاف و 9 صفحات لوحات.',
    'pages': 'صفحة',
    'at the bottom right, then another around the revision': 'تحت على اليمين، وبعدين مربع تاني حوالين الـ Revision',
    'next to it. Then press': 'اللي جنبه. وبعدين دوس',
    'on a sheet. Add more boxes (revision, title) to use them in the name too.': 'على أي لوحة. وممكن تزوّد مربعات تانية (الـ Revision، اسم اللوحة) عشان تستخدمها في الاسم.',
    'Showing page': 'الصفحة المعروضة',
    'Pick a page that has a title block. The same boxes are read on every page.': 'اختار صفحة فيها Title Block. نفس المربعات هتتقري في كل الصفحات.',
    'Next: read every page →': 'التالي: اقرا كل الصفحات ←',
    'File name': 'اسم الملف',
    'Separator:': 'الفاصل:',
    'space - space': 'مسافة - مسافة',
    'space': 'مسافة',
    'Click a box name, then a separator, then another box. Example:': 'دوس على اسم مربع، وبعدين فاصل، وبعدين مربع تاني. مثال:',
    'gives': 'يدّيك',
    'Pages in a row with the same name go in one file': 'الصفحات اللي ورا بعض وليها نفس الاسم تتجمع في ملف واحد',
    'Leave out pages where nothing was read (cover, index…)': 'سيب الصفحات اللي ماتقراش منها حاجة (الغلاف، الفهرس…)',
    'Add a drawing register (Excel) with the files': 'ضيف Drawing register (Excel) مع الملفات',
    'OCR': 'OCR',
    'Automatic (only for scanned sets)': 'تلقائي (للملفات الممسوحة ضوئيًا بس)',
    'On every empty box': 'على كل مربع فاضي',
    'Never': 'أبدًا',
    'Split & download (ZIP)': 'قسّم ونزّل (ZIP)',
    'Split & save to folder': 'قسّم واحفظ في فولدر',
    'Save into a folder instead': 'احفظ في فولدر بدل كده',
    'Drawing register (Excel)': 'Drawing register (Excel)',
    'Pages': 'الصفحات',
    'New file name': 'اسم الملف الجديد',
    'Read from the title block': 'المقروء من الـ Title Block',
    'Pages read:': 'صفحات اتقرت:',
    'Files to create:': 'ملفات هتتعمل:',
    'Pages left out:': 'صفحات متسابة:',
    'left out': 'متسابة',
    'Choose a PDF first.': 'اختار ملف PDF الأول.',
    'Saving into a folder needs Chrome or Edge. Untick it to download a ZIP.': 'الحفظ في فولدر محتاج Chrome أو Edge. شيل العلامة عشان تنزّل ZIP.',
    'They will be replaced.': 'هيتكتب عليهم.',
    'Replace them': 'اكتب عليهم',
    'Every sheet got its own file': 'كل لوحة خدت ملف لوحدها',
    'The cover page had no title block, so it was left out. The ZIP has a drawing register in Excel too': 'صفحة الغلاف مافيهاش Title Block فاتسابت. والـ ZIP فيه كمان Drawing register على Excel',
    'Now split your own PDF': 'دلوقتي قسّم الـ PDF بتاعك',
    'Split a combined drawing set into one PDF per sheet, named from each title block: drawing number, revision…': 'قسّم ملف لوحات مجمّع لملف PDF لكل لوحة، باسمها من الـ Title Block: رقم اللوحة، الـ Revision…',
    '+ 8 more tools:': '+ 8 أدوات تانية:',
    'split & rename PDF, merge PDF, MIDP check, comment sheet and more.': 'تقسيم وتسمية PDF، دمج PDF، مراجعة MIDP، شيت التعليقات وغيرها.',
    '12 free tools': '12 أداة مجانية',
    'check this page': 'راجع الصفحة دي',
  });
  PATTERNS.push(
    [/^Boxes follow their labels on sheets with another layout \((\d+) of (\d+) found\)\.$/, 'المربعات بتمشي ورا العناوين بتاعتها في اللوح اللي ترتيبها مختلف (اتلقى $1 من $2).'],
    [/^pages in “(.*)”$/, 'صفحة في “$1”'],
    [/^Splitting… (\d+)\/(\d+)$/, 'جارٍ التقسيم… $1/$2'],
    [/^Created (\d+) PDF file\(s\)\.$/, 'اتعمل $1 ملف PDF.'],
    [/^Saved (\d+) PDF file\(s\) into “(.*)”\.$/, 'اتحفظ $1 ملف PDF في “$2”.'],
    [/^(\d+) file\(s\) already exist in “(.*)”$/, '$1 ملف موجودين بالفعل في “$2”'],
    [/^Page (\d+): (.*)$/, 'صفحة $1: $2'],
    [/^(\d+) drawings split from one PDF, each named from its title block\.$/, '$1 لوحات اتقسمت من PDF واحد، وكل واحدة باسمها من الـ Title Block.'],
    [/^For example, page (\d+) is now “(.*)”$/, 'مثلًا، صفحة $1 بقت “$2”'],
    [/^Pages (\S+) have the same drawing number, so they went into one file$/, 'الصفحات $1 ليها نفس رقم اللوحة، فاتجمعت في ملف واحد'],
  );
  AR['PDF Comments to Excel'] = 'تعليقات PDF إلى Excel';
  AR['Picture quality'] = 'جودة الصور';
  AR['Low (small file)'] = 'منخفضة (ملف صغير)';
  AR['Medium'] = 'متوسطة';
  AR['High (sharp when zoomed)'] = 'عالية (واضحة مع التكبير)';
  // ----- handing files between tools, "What's next?" card -----
  AR['Your files are ready. Click Open so this page can read them.'] = 'ملفاتك جاهزة. دوس "افتح" عشان الصفحة دي تقدر تقراها.';
  AR['Open'] = AR['Open'] || 'افتح';
  AR['Access was not given. Use the button to choose the folder.'] = 'ماتدّتش صلاحية. استخدم الزرار واختار الفولدر.';
  AR['Drop the folder that holds the PDFs.'] = 'ارمي الفولدر اللي فيه ملفات الـ PDF.';
  AR['What’s next?'] = 'الخطوة الجاية؟';
  AR['Open this folder in'] = 'افتح نفس الفولدر في';
  AR['Need to fix names in this folder? Add a prefix or fix the revision in every name at once.'] = 'محتاج تظبط الأسامي في الفولدر ده؟ ضيف Prefix أو صلّح الـ Revision في كل الأسامي مرة واحدة.';
  AR['Make an Excel list of the renamed files, with a count of each file type.'] = 'اعمل قائمة Excel بالملفات بعد التسمية، وعدد كل نوع ملف.';
  AR['Make a drawing register in Excel from the same PDFs: number, title and revision.'] = 'اعمل Drawing register على Excel من نفس ملفات الـ PDF: الرقم والعنوان والـ Revision.';
  AR['Check a submission folder against this drawing list before you send it.'] = 'راجع فولدر الـ Submission على القائمة دي قبل ما تبعته.';
  AR['↘ Title block'] = '↘ الـ Title Block';
  AR['Zoom to the bottom-right corner'] = 'تكبير على الركن اللي تحت يمين';
  AR['Automatic: codes only in number / revision boxes, any text in the rest'] = 'تلقائي: أكواد بس في خانات الرقم والـ Revision، وأي نص في الباقي';
  AR['Drawing register template'] = 'نموذج قائمة اللوحات';
  AR['Transmittal template'] = 'نموذج Transmittal';
  AR['Bluebeam / PDF comments to Excel'] = 'تعليقات Bluebeam و PDF إلى Excel';
  AR['· Free'] = '· نموذج مجاني:';
  AR['drawing register template'] = 'قائمة اللوحات (Drawing Register)';
  AR['transmittal template'] = 'Transmittal';
  AR['Export Bluebeam or any PDF comments to Excel'] = 'تصدير تعليقات Bluebeam أو أي PDF إلى Excel';
  // ===== 2026-11 redesign: home, menu, every PDF tool page =====
  const ADD = {
    // ----- tool names and categories -----
    'Compress PDF': 'ضغط PDF',
    'PDF to JPG': 'PDF إلى JPG',
    'Organize PDF': 'ترتيب PDF',
    'Organize Pages': 'ترتيب الصفحات',
    'Rotate PDF': 'تدوير PDF',
    'Optimize PDF': 'تحسين PDF',
    'OCR PDF': 'OCR لملفات PDF',
    'Convert': 'تحويل',
    'JPG to PDF': 'JPG إلى PDF',
    'Edit & review': 'تعديل ومراجعة',
    'Add Page Numbers': 'ترقيم الصفحات',
    'Add Watermark': 'علامة مائية',
    'Crop PDF': 'قص PDF',
    'Compare PDF': 'مقارنة PDF',
    'PDF security': 'حماية PDF',
    'Protect PDF': 'حماية PDF',
    'Unlock PDF': 'فك حماية PDF',
    'For engineers': 'للمهندسين',
    'Convert & edit': 'تحويل وتعديل',
    'Security & files': 'الحماية والملفات',
    'Images to PDF': 'صور إلى PDF',
    // ----- home -----
    'Every PDF and file tool you need.': 'كل أدوات PDF والملفات اللي محتاجها.',
    'Nothing uploaded.': 'من غير ما ترفع حاجة.',
    'Merge, split, compress, convert and protect PDFs, or rename and list whole folders. Free, with no limits and no sign-up, because everything runs in your browser on your own computer.': 'ادمج وقسّم واضغط وحوّل واحمي ملفات PDF، أو سمّي واعمل قائمة بفولدرات كاملة. مجاني، بلا حدود ومن غير تسجيل، لأن كل حاجة بتشتغل في المتصفح على جهازك أنت.',
    '✓ Free, no limits': '✓ مجاني وبلا حدود',
    '✓ No upload': '✓ من غير رفع',
    '✓ Whole folders at once': '✓ فولدرات كاملة مرة واحدة',
    '✓ Works offline': '✓ بيشتغل من غير إنترنت',
    '✓ English & Arabic': '✓ عربي وإنجليزي',
    'Combine PDFs, or a whole folder with its subfolders, into one file with a bookmark for each.': 'اجمع ملفات PDF، أو فولدر كامل بالفولدرات اللي جواه، في ملف واحد بإشارة مرجعية لكل ملف.',
    'By page ranges, every few pages, file size or bookmarks.': 'حسب نطاق الصفحات، أو كل كام صفحة، أو حجم الملف، أو الإشارات المرجعية.',
    'See every page. Drag to reorder, rotate, delete or add blank pages.': 'شوف كل الصفحات. اسحب عشان ترتّب، دوّر، احذف أو ضيف صفحات فاضية.',
    'Turn pages the right way in many files at once, or only the landscape ones.': 'لِف الصفحات للاتجاه الصح في ملفات كتير مرة واحدة، أو الصفحات العرضية بس.',
    'Make PDFs smaller. Pick a target size, like under 2 MB for email.': 'صغّر ملفات PDF. اختار الحجم اللي عايزه، زي أقل من 2 ميجا للإيميل.',
    'Make scanned PDFs searchable and copyable, in English and Arabic.': 'خلّي ملفات PDF الممسوحة تقدر تدوّر فيها وتنسخ منها، عربي وإنجليزي.',
    'Pages to JPG, PNG, WebP or TIFF, at the resolution you choose.': 'الصفحات إلى JPG أو PNG أو WebP أو TIFF، بالدقة اللي تختارها.',
    'Photos and images to PDF: one file, or one per image or folder.': 'الصور إلى PDF: ملف واحد، أو ملف لكل صورة أو لكل فولدر.',
    'Page numbers or Bates numbers, on many PDFs at once.': 'أرقام صفحات أو ترقيم Bates، لملفات PDF كتير مرة واحدة.',
    'Stamp text in any language, or a logo, on every page.': 'اطبع نص بأي لغة، أو لوجو، على كل صفحة.',
    'Draw the area to keep, or trim the white margins automatically.': 'ارسم الجزء اللي عايز تحتفظ بيه، أو شيل الهوامش البيضاء أوتوماتيك.',
    'Two versions laid over each other: what was removed and what was added.': 'نسختين فوق بعض: إيه اللي اتشال وإيه اللي اتضاف.',
    'Replace a value inside an area, across many PDFs at once.': 'غيّر قيمة جوه منطقة معينة، في ملفات PDF كتير مرة واحدة.',
    'Add a password, and choose whether people can print, copy or edit.': 'ضيف كلمة سر، واختار هل الناس تقدر تطبع أو تنسخ أو تعدّل.',
    'Remove the password and restrictions from PDFs you can open.': 'شيل كلمة السر والقيود من ملفات PDF اللي تقدر تفتحها.',
    'Prefix, suffix, find and replace in hundreds of names, with undo.': 'بادئة، لاحقة، بحث واستبدال في مئات الأسماء، مع تراجع.',
    'Every file in a folder and its subfolders, listed in Excel.': 'كل ملف في الفولدر والفولدرات اللي جواه، في قائمة Excel.',
    'Move or copy files into folders by type or by a word in the name.': 'انقل أو انسخ الملفات لفولدرات حسب النوع أو كلمة في الاسم.',
    'Name each PDF drawing after the number and title in its title block.': 'سمّي كل لوحة PDF برقمها واسمها من الـ Title Block.',
    'One PDF per sheet from a combined set, named from each title block.': 'ملف PDF لكل لوحة من ملف مجمّع، باسمها من الـ Title Block.',
    'Read the same boxes from every drawing into a spreadsheet. OCR included.': 'اقرا نفس الخانات من كل لوحة في شيت Excel. والـ OCR موجود.',
    'Review comments to an Excel response sheet, with a picture of each.': 'تعليقات المراجعة في شيت ردود Excel، مع صورة لكل تعليق.',
    'Duplicate numbers, wrong names and missing drawings, before you send.': 'أرقام مكررة، أسماء غلط ولوحات ناقصة، قبل ما تبعت.',
    'A whole submission against the MIDP and TIDPs: missing, extra, wrong revisions.': 'الـ Submission كله مقابل الـ MIDP والـ TIDPs: الناقص والزيادة والـ Revisions الغلط.',
    'Tell us what you still do by hand. The most requested tools get built next.': 'قولنا إيه اللي لسه بتعمله بإيدك. الأدوات الأكتر طلبًا هي اللي بتتعمل الأول.',
    'Why people switch': 'ليه الناس بتغيّر',
    'Online PDF sites vs File Manager Toolkit': 'مواقع PDF أونلاين مقابل File Manager Toolkit',
    'Typical online PDF sites': 'مواقع PDF أونلاين العادية',
    'File Manager Toolkit': 'File Manager Toolkit',
    'Your files': 'ملفاتك',
    'Uploaded to their servers and kept for hours': 'بتترفع على سيرفراتهم وبتفضل هناك ساعات',
    'Never leave your computer': 'ما بتخرجش من جهازك أبدًا',
    'Free limits': 'حدود النسخة المجانية',
    '2 files per task, 1 file for OCR, hourly caps': 'ملفين في المرة، ملف واحد للـ OCR، وحد كل ساعة',
    'No limits, no account': 'بلا حدود ومن غير حساب',
    'Pick files one by one': 'تختار الملفات واحد واحد',
    'Whole folders with their subfolders': 'فولدرات كاملة بالفولدرات اللي جواها',
    'PDF to JPG quality': 'جودة PDF إلى JPG',
    'Normal or High': 'عادية أو عالية',
    'Any DPI, JPG / PNG / WebP / TIFF, color, grey or black and white': 'أي DPI، JPG / PNG / WebP / TIFF، ملون أو رمادي أو أبيض وأسود',
    'Compress': 'الضغط',
    '3 fixed levels, result only after download': '3 مستويات ثابتة، والنتيجة بعد التحميل بس',
    'A target size, and the size of each level before you save': 'حجم تحدده، وحجم كل مستوى قبل ما تحفظ',
    'Merge': 'الدمج',
    'Drag files in order': 'تسحب الملفات بالترتيب',
    'Natural sort, a bookmark per file, a table of contents': 'ترتيب طبيعي، إشارة مرجعية لكل ملف، وفهرس',
    'Split by size, OCR, workflows': 'التقسيم بالحجم، الـ OCR، وسير العمل',
    'Paid plans': 'باشتراك مدفوع',
    'Free': 'مجاني',
    'Speed with big files': 'السرعة مع الملفات الكبيرة',
    'Wait for the upload and the download': 'تستنى الرفع والتحميل',
    'Starts at once, nothing to send': 'بيبدأ على طول، مفيش حاجة تتبعت',
    'Ads': 'الإعلانات',
    'Yes, on the free plan': 'أيوه، في النسخة المجانية',
    'None': 'مفيش',
    'For architects and engineers': 'للمعماريين والمهندسين',
    'Tools no PDF site has': 'أدوات مش موجودة في أي موقع PDF',
    'Drawing sets, title blocks and submissions: the work that used to take an afternoon.': 'مجموعات اللوحات، الـ Title Blocks والـ Submissions: الشغل اللي كان بياخد بعد الضهر كله.',
    'Choose files or a whole folder, or drop them on the page. Your browser opens them on your own computer.': 'اختار ملفات أو فولدر كامل، أو ارميهم على الصفحة. المتصفح بيفتحهم على جهازك أنت.',
    'Choose the options': 'اختار الإعدادات',
    'See every page, name or size before anything changes.': 'شوف كل صفحة واسم وحجم قبل ما أي حاجة تتغيّر.',
    'Download or save': 'نزّل أو احفظ',
    'One file, a ZIP, or straight into a folder. Then carry on with another tool.': 'ملف واحد، أو ZIP، أو على طول في فولدر. وبعدها كمّل بأداة تانية.',
    'Every office has its own lists, forms and naming rules. Tell us what takes your team hours, and we can build a tool for it.': 'كل مكتب ليه قوائمه ونماذجه وقواعد التسمية بتاعته. قولنا إيه اللي بياخد من فريقك ساعات، ونقدر نعملك أداة ليه.',
    'No. The tools run in your browser. Files are read from your computer and the results are saved back to it. You can even disconnect from the internet after the page has loaded.': 'لأ. الأدوات بتشتغل في المتصفح. الملفات بتتقري من جهازك والنتايج بتتحفظ عليه. وتقدر كمان تفصل النت بعد ما الصفحة تفتح.',
    'Is it really free? What are the limits?': 'هو مجاني فعلًا؟ وإيه الحدود؟',
    "It is free, with no account and no limits on the number of files or tasks. The only limit is your computer's memory with very large files.": 'مجاني، من غير حساب ومن غير حد لعدد الملفات أو المرات. الحد الوحيد هو ذاكرة جهازك مع الملفات الكبيرة جدًا.',
    'Does it work without internet?': 'بيشتغل من غير إنترنت؟',
    'Yes. After you have used a tool once, the page and its PDF engine are kept by your browser, so the tool opens and works offline.': 'أيوه. بعد ما تستخدم الأداة مرة، المتصفح بيحتفظ بالصفحة ومحرك الـ PDF بتاعها، فالأداة بتفتح وتشتغل من غير نت.',
    'Google Chrome or Microsoft Edge on a computer can also save results straight into a folder and rename files in place. Other browsers work too, and give you the result as a download.': 'Google Chrome أو Microsoft Edge على الكمبيوتر يقدروا كمان يحفظوا النتايج على طول في فولدر ويغيّروا أسماء الملفات مكانها. المتصفحات التانية بتشتغل برضه، وبتديك النتيجة كتحميل.',
    'Yes. OCR PDF and PDF to Excel read English, Arabic or both.': 'أيوه. OCR لملفات PDF و PDF إلى Excel بيقروا عربي أو إنجليزي أو الاتنين.',
    'Free PDF and file tools that run in your browser. No upload, no sign-up, no limits.': 'أدوات PDF وملفات مجانية بتشتغل في متصفحك. من غير رفع ولا تسجيل ولا حدود.',
    'Next': 'التالي',
    'Drawing register (Excel)': 'قائمة اللوحات (Excel)',
    // ----- shared tool page parts (kit) -----
    '📁 Select a folder': '📁 اختار فولدر',
    'or drop PDF files or a folder here': 'أو ارمي ملفات PDF أو فولدر هنا',
    'or drop images or a folder here': 'أو ارمي صور أو فولدر هنا',
    'Nothing is uploaded': 'مفيش حاجة بتترفع',
    'No limit on files or size': 'بلا حد لعدد الملفات أو حجمها',
    'Free, no sign-up': 'مجاني ومن غير تسجيل',
    'Sort…': 'ترتيب…',
    'Name A → Z': 'الاسم أ ← ي',
    'Name Z → A': 'الاسم ي ← أ',
    'Oldest first': 'الأقدم الأول',
    'Newest first': 'الأحدث الأول',
    'Smallest first': 'الأصغر الأول',
    '+ Folder': '+ فولدر',
    'More options': 'إعدادات أكتر',
    'Working…': 'جاري الشغل…',
    '← Change the options': '← غيّر الإعدادات',
    'Start over with other files': 'ابدأ من الأول بملفات تانية',
    'Continue with the result': 'كمّل على النتيجة',
    'Questions': 'أسئلة',
    'Download all (ZIP)': 'نزّل الكل (ZIP)',
    'Add files first.': 'ضيف ملفات الأول.',
    'No PDF files there.': 'مفيش ملفات PDF هنا.',
    'No images there.': 'مفيش صور هنا.',
    'Not a valid PDF file': 'ملف PDF مش سليم',
    'Nothing was made. Check the options.': 'متعملش حاجة. راجع الإعدادات.',
    'Password-protected. Unlock it first with Unlock PDF.': 'محمي بكلمة سر. فك حمايته الأول بأداة فك حماية PDF.',
    'Wait until the files are read, or remove the ones with errors.': 'استنى لحد ما الملفات تتقري، أو شيل الملفات اللي فيها مشاكل.',
    'Your file is ready': 'ملفك جاهز',
    'Saving…': 'جاري الحفظ…',
    'Done': 'تم',
    'Pages': 'الصفحات',
    'All pages, or e.g. 1-3, 5, 8-': 'كل الصفحات، أو مثلًا 1-3، 5، 8-',
    'File names': 'أسماء الملفات',
    'File name': 'اسم الملف',
    'Options': 'الإعدادات',
    'Position': 'المكان',
    'Top left': 'فوق شمال', 'Top centre': 'فوق في النص', 'Top right': 'فوق يمين',
    'Middle left': 'في النص شمال', 'Centre': 'في النص', 'Middle right': 'في النص يمين',
    'Bottom left': 'تحت شمال', 'Bottom centre': 'تحت في النص', 'Bottom right': 'تحت يمين',
    'Remove': 'شيل',
    // ----- merge -----
    'Combine PDFs, or a whole folder with its subfolders, into one file.': 'اجمع ملفات PDF، أو فولدر كامل بالفولدرات اللي جواه، في ملف واحد.',
    'Select PDF files': 'اختار ملفات PDF',
    'Bookmarks': 'الإشارات المرجعية',
    'One per file': 'واحدة لكل ملف',
    'By folder': 'حسب الفولدر',
    'Keep the bookmarks inside each file': 'احتفظ بالإشارات المرجعية اللي جوه كل ملف',
    'Add a table of contents page': 'ضيف صفحة فهرس',
    'Print the file name at the bottom of each page': 'اكتب اسم الملف تحت كل صفحة',
    'Double-sided printing: add a blank page after files with an odd number of pages': 'طباعة على الوشين: ضيف صفحة فاضية بعد الملفات اللي عدد صفحاتها فردي',
    'Merge PDF': 'دمج PDF',
    'Merging…': 'جاري الدمج…',
    'Your PDFs are merged': 'ملفاتك اتدمجت',
    'Add at least two PDF files to merge.': 'ضيف ملفين PDF على الأقل عشان تدمج.',
    'How to use Merge PDF': 'إزاي تستخدم دمج PDF',
    'Select your PDFs, or a whole folder': 'اختار ملفات PDF، أو فولدر كامل',
    '. Files in subfolders are included, in natural order (2 before 10).': '. الملفات اللي في الفولدرات الفرعية بتدخل، بالترتيب الطبيعي (2 قبل 10).',
    'Drag to change the order': 'اسحب عشان تغيّر الترتيب',
    ', or sort by name or date.': '، أو رتّب بالاسم أو التاريخ.',
    '. Every file gets a bookmark, so the combined PDF is easy to move around.': '. كل ملف بياخد إشارة مرجعية، فتتنقل في الملف المجمّع بسهولة.',
    'Can I merge all the PDFs in a folder and its subfolders?': 'أقدر أدمج كل ملفات PDF اللي في فولدر والفولدرات اللي جواه؟',
    'Yes. Select the folder: every PDF inside, at any depth, is added in folder order, and you can make a bookmark for each folder.': 'أيوه. اختار الفولدر: كل PDF جواه، مهما كان عمقه، بيتضاف بترتيب الفولدرات، وتقدر تعمل إشارة مرجعية لكل فولدر.',
    'Will "file 10" come after "file 2"?': 'هل "file 10" هييجي بعد "file 2"؟',
    'Yes. Names are sorted the way people count, not letter by letter.': 'أيوه. الأسماء بتترتب زي ما الناس بتعد، مش حرف حرف.',
    'Is there a limit on the number of files?': 'فيه حد لعدد الملفات؟',
    'No. Hundreds of files are fine.': 'لأ. مئات الملفات عادي.',
    'How to merge PDF files without uploading them': 'إزاي تدمج ملفات PDF من غير ما ترفعها',
    'Step-by-step guide:': 'شرح خطوة بخطوة:',
    // ----- split -----
    'Split by page ranges, every few pages, file size or bookmarks.': 'قسّم حسب نطاق الصفحات، أو كل كام صفحة، أو حجم الملف، أو الإشارات المرجعية.',
    'Split': 'قسّم',
    'Page ranges': 'نطاقات صفحات',
    'Every N pages': 'كل N صفحة',
    'By file size': 'حسب حجم الملف',
    'By bookmarks': 'حسب الإشارات المرجعية',
    'Extract pages': 'استخراج صفحات',
    'Every page': 'كل صفحة',
    'Ranges': 'النطاقات',
    'A file for each range. "4-" means page 4 to the end.': 'ملف لكل نطاق. "4-" يعني من صفحة 4 للآخر.',
    'Pages per file': 'صفحات في كل ملف',
    'Largest file size': 'أكبر حجم للملف',
    'MB': 'ميجا',
    'Bookmark level': 'مستوى الإشارات المرجعية',
    'Top level': 'المستوى الأول',
    'Second level': 'المستوى التاني',
    'A file for each bookmark, named after it.': 'ملف لكل إشارة مرجعية، باسمها.',
    'Pages to extract': 'الصفحات اللي هتتسحب',
    'Copied into one new PDF, in this order.': 'بتتنسخ في ملف PDF جديد واحد، بالترتيب ده.',
    '{name} = PDF name, {part} = part number or bookmark, {pages} = page range': '{name} = اسم الـ PDF، {part} = رقم الجزء أو الإشارة المرجعية، {pages} = الصفحات',
    'How to use Split PDF': 'إزاي تستخدم تقسيم PDF',
    'Select your PDF': 'اختار ملف PDF',
    '(or several: each is split the same way).': '(أو أكتر من ملف: كل واحد بيتقسم بنفس الطريقة).',
    'Choose how to split': 'اختار طريقة التقسيم',
    ': page ranges, every few pages, a size limit for email, or the bookmarks.': ': نطاقات صفحات، أو كل كام صفحة، أو حد للحجم عشان الإيميل، أو الإشارات المرجعية.',
    'and download the parts as a ZIP or into a folder.': 'ونزّل الأجزاء ZIP أو في فولدر.',
    'Split a PDF drawing set into one file per sheet': 'قسّم ملف لوحات PDF لملف لكل لوحة',
    'Can I split a PDF into parts under 10 MB?': 'أقدر أقسّم PDF لأجزاء أقل من 10 ميجا؟',
    'Yes. Choose "By file size" and type 10. Each part is kept under that size, without cutting a page in half.': 'أيوه. اختار "حسب حجم الملف" واكتب 10. كل جزء بيفضل أقل من الحجم ده، من غير ما صفحة تتقطع.',
    'Can I split a PDF by chapters?': 'أقدر أقسّم PDF حسب الفصول؟',
    'Yes, if the PDF has bookmarks: choose "By bookmarks" and every chapter becomes its own file, named after it.': 'أيوه، لو الملف فيه إشارات مرجعية: اختار "حسب الإشارات المرجعية" وكل فصل هيبقى ملف لوحده باسمه.',
    'Split PDF': 'تقسيم PDF',
    'Splitting…': 'جاري التقسيم…',
    'Each PDF': 'كل PDF',
    'This PDF': 'الملف ده',
    'No pages matched. Check the page numbers.': 'مفيش صفحات مطابقة. راجع أرقام الصفحات.',
    'Type the largest size for each part, for example 10 MB.': 'اكتب أكبر حجم لكل جزء، مثلًا 10 ميجا.',
    'Type the page ranges, for example 1-3, 4-': 'اكتب نطاقات الصفحات، مثلًا 1-3، 4-',
    'Type the pages to extract, for example 1, 3, 5-7': 'اكتب الصفحات اللي هتتسحب، مثلًا 1، 3، 5-7',
    'e.g. 1-3, 4-6, 7-': 'مثلًا 1-3، 4-6، 7-',
    'e.g. 1, 3, 5-7': 'مثلًا 1، 3، 5-7',
    'e.g. 1-3, 5': 'مثلًا 1-3، 5',
    // ----- organize pages -----
    'See every page. Drag to reorder, rotate, delete, or add blank pages.': 'شوف كل الصفحات. اسحب عشان ترتّب، دوّر، احذف، أو ضيف صفحات فاضية.',
    'All pages': 'كل الصفحات',
    '↺ Rotate all': '↺ دوّر الكل',
    '↻ Rotate all': '↻ دوّر الكل',
    'Reverse order': 'اعكس الترتيب',
    '+ Blank page': '+ صفحة فاضية',
    'Drag a page to move it. Use the buttons on a page to rotate, copy or delete it.': 'اسحب الصفحة عشان تحركها. استخدم الزراير اللي عليها عشان تدوّرها أو تنسخها أو تحذفها.',
    'Save PDF': 'احفظ PDF',
    'How to use Organize Pages': 'إزاي تستخدم ترتيب الصفحات',
    'Select one or more PDFs': 'اختار ملف PDF أو أكتر',
    '. All their pages appear as pictures.': '. كل صفحاتهم هتظهر كصور.',
    'Drag pages': 'اسحب الصفحات',
    'into the order you want, rotate or delete them, or add a blank page.': 'للترتيب اللي عايزه، دوّرها أو احذفها، أو ضيف صفحة فاضية.',
    'the new PDF.': 'الملف الجديد.',
    'Can I combine pages from different PDFs?': 'أقدر أجمع صفحات من ملفات PDF مختلفة؟',
    'Yes. Add several PDFs: all their pages appear together, and you can mix them in any order.': 'أيوه. ضيف كذا ملف: كل صفحاتهم هتظهر مع بعض، وتقدر تخلطهم بأي ترتيب.',
    'Can I undo a deleted page?': 'أقدر أرجّع صفحة اتحذفت؟',
    'Click "Start over", or add the file again. Nothing changes in your original files.': 'دوس "ابدأ من الأول"، أو ضيف الملف تاني. ملفاتك الأصلية مش بيتغير فيها حاجة.',
    'Rotate': 'دوّر',
    'Copy': 'انسخ',
    'Delete': 'احذف',
    'blank': 'فاضية',
    'There are no pages left. Add a file, or click "Start over".': 'مفيش صفحات فاضلة. ضيف ملف، أو دوس "ابدأ من الأول".',
    'Your new PDF is ready': 'ملف الـ PDF الجديد جاهز',
    'All pages were removed. Add a file, or click "Start over".': 'كل الصفحات اتشالت. ضيف ملف، أو دوس "ابدأ من الأول".',
    // ----- rotate -----
    'Turn pages the right way and save them, in many files at once.': 'لِف الصفحات للاتجاه الصح واحفظها، في ملفات كتير مرة واحدة.',
    '↻ 90° right': '↻ 90° يمين',
    '↺ 90° left': '↺ 90° شمال',
    'Which pages': 'أنهي صفحات',
    'All': 'الكل',
    'Landscape': 'عرضي',
    'Portrait': 'طولي',
    'Choose…': 'اختار…',
    'You can also turn one file only with the ↻ button on its picture.': 'وتقدر كمان تلف ملف واحد بس بزرار ↻ اللي على صورته.',
    'How to use Rotate PDF': 'إزاي تستخدم تدوير PDF',
    'Select your PDFs.': 'اختار ملفات PDF.',
    'Select your PDFs': 'اختار ملفات PDF',
    'Choose the angle': 'اختار الزاوية',
    'and which pages: all of them, only landscape or portrait pages, or a list.': 'وأنهي صفحات: كلها، أو العرضية أو الطولية بس، أو قائمة.',
    'and download. The pages are saved turned, so they open the right way everywhere.': 'ونزّل. الصفحات بتتحفظ ملفوفة، فبتفتح صح في أي مكان.',
    'Is the rotation saved?': 'هل التدوير بيتحفظ؟',
    'Yes. The new orientation is saved in the PDF, so it opens the right way in every reader and prints that way.': 'أيوه. الاتجاه الجديد بيتحفظ في الملف، فبيفتح صح في أي برنامج وبيتطبع كده.',
    'Can I rotate only the landscape pages?': 'أقدر ألف الصفحات العرضية بس؟',
    'Yes. Choose "Landscape" to turn only pages that are wider than tall, for example drawings in a report.': 'أيوه. اختار "عرضي" عشان تلف الصفحات اللي عرضها أكبر من طولها بس، زي اللوحات اللي جوه تقرير.',
    'Turn this file 90° more': 'لِف الملف ده 90° كمان',
    'Turn this file': 'لِف الملف ده',
    'Rotating…': 'جاري التدوير…',
    // ----- compress -----
    'Make PDFs smaller for email and uploads, and see the new size before you save.': 'صغّر ملفات PDF للإيميل والرفع، وشوف الحجم الجديد قبل ما تحفظ.',
    'Compression': 'الضغط',
    'Light': 'خفيف',
    'best quality': 'أفضل جودة',
    'Recommended': 'مُقترح',
    'good quality': 'جودة كويسة',
    'Strong': 'قوي',
    'smallest': 'أصغر حجم',
    'Target size': 'حجم محدد',
    'you choose': 'أنت بتحدده',
    'The size each level gives is worked out for your first file.': 'حجم كل مستوى بيتحسب لأول ملف.',
    'Target size per file': 'الحجم المطلوب لكل ملف',
    'Convert pictures to grey (smaller)': 'حوّل الصور لرمادي (أصغر)',
    'Remove document details (author, title, keywords)': 'شيل بيانات الملف (المؤلف، العنوان، الكلمات المفتاحية)',
    'How to use Compress PDF': 'إزاي تستخدم ضغط PDF',
    ', or a folder of them.': '، أو فولدر فيه ملفات.',
    'Pick a level, or type a target size': 'اختار مستوى، أو اكتب الحجم اللي عايزه',
    'such as 2 MB. The size each level gives is shown before you start.': 'زي 2 ميجا. حجم كل مستوى بيظهر قبل ما تبدأ.',
    'and download, or save the smaller files into a folder.': 'ونزّل، أو احفظ الملفات الأصغر في فولدر.',
    'How much smaller will my PDF get?': 'الملف هيصغر قد إيه؟',
    'It depends on what is inside. Scans and photos shrink a lot, often by 60 to 90 percent. PDFs that are mostly text or CAD lines are already small and change little.': 'حسب اللي جواه. الممسوحات والصور بتصغر كتير، غالبًا من 60 لـ 90 في المية. الملفات اللي أغلبها نص أو خطوط CAD صغيرة أصلًا ومش بتتغير كتير.',
    'Can I compress a PDF to under 2 MB?': 'أقدر أضغط PDF لأقل من 2 ميجا؟',
    'Yes. Choose "Target size" and type 2. The tool tries stronger settings until the file fits, and tells you if it cannot get that small.': 'أيوه. اختار "حجم محدد" واكتب 2. الأداة بتجرب إعدادات أقوى لحد ما الملف يوصل للحجم، وبتقولك لو مش هينفع يصغر كده.',
    'Does it lower the quality of text and drawings?': 'هل بيقلل جودة النص والرسومات؟',
    'No. Only pictures and scans are made smaller. Text, lines and vector drawings stay sharp.': 'لأ. الصور والممسوحات بس هي اللي بتصغر. النص والخطوط والرسومات بتفضل حادة.',
    'Compressing…': 'جاري الضغط…',
    'Working out the size of each level…': 'جاري حساب حجم كل مستوى…',
    'Sizes for your file, worked out on your computer.': 'أحجام ملفك، محسوبة على جهازك.',
    'This file is large: the new size is shown when it is done.': 'الملف ده كبير: الحجم الجديد هيظهر لما يخلص.',
    'Type the size you need, for example 2 MB.': 'اكتب الحجم اللي محتاجه، مثلًا 2 ميجا.',
    'no smaller': 'مش هيصغر',
    'already small, kept as it was': 'صغير أصلًا، اتساب زي ما هو',
    // ----- OCR -----
    'Make scanned PDFs searchable and copyable, in Arabic, English and more.': 'خلّي ملفات PDF الممسوحة تقدر تدوّر فيها وتنسخ منها، عربي وإنجليزي وغيرهم.',
    'Languages in the document': 'اللغات اللي في الملف',
    'English': 'إنجليزي', 'Arabic': 'عربي', 'French': 'فرنساوي', 'German': 'ألماني', 'Spanish': 'إسباني', 'Urdu': 'أوردو', 'Hindi': 'هندي', 'Turkish': 'تركي',
    'Accuracy': 'الدقة',
    'Fast': 'سريع',
    'Accurate': 'دقيق',
    'Skip pages that already have text': 'سيب الصفحات اللي فيها نص أصلًا',
    'The first run downloads the reading engine and language files (a few MB), then it works offline.': 'أول مرة بينزّل محرك القراءة وملفات اللغات (كام ميجا)، وبعدها بيشتغل من غير نت.',
    'Make searchable': 'خلّيه قابل للبحث',
    'How to use OCR PDF': 'إزاي تستخدم OCR لملفات PDF',
    'Select your scanned PDFs.': 'اختار ملفات PDF الممسوحة.',
    'Tick the languages': 'علّم على اللغات',
    'written in them.': 'المكتوبة فيها.',
    '. The pages look the same, but you can now search, select and copy the text.': '. الصفحات شكلها زي ما هي، بس دلوقتي تقدر تدوّر وتحدد وتنسخ النص.',
    'Does the PDF look different after OCR?': 'هل شكل الملف بيتغير بعد الـ OCR؟',
    'No. The pages stay exactly as they were. An invisible text layer is added on top, so you can search and copy.': 'لأ. الصفحات بتفضل زي ما هي بالظبط. بتتضاف طبقة نص مخفية فوقها، عشان تقدر تدوّر وتنسخ.',
    'Does it read Arabic?': 'بيقرا عربي؟',
    'Yes. Tick Arabic, or both Arabic and English for mixed documents.': 'أيوه. علّم على عربي، أو عربي وإنجليزي للملفات المختلطة.',
    'Is there a page limit?': 'فيه حد لعدد الصفحات؟',
    'No. Long documents just take longer, because the reading happens on your own computer.': 'لأ. الملفات الطويلة بس بتاخد وقت أكتر، لأن القراءة بتحصل على جهازك أنت.',
    'Reading the pages…': 'جاري قراءة الصفحات…',
    'Loading the reading engine and language files (first time only)…': 'جاري تحميل محرك القراءة وملفات اللغات (أول مرة بس)…',
    'No new text was found.': 'ملقيناش نص جديد.',
    'Tick at least one language.': 'علّم على لغة واحدة على الأقل.',
    // ----- PDF to image -----
    'Turn PDF pages into images at the resolution you need, or take out the pictures inside.': 'حوّل صفحات PDF لصور بالدقة اللي محتاجها، أو طلّع الصور اللي جواه.',
    'Pictures inside': 'الصور اللي جواه',
    'Format': 'الصيغة',
    'Resolution': 'الدقة',
    'screen': 'شاشة', 'email': 'إيميل', 'print': 'طباعة', 'archive': 'أرشيف',
    'Other': 'غير ذلك',
    'DPI (20 to 1200)': 'DPI (من 20 لـ 1200)',
    'Colour': 'ملون',
    'Grey': 'رمادي',
    'Black & white': 'أبيض وأسود',
    'Quality': 'الجودة',
    '{name} = PDF name, {page} = page number, {total} = page count': '{name} = اسم الـ PDF، {page} = رقم الصفحة، {total} = عدد الصفحات',
    'One multi-page TIFF for each PDF': 'ملف TIFF واحد متعدد الصفحات لكل PDF',
    'Transparent background (PNG and WebP)': 'خلفية شفافة (PNG و WebP)',
    'Convert to images': 'حوّل لصور',
    'How to use PDF to JPG': 'إزاي تستخدم PDF إلى JPG',
    ', or a whole folder. They open in your browser and are not uploaded.': '، أو فولدر كامل. بيتفتحوا في المتصفح ومش بيترفعوا.',
    'Choose the format and resolution.': 'اختار الصيغة والدقة.',
    '150 DPI is good for email and screens, 300 DPI for printing.': '150 DPI كويس للإيميل والشاشات، و 300 DPI للطباعة.',
    ', then download the images as a ZIP or save them straight into a folder.': '، وبعدين نزّل الصور ZIP أو احفظها على طول في فولدر.',
    'What DPI should I choose?': 'أختار DPI كام؟',
    '72 DPI for screens and slides, 150 DPI for email and documents, 300 DPI for printing, 600 DPI for archives and fine drawings. The size of each image is shown before you convert.': '72 DPI للشاشات والعروض، 150 DPI للإيميل والمستندات، 300 DPI للطباعة، 600 DPI للأرشيف واللوحات الدقيقة. حجم كل صورة بيظهر قبل ما تحوّل.',
    'Which format is best?': 'أنهي صيغة أحسن؟',
    'JPG is small and good for photos and scans. PNG is sharp for text and drawings. WebP is smaller than both. TIFF is for printing and archives, and can hold all pages in one file.': 'JPG صغير وكويس للصور والممسوحات. PNG حاد للنص والرسومات. WebP أصغر من الاتنين. TIFF للطباعة والأرشيف، ويقدر يشيل كل الصفحات في ملف واحد.',
    'Is there a limit on files or pages?': 'فيه حد للملفات أو الصفحات؟',
    "No. Everything runs on your computer, so there is no file count or size limit, only your computer's memory for very large pages.": 'لأ. كل حاجة بتشتغل على جهازك، فمفيش حد لعدد الملفات أو حجمها، غير ذاكرة جهازك مع الصفحات الكبيرة جدًا.',
    'Can I get the pictures out of a PDF instead of whole pages?': 'أقدر أطلّع الصور اللي جوه الـ PDF بدل الصفحات كاملة؟',
    'Yes. Choose "Pictures inside" to save every photo and image in the PDF at its original size.': 'أيوه. اختار "الصور اللي جواه" عشان تحفظ كل صورة في الملف بحجمها الأصلي.',
    'Converting…': 'جاري التحويل…',
    'Your image is ready': 'الصورة جاهزة',
    'No pictures were found inside these PDFs. Choose "Every page" to turn the pages into images.': 'ملقيناش صور جوه الملفات دي. اختار "كل صفحة" عشان تحوّل الصفحات لصور.',
    // ----- image to PDF -----
    'Photos, scans and screenshots to PDF, in the order you want.': 'الصور والممسوحات ولقطات الشاشة إلى PDF، بالترتيب اللي عايزه.',
    'Select images': 'اختار الصور',
    'Page size': 'مقاس الصفحة',
    'Same as image': 'زي الصورة',
    'Orientation': 'الاتجاه',
    'Auto': 'تلقائي',
    'Margin': 'الهامش',
    'Small': 'صغير',
    'Big': 'كبير',
    'Make': 'اعمل',
    'One PDF': 'PDF واحد',
    'A PDF per image': 'PDF لكل صورة',
    'A PDF per folder': 'PDF لكل فولدر',
    'Image quality': 'جودة الصور',
    'no change': 'من غير تغيير',
    'Original': 'الأصلية',
    'Smaller file': 'ملف أصغر',
    'Convert to PDF': 'حوّل لـ PDF',
    'How to use JPG to PDF': 'إزاي تستخدم JPG إلى PDF',
    'Select your images': 'اختار الصور',
    'or a folder of them. JPG, PNG, WebP, GIF, BMP and TIFF all work.': 'أو فولدر فيه صور. JPG و PNG و WebP و GIF و BMP و TIFF كلهم شغالين.',
    'Put them in order': 'رتّبهم',
    'by dragging, or sort by name or date.': 'بالسحب، أو رتّب بالاسم أو التاريخ.',
    'Choose the page size and margins': 'اختار مقاس الصفحة والهوامش',
    ', then convert and download the PDF.': '، وبعدين حوّل ونزّل الـ PDF.',
    'Will my phone photos be sideways?': 'صور الموبايل هتطلع مقلوبة؟',
    'No. The rotation saved by the phone camera is read, so every photo is placed the right way up.': 'لأ. اتجاه الصورة اللي كاميرا الموبايل حفظته بيتقري، فكل صورة بتتحط في اتجاهها الصح.',
    'Does converting lower the quality?': 'التحويل بيقلل الجودة؟',
    'Not with "Original": JPG photos are placed in the PDF exactly as they are. "Smaller file" reduces them to 150 DPI for email.': 'مش مع "الأصلية": صور JPG بتتحط في الـ PDF زي ما هي بالظبط. "ملف أصغر" بيصغرها لـ 150 DPI عشان الإيميل.',
    'Can I make one PDF for each folder?': 'أقدر أعمل PDF لكل فولدر؟',
    'Yes. Select a folder with subfolders and choose "A PDF per folder": each folder becomes its own PDF.': 'أيوه. اختار فولدر فيه فولدرات فرعية واختار "PDF لكل فولدر": كل فولدر هيبقى PDF لوحده.',
    'Making your PDF…': 'جاري عمل الـ PDF…',
    'images.pdf': 'images.pdf',
    // ----- page numbers -----
    'Page numbers or Bates numbers, on one PDF or hundreds.': 'أرقام صفحات أو ترقيم Bates، على ملف PDF واحد أو مئات.',
    'Where the number goes on the page': 'مكان الرقم في الصفحة',
    'Text': 'النص',
    'Page 1': 'صفحة 1',
    'Page 1 of 10': 'صفحة 1 من 10',
    'Custom…': 'مخصص…',
    '{n} = number, {total} = last number, {file} = file name': '{n} = الرقم، {total} = آخر رقم، {file} = اسم الملف',
    'First number': 'أول رقم',
    'Pages to number': 'الصفحات اللي هتترقم',
    'All pages, or e.g. 2-': 'كل الصفحات، أو مثلًا 2-',
    'Skip the first page (cover)': 'سيب أول صفحة (الغلاف)',
    'Size and colour': 'الحجم واللون',
    'Font size': 'حجم الخط',
    'pt': 'pt',
    'Bold': 'عريض',
    'Distance from the edge': 'البعد عن الحافة',
    'mm': 'مم',
    'Double-sided: swap left and right on even pages': 'على الوشين: بدّل اليمين والشمال في الصفحات الزوجية',
    'Bates numbering: continue the numbers across all files': 'ترقيم Bates: كمّل الأرقام على كل الملفات',
    'Prefix': 'البادئة',
    'Digits': 'عدد الخانات',
    'Add page numbers': 'ضيف أرقام الصفحات',
    'How to use Add Page Numbers': 'إزاي تستخدم ترقيم الصفحات',
    ', or a folder.': '، أو فولدر.',
    'Choose where the number goes': 'اختار مكان الرقم',
    'and how it reads, like "Page 1 of 10".': 'وشكله، زي "صفحة 1 من 10".',
    'Add the numbers': 'ضيف الأرقام',
    'and download.': 'ونزّل.',
    'Can I skip the cover page?': 'أقدر أسيب صفحة الغلاف؟',
    'Yes. Tick "Skip the first page", or type the pages to number, like 2- for page 2 to the end. Set the first number to choose where counting starts.': 'أيوه. علّم على "سيب أول صفحة"، أو اكتب الصفحات اللي هتترقم، زي 2- من صفحة 2 للآخر. وحدد أول رقم عشان تختار العد يبدأ منين.',
    'What is Bates numbering?': 'يعني إيه ترقيم Bates؟',
    'One running number across a whole set of documents, with a prefix, such as DOC-000001 to DOC-000250. It is used for legal and contract documents and for document control.': 'رقم متصل على مجموعة مستندات كاملة، ببادئة، زي DOC-000001 لحد DOC-000250. بيستخدم في المستندات القانونية والعقود وفي الـ Document Control.',
    'Can I number many PDFs at once?': 'أقدر أرقّم ملفات PDF كتير مرة واحدة؟',
    'Yes. Select as many files as you like, or a whole folder. Each file gets its own numbers, or one running number with Bates numbering.': 'أيوه. اختار ملفات قد ما تحب، أو فولدر كامل. كل ملف بياخد أرقامه، أو رقم واحد متصل مع ترقيم Bates.',
    'Numbering pages…': 'جاري ترقيم الصفحات…',
    'Type the text for the page numbers.': 'اكتب نص أرقام الصفحات.',
    // ----- watermark -----
    'Stamp a word or your logo on every page: DRAFT, CONFIDENTIAL, any language.': 'اطبع كلمة أو اللوجو بتاعك على كل صفحة: DRAFT، CONFIDENTIAL، بأي لغة.',
    'Watermark': 'العلامة المائية',
    'Image or logo': 'صورة أو لوجو',
    'Image': 'الصورة',
    'Choose image…': 'اختار صورة…',
    'PNG or JPG': 'PNG أو JPG',
    'Repeat across the page': 'كرّرها على الصفحة كلها',
    'Size': 'الحجم',
    'of the page width': 'من عرض الصفحة',
    'Angle': 'الزاوية',
    'Opacity': 'الوضوح',
    'Layer': 'الطبقة',
    'Over the content': 'فوق المحتوى',
    'Under the content': 'تحت المحتوى',
    'Add watermark': 'ضيف العلامة المائية',
    'How to use Add Watermark': 'إزاي تستخدم العلامة المائية',
    'Type the text or choose your logo': 'اكتب النص أو اختار اللوجو',
    ', then set the position, size, angle and transparency. The preview shows the first page.': '، وبعدين حدد المكان والحجم والزاوية والشفافية. المعاينة بتوريك أول صفحة.',
    'Add the watermark': 'ضيف العلامة المائية',
    'Can I write the watermark in Arabic?': 'أقدر أكتب العلامة المائية بالعربي؟',
    'Yes. Any language works, including Arabic, with the letters joined correctly.': 'أيوه. أي لغة شغالة، ومنها العربي، والحروف بتتوصل صح.',
    'Over or under the content?': 'فوق المحتوى ولا تحته؟',
    '"Over" is always visible. "Under" sits behind text and drawings like a light background, but it can be hidden on scanned pages, which are pictures.': '"فوق" بتبان دايمًا. "تحت" بتبقى ورا النص والرسومات زي خلفية خفيفة، بس ممكن تستخبى في الصفحات الممسوحة لأنها صور.',
    'Preview of page 1': 'معاينة الصفحة 1',
    'Preview of the first page': 'معاينة أول صفحة',
    'Adding the watermark…': 'جاري إضافة العلامة المائية…',
    'Choose the image for the watermark.': 'اختار صورة العلامة المائية.',
    'Type the watermark text.': 'اكتب نص العلامة المائية.',
    // ----- crop -----
    'Drag on the page to draw the area to keep.': 'اسحب على الصفحة عشان ترسم الجزء اللي هتحتفظ بيه.',
    'How': 'الطريقة',
    'Draw the area': 'ارسم المنطقة',
    'Trim white margins': 'شيل الهوامش البيضاء',
    'Margins to cut (mm)': 'الهوامش اللي هتتقص (مم)',
    'Top': 'فوق', 'Bottom': 'تحت', 'Left': 'شمال', 'Right': 'يمين',
    'Space to keep around the content': 'المسافة اللي تفضل حوالين المحتوى',
    'How to use Crop PDF': 'إزاي تستخدم قص PDF',
    'Drag a box': 'اسحب مربع',
    'on the page around what you want to keep, or choose "Trim white margins".': 'على الصفحة حوالين اللي عايز تحتفظ بيه، أو اختار "شيل الهوامش البيضاء".',
    'Crop': 'قص',
    'Is the cropped part deleted?': 'الجزء اللي اتقص بيتمسح؟',
    'It is hidden: every PDF reader shows and prints only the area you kept. The original content is still inside the file.': 'بيستخبى: أي برنامج PDF بيعرض ويطبع الجزء اللي احتفظت بيه بس. المحتوى الأصلي لسه جوه الملف.',
    'Can I trim different margins on each page?': 'أقدر أقص هوامش مختلفة في كل صفحة؟',
    'Yes. "Trim white margins" finds the content on each page separately and cuts around it.': 'أيوه. "شيل الهوامش البيضاء" بيلاقي المحتوى في كل صفحة لوحدها ويقص حواليه.',
    'Cropping…': 'جاري القص…',
    'Drag on the page to draw the area to keep, or type the margins to cut.': 'اسحب على الصفحة عشان ترسم الجزء اللي هتحتفظ بيه، أو اكتب الهوامش اللي هتتقص.',
    // ----- compare -----
    'Two versions of a document or drawing: see exactly what was removed and what was added.': 'نسختين من مستند أو لوحة: شوف بالظبط إيه اللي اتشال وإيه اللي اتضاف.',
    'Select the two PDFs': 'اختار ملفين الـ PDF',
    'Show': 'العرض',
    'Overlay': 'فوق بعض',
    'Side by side': 'جنب بعض',
    'Sensitivity': 'الحساسية',
    'Low': 'منخفضة',
    'ignores tiny shifts': 'بتتجاهل الإزاحات الصغيرة',
    'Normal': 'عادية',
    'High': 'عالية',
    'every pixel': 'كل بكسل',
    'Compare the text too': 'قارن النص كمان',
    'The first file is the old version, the second the new one. Drag to swap them.': 'الملف الأول هو النسخة القديمة، والتاني الجديدة. اسحب عشان تبدّلهم.',
    'Download the report': 'نزّل التقرير',
    'How to use Compare PDF': 'إزاي تستخدم مقارنة PDF',
    'Select the two versions': 'اختار النسختين',
    'of the PDF: the old one first, then the new one.': 'من الملف: القديمة الأول، وبعدين الجديدة.',
    'Look at each page': 'بص على كل صفحة',
    ': removed parts are red, added parts are green. Switch to side by side if you prefer.': ': الأجزاء اللي اتشالت بالأحمر، واللي اتضافت بالأخضر. حوّل لجنب بعض لو تحب.',
    ': a PDF with every changed page marked, to send or file.': ': ملف PDF فيه كل صفحة اتغيرت متعلّم عليها، تبعته أو تحفظه.',
    'Does it work for drawings?': 'بيشتغل مع اللوحات؟',
    'Yes. Drawings are compared as pictures, line by line, so moved walls, new dimensions and deleted notes all show. It works for scanned pages too.': 'أيوه. اللوحات بتتقارن كصور، خط بخط، فالحيطان اللي اتحركت والأبعاد الجديدة والملاحظات اللي اتمسحت كلها بتبان. وبيشتغل مع الصفحات الممسوحة كمان.',
    'What if the pages are different sizes?': 'ولو الصفحات مقاساتها مختلفة؟',
    'The new page is scaled to the old page, so a drawing printed to a different paper size still lines up.': 'الصفحة الجديدة بتتظبط على مقاس القديمة، فاللوحة اللي اتطبعت على مقاس ورق مختلف برضه بتيجي على بعض.',
    'Are my files uploaded?': 'ملفاتي بتترفع؟',
    'No. Both PDFs are compared in your browser.': 'لأ. الملفين بيتقارنوا في متصفحك.',
    'Old': 'القديم',
    'New': 'الجديد',
    'Removed (only in the old version)': 'اتشال (في النسخة القديمة بس)',
    'Added (only in the new version)': 'اتضاف (في النسخة الجديدة بس)',
    'Changed area': 'منطقة اتغيرت',
    'Comparing…': 'جاري المقارنة…',
    'No visible change on this page.': 'مفيش تغيير باين في الصفحة دي.',
    'The text is the same.': 'النص زي ما هو.',
    'Add the second PDF (the new version).': 'ضيف الملف التاني (النسخة الجديدة).',
    'Keep only two PDFs: the old version and the new one.': 'خلّي ملفين بس: النسخة القديمة والجديدة.',
    'Select exactly two PDFs: the old version and the new one.': 'اختار ملفين بالظبط: النسخة القديمة والجديدة.',
    'Comparing the pages…': 'جاري مقارنة الصفحات…',
    'Making the report…': 'جاري عمل التقرير…',
    'Your comparison report is ready': 'تقرير المقارنة جاهز',
    // ----- protect / unlock -----
    'Lock PDFs with a password, and choose what people can do with them.': 'اقفل ملفات PDF بكلمة سر، واختار الناس تقدر تعمل إيه بيها.',
    'Password': 'كلمة السر',
    'Type it again': 'اكتبها تاني',
    'Show the password': 'اظهر كلمة السر',
    'People who open it can': 'اللي هيفتحه يقدر',
    'Print': 'يطبع',
    'Copy text and images': 'ينسخ النص والصور',
    'Add comments and fill forms': 'يضيف تعليقات ويملا النماذج',
    'Edit, and add or remove pages': 'يعدّل، ويضيف أو يشيل صفحات',
    'Encryption': 'التشفير',
    'recommended': 'مُقترح',
    'older readers': 'البرامج القديمة',
    'Owner password': 'كلمة سر المالك',
    'Optional': 'اختياري',
    'Lets you change the permissions later. Without it, a random one is used.': 'بتخليك تغيّر الصلاحيات بعدين. من غيرها، بتتحط واحدة عشوائية.',
    'How to use Protect PDF': 'إزاي تستخدم حماية PDF',
    'Type a password': 'اكتب كلمة سر',
    'and choose what people may do: print, copy, edit.': 'واختار الناس تقدر تعمل إيه: تطبع، تنسخ، تعدّل.',
    'Protect': 'احمي',
    'and download. The PDFs ask for the password when opened.': 'ونزّل. الملفات هتطلب كلمة السر لما تتفتح.',
    'Is my password sent anywhere?': 'كلمة السر بتتبعت لأي مكان؟',
    'No. The files are encrypted in your browser. Neither the files nor the password leave your computer.': 'لأ. الملفات بتتشفر في متصفحك. لا الملفات ولا كلمة السر بيخرجوا من جهازك.',
    'How strong is the protection?': 'الحماية قوية قد إيه؟',
    'AES-256, the strongest encryption PDF supports. Use a long password: it cannot be recovered if you forget it.': 'AES-256، أقوى تشفير بيدعمه PDF. استخدم كلمة سر طويلة: مش هينفع ترجعها لو نسيتها.',
    'Encrypting…': 'جاري التشفير…',
    'Keep the password safe: it cannot be recovered.': 'احتفظ بكلمة السر في مكان آمن: مش هينفع ترجعها.',
    'The owner password cannot contain a comma (,).': 'كلمة سر المالك ماينفعش يكون فيها فاصلة (,).',
    'The password cannot contain a comma (,).': 'كلمة السر ماينفعش يكون فيها فاصلة (,).',
    'The two passwords are not the same.': 'كلمتين السر مش زي بعض.',
    'Type a password.': 'اكتب كلمة سر.',
    'Remove the password and the print, copy and edit restrictions from your PDFs.': 'شيل كلمة السر وقيود الطباعة والنسخ والتعديل من ملفات PDF بتاعتك.',
    'Only if the PDF asks for one': 'بس لو الملف بيطلبها',
    'Files marked 🔒 need the password to open. Files that only block printing or copying are unlocked without one.': 'الملفات اللي عليها 🔒 محتاجة كلمة السر عشان تتفتح. والملفات اللي بتمنع الطباعة أو النسخ بس بتتفك من غيرها.',
    'How to use Unlock PDF': 'إزاي تستخدم فك حماية PDF',
    'Select the protected PDFs.': 'اختار ملفات PDF المحمية.',
    'Type the password': 'اكتب كلمة السر',
    'if they ask for one when you open them.': 'لو بتطلبها لما تفتحها.',
    'Unlock': 'فك الحماية',
    'and download PDFs that open, print and copy freely.': 'ونزّل ملفات بتتفتح وتتطبع وتتنسخ عادي.',
    'Can it open a PDF without knowing the password?': 'يقدر يفتح PDF من غير ما أعرف كلمة السر؟',
    'No. You need the password that opens the file. Restrictions on printing, copying or editing are removed without it.': 'لأ. محتاج كلمة السر اللي بتفتح الملف. قيود الطباعة والنسخ والتعديل بتتشال من غيرها.',
    'Only unlock files you are allowed to': 'فك حماية الملفات المسموح لك بيها بس',
    'Use this for your own files, or files whose owner allows it.': 'استخدمها لملفاتك أنت، أو ملفات صاحبها بيسمح بكده.',
    'Unlocking…': 'جاري فك الحماية…',
    'These PDFs need their password to open. Type it, then try again.': 'الملفات دي محتاجة كلمة السر عشان تتفتح. اكتبها وجرّب تاني.',
    'was not protected': 'ماكانش محمي',
    'password removed': 'كلمة السر اتشالت',
    'restrictions removed': 'القيود اتشالت',
    'Helvetica / Arial': 'Helvetica / Arial',
    'Download': 'نزّل',
    'Save into a folder': 'احفظ في فولدر',
  };
  for (const [k, v] of Object.entries(ADD)) if (!Object.prototype.hasOwnProperty.call(AR, k)) AR[k] = v;
  PATTERNS.push(
    [/^(\d+) file\(s\) · (\d+) page\(s\) · (.+)$/, '$1 ملف · $2 صفحة · $3'],
    [/^(\d+) image\(s\) · (.+)$/, '$1 صورة · $2'],
    [/^(\d+) files are ready$/, '$1 ملف جاهزين'],
    [/^(\d+) images are ready$/, '$1 صورة جاهزين'],
    [/^(.+) · done in ([\d.]+) s, on your computer$/, '$1 · خلص في $2 ثانية، على جهازك'],
    [/^Saved (\d+) file\(s\) into “(.*)”\.$/, 'اتحفظ $1 ملف في “$2”.'],
    [/^(.+) · page (\d+) of (\d+)$/, '$1 · صفحة $2 من $3'],
    [/^(.+) · reading page (\d+) of (\d+)$/, '$1 · جاري قراءة صفحة $2 من $3'],
    [/^(.+) · part (\d+) of (\d+)$/, '$1 · جزء $2 من $3'],
    [/^(.+) · picture (\d+) of (\d+)$/, '$1 · صورة $2 من $3'],
    [/^page (\d+) of (\d+)$/, 'صفحة $1 من $2'],
    [/^(\d+) page\(s\) numbered$/, 'اترقم $1 صفحة'],
    [/^(\d+) page\(s\) turned$/, 'اتلف $1 صفحة'],
    [/^(\d+) page\(s\)$/, '$1 صفحة'],
    [/^(\d+) page\(s\) cropped$/, 'اتقص $1 صفحة'],
    [/^(\d+) page\(s\) cropped, (\d+) left as they were$/, 'اتقص $1 صفحة، و $2 اتسابوا زي ما هم'],
    [/^(\d+) page\(s\) made searchable$/, '$1 صفحة بقت قابلة للبحث'],
    [/^(\d+) page\(s\) made searchable, (\d+) already had text$/, '$1 صفحة بقت قابلة للبحث، و $2 كان فيها نص أصلًا'],
    [/^About ([\d,]+) words found\. Open the PDF and press Ctrl\+F to search it\.$/, 'لقينا حوالي $1 كلمة. افتح الملف واضغط Ctrl+F عشان تدوّر فيه.'],
    [/^(\d+) page\(s\) · about (\d+) seconds$/, '$1 صفحة · حوالي $2 ثانية'],
    [/^(\d+) page\(s\) · about (\d+) minutes$/, '$1 صفحة · حوالي $2 دقيقة'],
    [/^(\d+) files · (\d+) pages$/, '$1 ملف · $2 صفحة'],
    [/^(\d+) files → 1 PDF of (\d+) pages$/, '$1 ملف ← PDF واحد فيه $2 صفحة'],
    [/^pages? (.+) · (.+) · one page is over the limit$/, 'صفحات $1 · $2 · صفحة واحدة أكبر من الحد'],
    [/^pages? (.+) · ([\d.]+ [KMG]?B)$/, 'صفحات $1 · $2'],
    [/^(.+) has no bookmarks\. Choose another way to split\.$/, '$1 مافيهوش إشارات مرجعية. اختار طريقة تانية للتقسيم.'],
    [/^No bookmarks, not split: (.+)$/, 'مافيهاش إشارات مرجعية، متقسمتش: $1'],
    [/^(.+) → (about )?(\d+) file\(s\)$/, (a, b, n) => `${a === 'Each PDF' ? 'كل PDF' : a === 'This PDF' ? 'الملف ده' : a} ← ${b ? 'حوالي ' : ''}${n} ملف`],
    [/^(\d+) page\(s\) in the new PDF$/, '$1 صفحة في الملف الجديد'],
    [/^(\d+) image\(s\) → (.+)$/, '$1 صورة ← $2'],
    [/^(\d+) image\(s\)$/, '$1 صورة'],
    [/^(.+) · −(\d+)%$/, '$1 · −$2%'],
    [/^−(\d+)% \(was (.+)\)$/, '−$1% (كان $2)'],
    [/^smallest possible: (.+)$/, 'أصغر حجم ممكن: $1'],
    [/^Your PDFs? (?:is|are) (\d+)% smaller$/, 'ملفاتك بقت أصغر بـ $1%'],
    [/^(\d+) files · (.+) now$/, '$1 ملف · $2 دلوقتي'],
    [/^([\d.]+ [KMG]?B) now$/, '$1 دلوقتي'],
    [/^Sizes for (.+)\. The other files are done the same way\.$/, 'الأحجام لـ $1. باقي الملفات بتتعمل بنفس الطريقة.'],
    [/^Drag on the page to draw the area to keep\. Page 1 is (\d+) × (\d+) mm\.$/, 'اسحب على الصفحة عشان ترسم الجزء اللي هتحتفظ بيه. الصفحة 1 مقاسها $1 × $2 مم.'],
    [/^Page (\d+)$/, 'صفحة $1'],
    [/^Page (\d+) · (.+)$/, (n, rest) => `صفحة ${n} · ${lookup(rest) || rest}`],
    [/^(\d+) changed areas? · (less than 0\.1|[\d.]+)% of the drawing changed$/, (n, p) => `${n} منطقة اتغيرت · ${p === 'less than 0.1' ? 'أقل من 0.1' : p}% من اللوحة اتغير`],
    [/^This page is only in the (old|new) version\.$/, (v) => `الصفحة دي موجودة في النسخة ${v === 'old' ? 'القديمة' : 'الجديدة'} بس.`],
    [/^Comparing page (\d+) of (\d+)…$/, 'جاري مقارنة صفحة $1 من $2…'],
    [/^(\d+) of (\d+) page\(s\) changed$/, '$1 من $2 صفحة اتغيرت'],
    [/^(\d+) of (\d+) page\(s\) changed · the old PDF has (\d+) pages, the new one (\d+)$/, '$1 من $2 صفحة اتغيرت · الملف القديم فيه $3 صفحة، والجديد $4'],
    [/^Comparing page (\d+) of (\d+)… · the old PDF has (\d+) pages, the new one (\d+)$/, 'جاري مقارنة صفحة $1 من $2… · الملف القديم فيه $3 صفحة، والجديد $4'],
    [/^(\d+) changed page\(s\) in the report$/, '$1 صفحة متغيرة في التقرير'],
    [/^(\d+) changed page\(s\)$/, '$1 صفحة متغيرة'],
    [/^Old · (.+)$/, 'القديم · $1'],
    [/^New · (.+)$/, 'الجديد · $1'],
    [/^Wrong password for (.+)\.$/, 'كلمة السر غلط لـ $1.'],
    [/^Wrong password, not unlocked: (.+)$/, 'كلمة السر غلط، متفكتش الحماية: $1'],
    [/^These need their password to open, not unlocked: (.+)$/, 'محتاجين كلمة السر عشان يتفتحوا، متفكتش الحماية: $1'],
    [/^(\S*\d) to about (\S*\d)$/, '$1 لحد حوالي $2'],
    [/^Pictures from (\d+) page\(s\)$/, 'صور من $1 صفحة'],
    [/^(\d+) very large page\(s\) were made at a lower DPI so your browser has enough memory\.$/, '$1 صفحة كبيرة جدًا اتعملت بـ DPI أقل عشان ذاكرة المتصفح تكفي.'],
    [/^Files to Excel$/, 'الملفات إلى Excel'],
    [/^· (.*[A-Za-z].*)$/, (rest) => { const t = lookup(rest); return t == null ? null : '· ' + t; }],
  );
  window.FMLang = { get: () => lang, set: setLang, t: (s) => (lang === 'ar' ? lookup(norm(s)) || s : s) };
})();
