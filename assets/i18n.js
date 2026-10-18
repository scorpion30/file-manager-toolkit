/* English / Arabic switch. Loaded in <head>: sets the page direction before it paints,
 * then translates text, placeholders and titles - including text the tools create later -
 * using an English-to-Arabic dictionary. File names and user data are never translated. */
(() => {
  'use strict';
  const KEY = 'fm-lang';
  const root = document.documentElement;

  const AR = {
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
    'in the title block, so every comment gets its sheet number. You can add a second box for the sheet title. This step is optional: without a box, the file name is used.': 'في الـ Title Block، ليأخذ كل تعليق رقم لوحته. يمكنك إضافة مربع ثانٍ لعنوان اللوحة. هذه الخطوة اختيارية: بدون مربع يُستخدم اسم الملف.',
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
  // A visitor is only sent to the other language when they chose it before, or when an
  // Arabic browser opens an English page; crawlers (no choice, English) stay where they are.
  const pageLang = root.getAttribute('data-lang-page');
  const altHref = (l) => {
    const link = document.querySelector(`link[rel="alternate"][hreflang="${l}"]`);
    return link ? link.getAttribute('data-switch') || link.getAttribute('href') : null;
  };
  if (pageLang) {
    const want = stored === 'ar' || stored === 'en' ? stored : (pageLang === 'en' && browserAr ? 'ar' : pageLang);
    if (want !== pageLang && altHref(want)) {
      location.replace(altHref(want) + location.hash);
      return;
    }
    lang = pageLang;
  }
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
      if (m) return pluralize(typeof rep === 'function' ? rep(...m.slice(1)) : key.replace(re, rep));
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
    link.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap';
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
  window.FMLang = { get: () => lang, set: setLang, t: (s) => (lang === 'ar' ? lookup(norm(s)) || s : s) };
})();
