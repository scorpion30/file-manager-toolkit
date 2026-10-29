// Arabic for the guide pages (guides/*.html), used only by tools/build.mjs.
// Keys are the English text exactly as on the page (spaces collapsed); run the build to see what is missing.
// Shared words (header, footer, tool and button names) come from assets/i18n.js.
export default {
  // ----- shared by all guides -----
  "/ Guide": "/ شرح",
  "Short answer": "الإجابة باختصار",
  "Step by step": "خطوة بخطوة",
  "Related guides": "شروحات أخرى",
  "Guides": "شروحات",
  "Tips": "نصائح",
  "Rename PDFs from title block": "تسمية PDF من جدول العنوان",
  "Drawing register from PDFs": "قائمة لوحات من PDF",
  "Merge PDF without uploading": "دمج PDF بدون رفع",
  "Folder file list to Excel": "أسماء الملفات إلى Excel",
  "PDF comments to Excel": "تعليقات PDF إلى Excel",
  "Rename PDF drawings from the title block": "إعادة تسمية لوحات PDF من جدول العنوان",
  "Make a drawing register in Excel from PDF drawings": "عمل قائمة لوحات في Excel من ملفات PDF",
  "List all files in a folder and subfolders to Excel": "نسخ أسماء كل الملفات في مجلد ومجلداته الفرعية إلى Excel",
  "Merge PDF files without uploading them": "دمج ملفات PDF بدون رفعها",
  "Export PDF comments to an Excel comment sheet": "تصدير تعليقات PDF إلى جدول تعليقات Excel",
  "Free, runs in your browser, and your drawings never leave your computer.": "مجاني، يعمل داخل متصفحك، ولوحاتك لا تخرج من جهازك أبداً.",
  "Free, runs in your browser, and your files never leave your computer.": "مجاني، يعمل داخل متصفحك، وملفاتك لا تخرج من جهازك أبداً.",

  // ----- rename-pdf-drawings-from-title-block -----
  "How to rename PDF drawings from the title block": "طريقة إعادة تسمية ملفات PDF للوحات من جدول العنوان (Title Block)",
  "Turn files like Scan_0001.pdf into names like NB3-ARC-DWG-1001 - GROUND FLOOR PLAN.pdf, for a whole folder of drawings at once, using the drawing number and title written in each title block.":
    "حوّل أسماء ملفات مثل Scan_0001.pdf إلى أسماء مثل NB3-ARC-DWG-1001 - GROUND FLOOR PLAN.pdf لمجلد كامل من اللوحات مرة واحدة، باستخدام رقم اللوحة وعنوانها المكتوبين في جدول العنوان لكل لوحة.",
  "Open Rename from Title Block →": "افتح أداة التسمية من الـ Title Block ←",
  "Free, no account, works in Chrome and Edge.": "مجانية، بدون حساب، وتعمل على Chrome و Edge.",
  "Open Rename from Title Block, choose the folder with your PDF drawings, drag a box around the drawing number on one sheet, check the new names and click Apply Rename. The tool reads the same box on every PDF and renames each file after what it finds there.":
    "افتح أداة التسمية من الـ Title Block، واختر المجلد الذي فيه لوحات PDF، وارسم مربعاً حول رقم اللوحة على لوحة واحدة، ثم راجع الأسماء الجديدة واضغط \"تطبيق إعادة التسمية\". الأداة تقرأ نفس المربع في كل ملف PDF وتسمّي كل ملف بما تجده فيه.",
  "Why renaming drawings by hand takes so long": "لماذا تأخذ إعادة تسمية اللوحات يدوياً وقتاً طويلاً",
  "Plotted sets, scanned sets and files from consultants rarely arrive with useful names. A typical issue folder is full of names like Scan_0001.pdf, Layout1.pdf or A3 print (2).pdf, while the real drawing number and title are only written inside the title block.":
    "ملفات الطباعة والملفات الممسوحة ضوئياً والملفات القادمة من الاستشاري نادراً ما تصل بأسماء مفيدة. مجلد الإصدار المعتاد مليء بأسماء مثل Scan_0001.pdf أو Layout1.pdf أو A3 print (2).pdf، بينما رقم اللوحة وعنوانها الحقيقيان مكتوبان فقط داخل جدول العنوان.",
  "Renaming them by hand means opening every PDF, reading the number, typing it and checking you did not swap two sheets. With 50 or 300 drawings that is an afternoon of work and an easy place to make a mistake that ends up in a transmittal. The title block already holds the right name, so the faster way is to let the computer read it.":
    "إعادة تسميتها يدوياً تعني فتح كل ملف PDF، وقراءة الرقم، وكتابته، والتأكد أنك لم تبدّل بين لوحتين. مع 50 أو 300 لوحة يصبح هذا يوم عمل كاملاً، ومكاناً سهلاً لخطأ يصل إلى خطاب الإرسال. جدول العنوان فيه الاسم الصحيح بالفعل، فالأسرع أن تترك الكمبيوتر يقرأه.",
  "Open the tool and click Select Folder. Pick the folder that holds the PDF drawings. Tick Include subfolders if the sheets are split into folders by discipline.":
    "افتح الأداة واضغط \"اختر فولدر\". اختر المجلد الذي فيه لوحات PDF. فعّل \"تضمين الفولدرات الفرعية\" إذا كانت اللوحات موزعة على مجلدات حسب التخصص.",
  "Draw a box around the drawing number": "ارسم مربعاً حول رقم اللوحة",
  "The first drawing opens on screen. Drag a box around the drawing number in the title block. Draw a second box around the drawing title, and a third around the revision if you want those in the name too.":
    "تظهر أول لوحة على الشاشة. اسحب مربعاً حول رقم اللوحة في جدول العنوان. ارسم مربعاً ثانياً حول عنوان اللوحة، وثالثاً حول رقم المراجعة إذا أردت إضافتهما إلى الاسم.",
  "Build the name pattern": "اكتب نمط الاسم",
  "Each box gets a number. A pattern like {1} - {2} gives the drawing number, a dash and the title. Click the chips under the pattern to add a box, or {name} to keep the old file name in the new one.":
    "كل مربع يأخذ رقماً. النمط {1} - {2} يعطي رقم اللوحة ثم شرطة ثم العنوان. اضغط على الأزرار الصغيرة تحت النمط لإضافة مربع، أو {name} للاحتفاظ بالاسم القديم داخل الاسم الجديد.",
  "Check the new names": "راجع الأسماء الجديدة",
  "The tool reads the boxes on every PDF and shows the current name next to the new name. Click any new name to correct it. Files that would get the same name get (2), (3) added, so nothing is overwritten.":
    "تقرأ الأداة المربعات في كل ملف PDF وتعرض الاسم الحالي بجانب الاسم الجديد. اضغط على أي اسم جديد لتصحيحه. الملفات التي ستأخذ نفس الاسم يضاف لها (2) و (3)، فلا يُستبدل أي ملف.",
  "Apply the rename": "طبّق إعادة التسمية",
  "Click Apply Rename. In Chrome or Edge the files are renamed right in your folder. If something looks wrong, click Undo last rename. In other browsers you get a ZIP with the renamed copies.":
    "اضغط \"تطبيق إعادة التسمية\". في Chrome أو Edge تتغير أسماء الملفات داخل مجلدك مباشرة. وإذا ظهر خطأ، اضغط \"تراجع عن آخر تسمية\". في المتصفحات الأخرى تحصل على ملف ZIP فيه النسخ بالأسماء الجديدة.",
  "Boxes drawn around the drawing number and title in the title block of a PDF drawing": "مربعات حول رقم اللوحة وعنوانها في جدول العنوان للوحة PDF",
  "Step 2: one box around the drawing number and one around the title.": "الخطوة 2: مربع حول رقم اللوحة ومربع حول العنوان.",
  "List of PDF drawings with their current names and the new names read from the title block": "قائمة لوحات PDF بأسمائها الحالية والأسماء الجديدة المقروءة من جدول العنوان",
  "Step 4: every new name is shown before anything is renamed.": "الخطوة 4: كل اسم جديد يظهر قبل تغيير أي ملف.",
  "Name patterns that work well": "أنماط أسماء مفيدة",
  "{1} gives the drawing number only, for example NB3-ARC-DWG-1001.pdf.": "{1} يعطي رقم اللوحة فقط، مثل NB3-ARC-DWG-1001.pdf.",
  "{1} - {2} gives the number and title, the most common format for issue sets.": "{1} - {2} يعطي الرقم والعنوان، وهو الشكل الأشهر لملفات الإصدار.",
  "{1}_{3} adds the revision, for example NB3-ARC-DWG-1001_C02.pdf, useful when you keep several revisions in one folder.": "{1}_{3} يضيف رقم المراجعة، مثل NB3-ARC-DWG-1001_C02.pdf، ومفيد عندما تحتفظ بأكثر من مراجعة في نفس المجلد.",
  "Tick Convert to UPPER CASE if your office standard writes file names in capitals.": "فعّل \"تحويل إلى أحرف كبيرة\" إذا كان نظام مكتبك يكتب أسماء الملفات بحروف كبيرة.",
  "Characters that Windows does not allow in file names, such as / or :, are replaced with a dash automatically, so a title like \"PLAN / SECTION\" does not break the rename.":
    "الرموز التي لا يسمح بها Windows في أسماء الملفات، مثل / أو :، تُستبدل بشرطة تلقائياً، فعنوان مثل \"PLAN / SECTION\" لا يوقف إعادة التسمية.",
  "Scanned drawings and Arabic title blocks": "اللوحات الممسوحة ضوئياً وجداول العنوان بالعربي",
  "Most PDFs plotted from AutoCAD or Revit have real text, which is read exactly. When a sheet was scanned or the text was exploded into lines, the tool uses OCR on the box instead. Open Reading options to choose English, Arabic or both, and set Codes only when the box holds a drawing number, so letters like O and the number 0 are not mixed up.":
    "أغلب ملفات PDF المطبوعة من AutoCAD أو Revit فيها نص حقيقي يُقرأ بدقة. وإذا كانت اللوحة ممسوحة ضوئياً أو النص مفكوكاً إلى خطوط، تستخدم الأداة OCR على المربع. افتح خيارات القراءة لاختيار الإنجليزية أو العربية أو الاثنين، واختر \"أكواد فقط\" عندما يكون المربع فيه رقم لوحة، حتى لا يختلط حرف O مع الرقم 0.",
  "Before you send the set": "قبل إرسال الإصدار",
  "Click Export list to Excel to keep a record of old and new names. After renaming, the Pre-flight Check can compare the file names with the title blocks and with your Excel drawing list, so duplicated numbers or missing sheets are caught before the transmittal goes out.":
    "اضغط \"تصدير القائمة إلى Excel\" لتحتفظ بسجل للأسماء القديمة والجديدة. وبعد التسمية، يقارن \"فحص قبل التسليم\" أسماء الملفات بجداول العنوان وبقائمة اللوحات في Excel، فتكتشف الأرقام المكررة أو اللوحات الناقصة قبل إرسال الخطاب.",
  "Rename your drawings now": "سمِّ لوحاتك الآن",
  "Can I rename PDF files based on their content for free?": "هل يمكن إعادة تسمية ملفات PDF حسب محتواها مجاناً؟",
  "Yes. Rename from Title Block is free and has no limit on the number of files. It reads the text inside a box you draw on the drawing and uses it as the file name.":
    "نعم. أداة التسمية من الـ Title Block مجانية وبدون حد لعدد الملفات. تقرأ النص داخل مربع ترسمه على اللوحة وتستخدمه كاسم للملف.",
  "Are my drawings uploaded to a server?": "هل تُرفع لوحاتي على سيرفر؟",
  "No. The PDFs are opened by your browser on your own computer. Nothing is sent to any server, which is why it is safe for client and tender drawings.":
    "لا. متصفحك هو الذي يفتح ملفات PDF على جهازك. لا يُرسل أي شيء لأي سيرفر، ولذلك هي آمنة للوحات العملاء والمناقصات.",
  "What if the title block is in a different place on some sheets?": "ماذا لو كان جدول العنوان في مكان مختلف في بعض اللوحات؟",
  "Run the tool once for each title block layout, for example once for A1 sheets and once for A3 sheets. You can also correct any single name by clicking it before you apply.":
    "شغّل الأداة مرة لكل شكل من جدول العنوان، مثلاً مرة للوحات A1 ومرة للوحات A3. ويمكنك أيضاً تصحيح أي اسم بالضغط عليه قبل التطبيق.",
  "Does it work with scanned drawings?": "هل تعمل مع اللوحات الممسوحة ضوئياً؟",
  "Yes. If the box has no real text, OCR reads it in English, Arabic or both. Use a higher OCR DPI for small text.": "نعم. إذا لم يكن في المربع نص حقيقي، يقرأه OCR بالإنجليزية أو العربية أو الاثنين. استخدم دقة OCR أعلى للنص الصغير.",
  "Can I undo the rename?": "هل يمكن التراجع عن إعادة التسمية؟",
  "Yes. In Chrome and Edge, Undo last rename puts the old names back. You can also export the list of old and new names to Excel.": "نعم. في Chrome و Edge يعيد زر \"تراجع عن آخر تسمية\" الأسماء القديمة. ويمكنك أيضاً تصدير قائمة الأسماء القديمة والجديدة إلى Excel.",

  // ----- pdf-drawings-to-excel-drawing-register -----
  "How to make a drawing register in Excel from PDF drawings": "تحويل PDF إلى Excel: طريقة عمل قائمة لوحات (Drawing Register) من ملفات PDF",
  "Read the drawing number, title and revision from the title block of every PDF in a set, and get them as rows in an Excel sheet, without typing a single line.":
    "اقرأ رقم اللوحة وعنوانها ورقم المراجعة من جدول العنوان لكل ملف PDF في الإصدار، واحصل عليها صفوفاً في جدول Excel، بدون كتابة سطر واحد.",
  "Open PDF to Excel →": "افتح أداة PDF إلى Excel ←",
  "Free, no account, reads scanned drawings too.": "مجانية، بدون حساب، وتقرأ اللوحات الممسوحة ضوئياً أيضاً.",
  "Open PDF to Excel, add your PDF drawings, drag one box around the drawing number, one around the title and one around the revision, then click Download Excel. Each PDF becomes one row and each box becomes one column.":
    "افتح أداة PDF إلى Excel، وأضف لوحات PDF، وارسم مربعاً حول رقم اللوحة ومربعاً حول العنوان ومربعاً حول المراجعة، ثم اضغط \"تنزيل ملف Excel\". كل ملف PDF يصبح صفاً، وكل مربع يصبح عموداً.",
  "Why normal PDF to Excel converters do not help here": "لماذا لا تفيد برامج تحويل PDF إلى Excel العادية هنا",
  "Most PDF to Excel converters try to turn a whole page into a spreadsheet. That works for an invoice with a table, but a drawing is not a table: you get hundreds of cells of dimensions, notes and grid labels, and the drawing number is lost somewhere in the middle.":
    "أغلب برامج تحويل PDF إلى Excel تحاول تحويل الصفحة كلها إلى جدول. هذا ينفع مع فاتورة فيها جدول، لكن اللوحة ليست جدولاً: ستحصل على مئات الخلايا من الأبعاد والملاحظات وأرقام المحاور، ويضيع رقم اللوحة في وسطها.",
  "For a drawing register you only need the same few values from every sheet: the number, the title, the revision and maybe the scale or date. Those values always sit in the same place in the title block, so the right approach is to read just those areas, on every file, and put each one in its own column.":
    "لقائمة اللوحات تحتاج فقط نفس القيم القليلة من كل لوحة: الرقم والعنوان والمراجعة وربما المقياس أو التاريخ. هذه القيم دائماً في نفس المكان في جدول العنوان، فالطريقة الصحيحة أن تقرأ هذه المناطق فقط في كل ملف، وتضع كل قيمة في عمود.",
  "Add the PDF drawings": "أضف لوحات PDF",
  "Open the tool and click Choose PDF files, or Choose a folder to add every PDF in a folder. You can add a whole issue set of hundreds of sheets.":
    "افتح الأداة واضغط \"اختر ملفات PDF\"، أو \"اختر فولدر\" لإضافة كل ملفات PDF في مجلد. يمكنك إضافة إصدار كامل من مئات اللوحات.",
  "The first drawing opens on screen. Drag a box around the drawing number, then around the title, then around the revision. Name each box, for example Drawing No., Title and Rev. The names become the column headers.":
    "تظهر أول لوحة على الشاشة. اسحب مربعاً حول رقم اللوحة، ثم حول العنوان، ثم حول المراجعة. سمِّ كل مربع، مثل رقم اللوحة والعنوان والمراجعة. هذه الأسماء تصبح عناوين الأعمدة.",
  "Read all the drawings": "اقرأ كل اللوحات",
  "Click Next: read. The tool reads the same boxes on every PDF and fills a table, one row per file. Real PDF text is read exactly; scanned areas are read with OCR.":
    "اضغط \"التالي: القراءة\". تقرأ الأداة نفس المربعات في كل ملف PDF وتملأ جدولاً، صف لكل ملف. نص الـ PDF الحقيقي يُقرأ بدقة، والمناطق الممسوحة ضوئياً تُقرأ بـ OCR.",
  "Check and fix the table": "راجع الجدول وصححه",
  "Look down the columns. Click any cell to correct it before downloading, for example where a scan was too faint to read.": "راجع الأعمدة. اضغط على أي خلية لتصحيحها قبل التنزيل، مثلاً إذا كان المسح الضوئي باهتاً.",
  "Download the Excel file": "نزّل ملف Excel",
  "Click Download Excel. To update a register you already have, open Excel options, choose Add to an existing Excel and set the sheet name and start cell.":
    "اضغط \"تنزيل ملف Excel\". ولتحديث قائمة لوحات موجودة عندك، افتح \"خيارات Excel\" واختر \"إضافة إلى ملف Excel موجود\" وحدد اسم الشيت وخلية البداية.",
  "Boxes drawn around the drawing number, title and revision in a PDF title block": "مربعات حول رقم اللوحة والعنوان والمراجعة في جدول عنوان لوحة PDF",
  "Step 2: three boxes on one drawing become three columns.": "الخطوة 2: ثلاثة مربعات على لوحة واحدة تصبح ثلاثة أعمدة.",
  "Table with the drawing number, title and revision read from eight PDF drawings": "جدول فيه رقم اللوحة والعنوان والمراجعة مقروءة من ثماني لوحات PDF",
  "Step 4: one row per PDF, ready to download as Excel.": "الخطوة 4: صف لكل ملف PDF، جاهز للتنزيل كملف Excel.",
  "Tips for a clean register": "نصائح لقائمة لوحات نظيفة",
  "Draw each box a little larger than the text, so longer titles on other sheets still fit inside.": "ارسم كل مربع أكبر قليلاً من النص، حتى تدخل العناوين الأطول في اللوحات الأخرى.",
  "Keep Include file name ticked, so you can always trace a row back to its PDF.": "اترك \"تضمين اسم الملف\" مفعّلاً، لتعرف دائماً من أي ملف PDF جاء كل صف.",
  "Tick Compare area 1 with the file name to spot PDFs whose file name does not match the drawing number.": "فعّل \"مقارنة المنطقة 1 باسم الملف\" لتكتشف الملفات التي لا يطابق اسمها رقم اللوحة.",
  "If one set uses two title block layouts, for example A1 and A3, read each group separately and add both to the same workbook.": "إذا كان الإصدار فيه شكلان لجدول العنوان، مثل A1 و A3، اقرأ كل مجموعة وحدها وأضف الاثنين لنفس ملف Excel.",
  "Scanned drawings and Arabic text": "اللوحات الممسوحة ضوئياً والنص العربي",
  "When an area has no real text, because the drawing was scanned or the text was exploded, the tool uses OCR. Open Reading options to choose English, Arabic or both. Arabic project names and titles are read right to left and written to Excel as normal Arabic text you can sort and filter.":
    "عندما لا يكون في المنطقة نص حقيقي، لأن اللوحة ممسوحة ضوئياً أو النص مفكوك، تستخدم الأداة OCR. افتح خيارات القراءة لاختيار الإنجليزية أو العربية أو الاثنين. أسماء المشاريع والعناوين العربية تُقرأ من اليمين لليسار وتُكتب في Excel كنص عربي عادي يمكنك ترتيبه وفلترته.",
  "Where to go from here": "الخطوة التالية",
  "Once the register is in Excel, the Pre-flight Check can compare it with the PDFs before an issue: it finds duplicated drawing numbers, missing sheets and revisions that do not match the list. If the file names are wrong too, Rename from Title Block fixes them from the same title block.":
    "بعد أن تصبح القائمة في Excel، يقارنها \"فحص قبل التسليم\" بملفات PDF قبل الإصدار: يجد أرقام اللوحات المكررة واللوحات الناقصة والمراجعات التي لا تطابق القائمة. وإذا كانت أسماء الملفات خطأ أيضاً، تصححها أداة التسمية من الـ Title Block من نفس جدول العنوان.",
  "Build your drawing register now": "اعمل قائمة لوحاتك الآن",
  "Can I convert PDF to Excel for free?": "هل يمكن تحويل PDF إلى Excel مجاناً؟",
  "Yes. PDF to Excel is free with no daily limit. It is made for reading the same fields from many drawings, rather than converting one page into a sheet.":
    "نعم. أداة PDF إلى Excel مجانية وبدون حد يومي. وهي مصممة لقراءة نفس الخانات من لوحات كثيرة، وليس لتحويل صفحة واحدة إلى جدول.",
  "Does it read scanned PDFs?": "هل تقرأ ملفات PDF الممسوحة ضوئياً؟",
  "Yes. Areas without real text are read with OCR in English, Arabic or both. A clear scan at 300 DPI or more gives the best results.": "نعم. المناطق التي ليس فيها نص حقيقي تُقرأ بـ OCR بالإنجليزية أو العربية أو الاثنين. المسح الواضح بدقة 300 DPI أو أكثر يعطي أفضل نتيجة.",
  "Are my PDF drawings uploaded?": "هل تُرفع لوحات PDF الخاصة بي؟",
  "No. The files are opened by your browser on your own computer and nothing is sent to a server.": "لا. متصفحك هو الذي يفتح الملفات على جهازك، ولا يُرسل أي شيء لأي سيرفر.",
  "Can I add the results to my existing drawing register?": "هل يمكن إضافة النتائج إلى قائمة اللوحات الموجودة عندي؟",
  "Yes. Choose Add to an existing Excel, pick the workbook, and set the sheet and start cell. Insert mode writes into the sheet without clearing it.":
    "نعم. اختر \"إضافة إلى ملف Excel موجود\"، ثم اختر الملف، وحدد الشيت وخلية البداية. وضع الإدراج يكتب في الشيت بدون مسح محتواه.",
  "How many drawings can I read at once?": "كم لوحة يمكن قراءتها مرة واحدة؟",
  "Hundreds. Real PDF text is read in a moment; OCR takes a few seconds per drawing, depending on your computer.": "مئات. نص الـ PDF الحقيقي يُقرأ في لحظة، و OCR يأخذ بضع ثوانٍ لكل لوحة حسب جهازك.",

  // ----- merge-pdf-without-uploading -----
  "How to merge PDF files without uploading them": "طريقة دمج ملفات PDF في ملف واحد بدون رفعها على الإنترنت",
  "Combine several PDFs into one file in the order you want, while the files stay on your own computer. No upload, no account and no limit on the number of files.":
    "اجمع عدة ملفات PDF في ملف واحد بالترتيب الذي تريده، والملفات باقية على جهازك. بدون رفع، بدون حساب، وبدون حد لعدد الملفات.",
  "Open Merge PDF →": "افتح أداة دمج PDF ←",
  "Free, works in any modern browser.": "مجانية، وتعمل على أي متصفح حديث.",
  "Open Merge PDF, click Add PDF files or Add a folder, put the files in order by dragging them, type a file name and click Merge PDF. The merged file is created by your browser and saved to your computer. Your PDFs are never sent to a server.":
    "افتح أداة دمج PDF، واضغط \"إضافة ملفات PDF\" أو \"إضافة فولدر\"، ورتّب الملفات بالسحب، واكتب اسم الملف ثم اضغط \"دمج PDF\". متصفحك هو الذي ينشئ الملف المدمج ويحفظه على جهازك، وملفاتك لا تُرسل لأي سيرفر.",
  "Why \"without uploading\" matters": "لماذا يهم الدمج \"بدون رفع\"",
  "Most online PDF sites work the same way: you upload your files to their server, the server merges them, and you download the result. Even when the site promises to delete the files after an hour, your documents have still been copied to a computer you do not control.":
    "أغلب مواقع PDF أونلاين تعمل بنفس الطريقة: ترفع ملفاتك على السيرفر الخاص بهم، والسيرفر يدمجها، ثم تنزّل النتيجة. وحتى لو وعد الموقع بحذف الملفات بعد ساعة، فقد نُسخت مستنداتك بالفعل على جهاز لا تتحكم فيه.",
  "That is a problem for contracts, client drawings, tender documents, HR files and anything under an NDA. Many companies do not allow staff to upload such files to free websites at all. A merger that runs inside the browser avoids the question: the files are opened on your computer and the result is written on your computer.":
    "هذه مشكلة مع العقود ولوحات العملاء ومستندات المناقصات وملفات الموارد البشرية وأي شيء عليه اتفاقية سرية. شركات كثيرة لا تسمح لموظفيها برفع هذه الملفات على مواقع مجانية أصلاً. الدمج داخل المتصفح يحل المشكلة: الملفات تُفتح على جهازك والنتيجة تُكتب على جهازك.",
  "Add your PDF files": "أضف ملفات PDF",
  "Open the tool and click Add PDF files, or Add a folder to take every PDF in a folder. You can also drag files from your desktop onto the page.":
    "افتح الأداة واضغط \"إضافة ملفات PDF\"، أو \"إضافة فولدر\" لأخذ كل ملفات PDF في مجلد. ويمكنك أيضاً سحب الملفات من سطح المكتب إلى الصفحة.",
  "Put them in order": "رتّب الملفات",
  "Drag the rows, or use the up and down arrows, to set the order. Sort A→Z puts them in name order, which is handy when the files are numbered.":
    "اسحب الصفوف، أو استخدم أسهم الأعلى والأسفل، لتحديد الترتيب. زر \"ترتيب أبجدي\" يرتبها حسب الاسم، وهذا مفيد عندما تكون الملفات مرقّمة.",
  "Check the page count": "راجع عدد الصفحات",
  "Each row shows the number of pages and the size, and the top line shows the total, so you can see at a glance that nothing is missing.":
    "كل صف يعرض عدد الصفحات والحجم، والسطر العلوي يعرض الإجمالي، فترى بنظرة واحدة أنه لا يوجد شيء ناقص.",
  "Name the file and merge": "سمِّ الملف وادمج",
  "Type a name in File name, for example Issue 03 - Architectural set.pdf, and click Merge PDF. The merged PDF is saved to your downloads.":
    "اكتب اسماً في خانة \"اسم الملف\"، مثل Issue 03 - Architectural set.pdf، واضغط \"دمج PDF\". يُحفظ الملف المدمج في مجلد التنزيلات.",
  "Six PDF drawings listed in order, ready to be merged into one PDF": "ست لوحات PDF مرتبة وجاهزة للدمج في ملف PDF واحد",
  "Drag the rows to set the order, then click Merge PDF.": "اسحب الصفوف لتحديد الترتيب، ثم اضغط \"دمج PDF\".",
  "How to check that nothing is uploaded": "كيف تتأكد بنفسك أن لا شيء يُرفع",
  "You do not have to take our word for it. Open the page, press F12 to open the developer tools and choose the Network tab. Add your PDFs and merge them: you will see no request carrying your files. You can even disconnect from the internet after the page has loaded and the merge still works. The source code is public on GitHub.":
    "لا تحتاج أن تصدّق كلامنا. افتح الصفحة، واضغط F12 لفتح أدوات المطور واختر تبويب Network. أضف ملفاتك وادمجها: لن تجد أي طلب يحمل ملفاتك. يمكنك حتى قطع الإنترنت بعد تحميل الصفحة وسيعمل الدمج. والكود المصدري متاح للجميع على GitHub.",
  "Number your files first, for example with Rename Files or Rename from Title Block, then use Sort A→Z to get the right order in one click.":
    "رقّم ملفاتك أولاً، مثلاً بأداة إعادة تسمية الملفات أو التسمية من الـ Title Block، ثم استخدم الترتيب الأبجدي لتحصل على الترتيب الصحيح بضغطة واحدة.",
  "Need only some pages? Use Split PDF first to take out the pages you want, then merge.": "تحتاج بعض الصفحات فقط؟ استخدم تقسيم PDF أولاً لأخذ الصفحات التي تريدها، ثم ادمج.",
  "Bookmarks and form fields from the original files may not be kept, so check the merged file if you rely on them.": "قد لا تُحفظ الإشارات المرجعية (Bookmarks) وحقول النماذج من الملفات الأصلية، فراجع الملف المدمج إذا كنت تعتمد عليها.",
  "Password protected PDFs must be opened and saved without a password first.": "ملفات PDF المحمية بكلمة سر يجب فتحها وحفظها بدون كلمة سر أولاً.",
  "Merge your PDFs now": "ادمج ملفات PDF الآن",
  "Is it safe to merge confidential PDFs here?": "هل دمج ملفات PDF السرية هنا آمن؟",
  "Yes. The files are read and merged by your own browser. They are not uploaded, stored or seen by anyone else.": "نعم. متصفحك هو الذي يقرأ الملفات ويدمجها. لا تُرفع ولا تُخزن ولا يراها أحد غيرك.",
  "Can I merge PDF files offline?": "هل يمكن دمج ملفات PDF بدون إنترنت؟",
  "Yes. Once the page has loaded, the merge works without an internet connection, because all the work happens on your computer.": "نعم. بعد تحميل الصفحة يعمل الدمج بدون اتصال بالإنترنت، لأن كل العمل يتم على جهازك.",
  "Is there a limit on the number of files or pages?": "هل يوجد حد لعدد الملفات أو الصفحات؟",
  "There is no fixed limit. Very large sets depend on your computer's memory; hundreds of drawings are normally fine.": "لا يوجد حد ثابت. الملفات الضخمة جداً تعتمد على ذاكرة جهازك، ومئات اللوحات تعمل عادة بدون مشكلة.",
  "Do I need to install anything or create an account?": "هل أحتاج تثبيت برنامج أو إنشاء حساب؟",
  "No. It works in Chrome, Edge, Firefox and Safari with no install and no sign up.": "لا. تعمل على Chrome و Edge و Firefox و Safari بدون تثبيت وبدون تسجيل.",
  "Will the quality of my PDFs change?": "هل تتغير جودة ملفات PDF؟",
  "No. Pages are copied as they are, so text stays sharp and vector drawings stay vector.": "لا. الصفحات تُنسخ كما هي، فيبقى النص واضحاً وتبقى الرسومات المتجهة (Vector) كما هي.",

  // ----- list-folder-files-to-excel -----
  "How to list all files in a folder and subfolders to Excel": "طريقة نسخ أسماء كل الملفات في مجلد ومجلداته الفرعية إلى Excel",
  "Get every file name in a folder tree into an Excel workbook, with its folder, type, size and date, in a few clicks and without macros, Power Query or command prompt tricks.":
    "انقل اسم كل ملف في المجلد (الفولدر) وكل المجلدات التي بداخله إلى ملف Excel، مع المجلد والنوع والحجم والتاريخ، في ضغطات قليلة وبدون ماكرو أو Power Query أو أوامر CMD.",
  "Open Files to Excel →": "افتح أداة قائمة الملفات إلى Excel ←",
  "Open Files to Excel, click Select Folder and pick the main folder. Every file in it and in all its subfolders is listed. Choose the sheets and columns you want and click Export to Excel.":
    "افتح أداة قائمة الملفات إلى Excel، واضغط \"اختر فولدر\" واختر المجلد الرئيسي. تظهر كل الملفات فيه وفي كل مجلداته الفرعية. اختر الشيتات والأعمدة التي تريدها واضغط \"تصدير إلى Excel\".",
  "The usual ways, and why they are slow": "الطرق المعتادة، ولماذا هي بطيئة",
  "The common answers to this question are a dir /b command in the command prompt, Copy as path in Windows Explorer, Power Query in Excel or a VBA macro. They all work, but each one needs cleaning afterwards: paths to split into columns, folders to separate from files, sizes in bytes and macros that your company may block.":
    "الإجابات الشائعة لهذا السؤال هي أمر dir /b في موجه الأوامر، أو \"نسخ كمسار\" في مستكشف Windows، أو Power Query في Excel، أو ماكرو VBA. كلها تعمل، لكن كل واحدة تحتاج تنظيفاً بعدها: مسارات تُقسم إلى أعمدة، ومجلدات تُفصل عن الملفات، وأحجام بالبايت، وماكرو قد تمنعه شركتك.",
  "When you need a file list for a project handover, an audit or a document register, you want the result ready to use: one row per file, the folder in its own column, a readable size and date, and maybe one sheet per folder.":
    "عندما تحتاج قائمة ملفات لتسليم مشروع أو مراجعة أو سجل مستندات، تريد النتيجة جاهزة: صف لكل ملف، والمجلد في عمود مستقل، والحجم والتاريخ بشكل مقروء، وربما شيت لكل مجلد.",
  "Choose the main folder": "اختر المجلد الرئيسي",
  "Open the tool and click Select Folder. Pick the top folder of the project. The tool reads it and every folder inside it, however deep.":
    "افتح الأداة واضغط \"اختر فولدر\". اختر المجلد الأعلى للمشروع. تقرأه الأداة وتقرأ كل مجلد بداخله مهما كان عمقه.",
  "Choose which folders and file types": "اختر المجلدات وأنواع الملفات",
  "Keep All subfolders, or choose Current folder only or Select subfolders. Use File types to keep only some types, for example PDF and DWG, and Name contains to filter by a word.":
    "اترك \"كل الفولدرات الفرعية\"، أو اختر \"الفولدر الحالي فقط\" أو \"اختيار فولدرات فرعية\". استخدم \"أنواع الملفات\" لإبقاء أنواع معينة فقط مثل PDF و DWG، و\"الاسم يحتوي على\" للفلترة بكلمة.",
  "Choose the sheets": "اختر الشيتات",
  "Under Excel sheets, tick Summary for a count of each file type per folder and One sheet with all files for the full list. You can also split the list into a sheet for each folder or for each file type.":
    "تحت \"شيتات Excel\"، فعّل \"ملخص\" لعدد كل نوع ملفات في كل مجلد، و\"شيت واحد بكل الملفات\" للقائمة الكاملة. ويمكنك أيضاً تقسيم القائمة إلى شيت لكل مجلد أو لكل نوع ملف.",
  "Choose the columns": "اختر الأعمدة",
  "Tick Size, Date modified and Full path as needed. Type the folder location on your computer, for example D:\\Projects, if you want full paths that you can paste into Explorer.":
    "فعّل \"الحجم\" و\"تاريخ التعديل\" و\"المسار الكامل\" حسب حاجتك. واكتب مكان المجلد على جهازك، مثل D:\\Projects، إذا أردت مسارات كاملة يمكنك لصقها في مستكشف Windows.",
  "Click Export to Excel. The workbook is saved to your downloads with a frozen header row, ready to filter and sort.": "اضغط \"تصدير إلى Excel\". يُحفظ الملف في التنزيلات مع تثبيت صف العناوين، جاهزاً للفلترة والترتيب.",
  "Files to Excel listing sixteen files from a project folder with their folders, sizes and dates": "أداة قائمة الملفات إلى Excel تعرض ستة عشر ملفاً من مجلد مشروع مع مجلداتها وأحجامها وتواريخها",
  "Every file in the folder tree, with its folder, size and date.": "كل ملف في المجلد والمجلدات الفرعية، مع المجلد والحجم والتاريخ.",
  "What you can use the list for": "فيم تستخدم القائمة",
  "A document register or transmittal list for a project handover.": "سجل مستندات أو قائمة إرسال لتسليم مشروع.",
  "Checking that every discipline folder has the files it should, using the Summary sheet.": "التأكد أن مجلد كل تخصص فيه الملفات المطلوبة، باستخدام شيت الملخص.",
  "Finding old or very large files before archiving a project.": "إيجاد الملفات القديمة أو الكبيرة جداً قبل أرشفة المشروع.",
  "Planning a bulk rename: copy the list, write the new names next to it, then use Rename Files.": "التحضير لإعادة تسمية جماعية: انسخ القائمة، واكتب الأسماء الجديدة بجانبها، ثم استخدم أداة إعادة تسمية الملفات.",
  "Which browser to use": "أي متصفح تستخدم",
  "Chrome and Edge on a computer read the folder directly. Firefox and Safari also work: they ask you to confirm the folder upload in a browser window, but the files are still only read on your computer and never sent anywhere. Only file names and details are read, not the contents, so even very large folders are fast.":
    "Chrome و Edge على الكمبيوتر يقرآن المجلد مباشرة. Firefox و Safari يعملان أيضاً: يطلبان منك تأكيد \"رفع\" المجلد في نافذة المتصفح، لكن الملفات تُقرأ على جهازك فقط ولا تُرسل لأي مكان. تُقرأ أسماء الملفات وبياناتها فقط وليس محتواها، لذلك حتى المجلدات الضخمة سريعة.",
  "Export your file list now": "صدّر قائمة ملفاتك الآن",
  "How do I copy all file names from a folder into Excel?": "كيف أنسخ أسماء كل الملفات من مجلد إلى Excel؟",
  "Choose the folder in Files to Excel and click Export to Excel. Each file name goes into its own row, with the extension and folder in separate columns.": "اختر المجلد في أداة قائمة الملفات إلى Excel واضغط \"تصدير إلى Excel\". كل اسم ملف يوضع في صف، والامتداد والمجلد في أعمدة منفصلة.",
  "Does it include files in subfolders?": "هل تشمل الملفات في المجلدات الفرعية؟",
  "Yes. All subfolders are included by default. You can also choose only the current folder or pick some subfolders.": "نعم. كل المجلدات الفرعية مشمولة تلقائياً. ويمكنك اختيار المجلد الحالي فقط أو مجلدات فرعية معينة.",
  "Do I need VBA, macros or Power Query?": "هل أحتاج VBA أو ماكرو أو Power Query؟",
  "No. Nothing is installed in Excel. The tool creates a normal .xlsx workbook.": "لا. لا يُثبت أي شيء في Excel. الأداة تنشئ ملف ‎.xlsx عادياً.",
  "Are my files uploaded?": "هل تُرفع ملفاتي؟",
  "No. Only the names, sizes and dates are read, by your own browser on your own computer. Nothing is sent to a server.": "لا. تُقرأ الأسماء والأحجام والتواريخ فقط، بواسطة متصفحك على جهازك. لا يُرسل أي شيء لأي سيرفر.",
  "How many files can it list?": "كم ملفاً يمكن أن تعرض؟",
  "Tens of thousands. Large folders take a few seconds to read.": "عشرات الآلاف. المجلدات الكبيرة تأخذ بضع ثوانٍ للقراءة.",

  // ----- export-pdf-comments-to-excel -----
  "How to export PDF comments to an Excel comment sheet": "طريقة تصدير تعليقات PDF إلى Excel (جدول الرد على التعليقات)",
  "Turn the review comments on marked-up PDF drawings into an Excel comment response sheet, with the sheet number, comment, author, date and a picture of where each comment was made.":
    "حوّل تعليقات المراجعة على لوحات PDF إلى جدول رد على التعليقات في Excel، فيه رقم اللوحة والتعليق والكاتب والتاريخ وصورة لمكان كل تعليق.",
  "Open PDF Comments to Excel →": "افتح أداة تعليقات PDF إلى Excel ←",
  "Free, no account, works with Acrobat and Bluebeam markups.": "مجانية، بدون حساب، وتعمل مع تعليقات Acrobat و Bluebeam.",
  "Open PDF Comments to Excel, add the marked-up PDFs, optionally draw a box around the drawing number, and click Download comment sheet. You get one Excel row per comment, with a snapshot of the spot and empty Response and Status columns for your replies.":
    "افتح أداة تعليقات PDF إلى Excel، وأضف ملفات PDF التي عليها التعليقات، وارسم مربعاً حول رقم اللوحة إذا أردت، ثم اضغط \"تنزيل جدول التعليقات\". تحصل على صف في Excel لكل تعليق، مع صورة لمكانه وعمودين فارغين للرد والحالة.",
  "Why copying comments by hand is a problem": "لماذا نسخ التعليقات يدوياً مشكلة",
  "When a client or consultant reviews a submission, the comments come back as notes, clouds and callouts on the PDFs. Before you can reply, someone has to copy each one into a comment response sheet, note which drawing it is on and describe where on the sheet it was made.":
    "عندما يراجع العميل أو الاستشاري التسليم، تعود التعليقات كملاحظات وسحابات وأسهم على ملفات PDF. وقبل أن ترد، على شخص ما أن ينسخ كل تعليق إلى جدول الرد، ويكتب رقم اللوحة، ويصف مكان التعليق على اللوحة.",
  "Acrobat's comment summary and comment export give you a list of text, but without the drawing number and without a picture of the spot, so the person answering still has to open every PDF to understand the comment. With 80 comments across 30 drawings that is hours of copying before any real work starts.":
    "ملخص التعليقات وتصدير التعليقات في Acrobat يعطيانك قائمة نصوص، لكن بدون رقم اللوحة وبدون صورة للمكان، فيضطر من يرد أن يفتح كل ملف PDF ليفهم التعليق. مع 80 تعليقاً على 30 لوحة، هذه ساعات من النسخ قبل أن يبدأ العمل الحقيقي.",
  "Add the marked-up PDFs": "أضف ملفات PDF التي عليها التعليقات",
  "Open the tool and click Choose PDF files, or Choose a folder for a whole review set. The tool counts the comments in each file as it reads them.":
    "افتح الأداة واضغط \"اختر ملفات PDF\"، أو \"اختر فولدر\" لمجموعة مراجعة كاملة. تعدّ الأداة التعليقات في كل ملف أثناء قراءته.",
  "Mark the sheet number (optional)": "حدد رقم اللوحة (اختياري)",
  "On one drawing, drag a box around the drawing number in the title block. Every comment row then shows the number of the sheet it came from, instead of only the file name.":
    "على لوحة واحدة، اسحب مربعاً حول رقم اللوحة في جدول العنوان. بعدها يظهر في كل صف رقم اللوحة التي جاء منها التعليق، بدلاً من اسم الملف فقط.",
  "Check the comment list": "راجع قائمة التعليقات",
  "Every comment appears with its sheet number, text, author, date and a snapshot of the area around it. Click a comment or sheet number to fix it, and untick any row you do not want in the sheet.":
    "يظهر كل تعليق مع رقم اللوحة والنص والكاتب والتاريخ وصورة للمنطقة حوله. اضغط على التعليق أو رقم اللوحة لتصحيحه، وألغِ تحديد أي صف لا تريده في الجدول.",
  "Add the project details": "أضف بيانات المشروع",
  "Fill in Project, Submission and Reviewed by so they appear at the top of the sheet. Tick Also include markups without text if clouds and arrows matter too.":
    "املأ \"المشروع\" و\"التسليم / المرجع\" و\"المراجِع\" لتظهر أعلى الجدول. وفعّل \"تضمين العلامات بدون نص أيضاً\" إذا كانت السحابات والأسهم مهمة.",
  "Download the comment sheet": "نزّل جدول التعليقات",
  "Click Download comment sheet (Excel). The workbook has the columns No., Sheet No., Comment, Snapshot, Commented By, Date, Response and Status.":
    "اضغط \"تنزيل جدول التعليقات (Excel)\". الملف فيه أعمدة: الرقم، رقم اللوحة، التعليق، الصورة، الكاتب، التاريخ، الرد، والحالة.",
  "Comment sheet listing PDF review comments with sheet number, comment text, snapshot and author": "جدول تعليقات يعرض تعليقات مراجعة PDF مع رقم اللوحة ونص التعليق والصورة والكاتب",
  "Each comment with its sheet number and a snapshot of the spot.": "كل تعليق مع رقم اللوحة وصورة لمكانه.",
  "What is read from the PDF": "ما الذي يُقرأ من ملف PDF",
  "Sticky notes, text boxes and callouts, with their text.": "الملاحظات اللاصقة ومربعات النص والتعليقات بالأسهم، مع نصها.",
  "Clouds, rectangles, arrows and highlights that carry a note.": "السحابات والمستطيلات والأسهم والتظليل التي عليها ملاحظة.",
  "The author and date saved with each comment.": "اسم الكاتب والتاريخ المحفوظان مع كل تعليق.",
  "Replies, which are added to the comment they answer when Add replies to the comment they answer is ticked.": "الردود، وتُضاف إلى التعليق الذي ترد عليه عند تفعيل \"إضافة الردود إلى التعليق الذي ترد عليه\".",
  "Comments are read from the PDF itself, so they work whether they were made in Adobe Acrobat, Bluebeam Revu, Foxit, PDF-XChange or a tablet app, as long as they were saved as PDF comments and not flattened into the drawing.":
    "التعليقات تُقرأ من ملف PDF نفسه، فتعمل سواء كُتبت في Adobe Acrobat أو Bluebeam Revu أو Foxit أو PDF-XChange أو تطبيق على التابلت، طالما حُفظت كتعليقات PDF ولم تُدمج (Flatten) في اللوحة.",
  "Answering the comments": "الرد على التعليقات",
  "Send the Excel sheet to the team, write the replies in the Response column and set the Status to Open or Closed. Because every row has the sheet number and a picture, nobody has to open the PDFs again to understand what was asked.":
    "أرسل ملف Excel للفريق، واكتبوا الردود في عمود الرد، وحددوا الحالة مفتوح أو مغلق. ولأن كل صف فيه رقم اللوحة وصورة، لا يحتاج أحد أن يفتح ملفات PDF مرة أخرى ليفهم المطلوب.",
  "Make your comment sheet now": "اعمل جدول التعليقات الآن",
  "How do I export PDF comments to Excel?": "كيف أصدّر تعليقات PDF إلى Excel؟",
  "Add the PDFs to PDF Comments to Excel and click Download comment sheet. Every comment becomes one row in an Excel workbook.": "أضف ملفات PDF إلى أداة تعليقات PDF إلى Excel واضغط \"تنزيل جدول التعليقات\". كل تعليق يصبح صفاً في ملف Excel.",
  "Does it work with Bluebeam markups?": "هل تعمل مع تعليقات Bluebeam؟",
  "Yes. Bluebeam saves markups as standard PDF comments, so they are read like Acrobat comments.": "نعم. Bluebeam يحفظ التعليقات كتعليقات PDF عادية، فتُقرأ مثل تعليقات Acrobat.",
  "Can I get a picture of each comment in Excel?": "هل يمكن الحصول على صورة لكل تعليق في Excel؟",
  "Yes. Each row includes a snapshot of the area of the drawing around the comment.": "نعم. كل صف فيه صورة لجزء اللوحة المحيط بالتعليق.",
  "Are the client drawings uploaded?": "هل تُرفع لوحات العميل؟",
  "No. The PDFs are read by your browser on your own computer and nothing is sent to a server.": "لا. متصفحك هو الذي يقرأ ملفات PDF على جهازك، ولا يُرسل أي شيء لأي سيرفر.",
  "Why are some comments missing?": "لماذا تختفي بعض التعليقات؟",
  "If the reviewer flattened the PDF, the comments became part of the drawing and are no longer comments. Ask for the PDF with comments kept, or tick Also include markups without text for clouds and arrows.":
    "إذا دمج المراجع التعليقات في الملف (Flatten)، تصبح جزءاً من اللوحة ولا تعود تعليقات. اطلب ملف PDF بالتعليقات كما هي، أو فعّل \"تضمين العلامات بدون نص أيضاً\" للسحابات والأسهم.",
};
