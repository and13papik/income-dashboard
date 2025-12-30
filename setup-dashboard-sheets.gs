/**
 * INCOME DASHBOARD - Google Sheets Setup Script v3
 * 
 * Этот скрипт:
 * 1. Форматирует лист "Доходы" (RAW)
 * 2. Создаёт листы для отчётов
 * 3. Добавляет все формулы
 * 4. Оформляет дашборд
 * 
 * ИНСТРУКЦИЯ:
 * 1. Откройте Google Sheets: 1rZJIgN0C38ltZDlKFPnmz0I2G5vQPq8Z9fo9r2l8Uuc
 * 2. Инструменты → Редактор скриптов
 * 3. Вставьте этот код
 * 4. Запустите функцию: setupDashboard()
 * 5. Разрешите доступ
 * 6. Готово!
 */

const SPREADSHEET_ID = '1rZJIgN0C38ltZDlKFPnmz0I2G5vQPq8Z9fo9r2l8Uuc';

function setupDashboard() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  Logger.log('🚀 НАЧАЛО НАСТРОЙКИ ДАШБОРДА...');
  
  // Шаг 1: Форматируем лист "Доходы"
  formatIncomeSheet(ss);
  
  // Шаг 2: Создаём лист "Параметры"
  createParametersSheet(ss);
  
  // Шаг 3: Создаём лист "Сводка Месяц"
  createMonthlySummary(ss);
  
  // Шаг 4: Создаём лист "Операторы (месяц)"
  createOperatorsSheet(ss);
  
  // Шаг 5: Создаём лист "Анкеты (месяц)"
  createAnketySheet(ss);
  
  // Шаг 6: Создаём лист "Сводка Все Месяцы"
  createAllMonthsSummary(ss);
  
  Logger.log('✅ ДАШБОРД ГОТОВ!');
  Logger.log('\n📊 Созданы листы:');
  Logger.log('  1. Доходы (отформатирован)');
  Logger.log('  2. Параметры');
  Logger.log('  3. Сводка Месяц');
  Logger.log('  4. Операторы (месяц)');
  Logger.log('  5. Анкеты (месяц)');
  Logger.log('  6. Сводка Все Месяцы');
}

// ===== 1. ФОРМАТИРОВАНИЕ ЛИСТА "ДОХОДЫ" =====
function formatIncomeSheet(ss) {
  let sheet = ss.getSheetByName('Доходы');
  if (!sheet) {
    Logger.log('⚠️ Лист "Доходы" не найден');
    return;
  }
  
  Logger.log('📋 Форматирую лист "Доходы"...');
  
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  
  // Закрепляем первую строку
  sheet.setFrozenRows(1);
  Logger.log('  ✓ Закреплена первая строка');
  
  // Включаем фильтр
  if (lastRow > 0 && lastCol > 0) {
    const filterRange = sheet.getRange(1, 1, lastRow, lastCol);
    filterRange.createFilter();
    Logger.log('  ✓ Включен фильтр');
  }
  
  // Форматируем заголовок
  const headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  Logger.log('  ✓ Оформлен заголовок');
  
  // Форматируем денежные колонки
  // Предполагаем стандартную структуру Income_Raw:
  // Cols: A=id, B=date_iso, C=month, D=timestamp, E=operator, F=anketa, G=shift, H=day,
  //       I=of_gross, J=of_percent, K=of_net,
  //       L=crypto_gross, M=crypto_percent, N=crypto_net,
  //       O=paypal_gross, P=paypal_percent, Q=paypal_net,
  //       R=gross_total, S=net_total
  
  if (lastRow > 1) {
    // Денежные колонки: I, K, L, N, O, Q, R, S (gross и net)
    const moneyColumns = [9, 11, 12, 14, 15, 17, 18, 19]; // I, K, L, N, O, Q, R, S
    moneyColumns.forEach(col => {
      if (col <= lastCol) {
        const range = sheet.getRange(2, col, lastRow - 1, 1);
        range.setNumberFormat('$#,##0.00');
      }
    });
    Logger.log('  ✓ Форматированы денежные колонки');
    
    // Процентные колонки: J, M, P (percent)
    const percentColumns = [10, 13, 16]; // J, M, P
    percentColumns.forEach(col => {
      if (col <= lastCol) {
        const range = sheet.getRange(2, col, lastRow - 1, 1);
        range.setNumberFormat('0.00"%"');
      }
    });
    Logger.log('  ✓ Форматированы процентные колонки');
    
    // Условное форматирование: зелёный для Общий Брутто > 0
    if (lastCol >= 18) { // Column R
      const grossRange = sheet.getRange(2, 18, lastRow - 1, 1);
      const rule = SpreadsheetApp.newConditionalFormatRule()
        .whenCellNotEmpty()
        .setBackground('#c6efce')
        .setRanges([grossRange])
        .build();
      sheet.addConditionalFormatRule(rule);
      Logger.log('  ✓ Добавлено условное форматирование для Брутто');
    }
  }
  
  // Автоширина колонок
  sheet.autoResizeColumns(1, lastCol);
  Logger.log('  ✓ Установлена автоширина колонок');
}

// ===== 2. СОЗДАНИЕ ЛИСТА "ПАРАМЕТРЫ" =====
function createParametersSheet(ss) {
  let sheet = ss.getSheetByName('Параметры');
  if (!sheet) {
    sheet = ss.insertSheet('Параметры', 0);
    Logger.log('📋 Создан лист "Параметры"');
  } else {
    sheet.clear();
  }
  
  // Заголовки
  sheet.getRange('A1').setValue('Параметр');
  sheet.getRange('B1').setValue('Значение');
  sheet.getRange('A1:B1').setBackground('#4285f4').setFontColor('#ffffff').setFontWeight('bold');
  
  // Месяц
  sheet.getRange('A2').setValue('Месяц (YYYY-MM)');
  const monthCell = sheet.getRange('B2');
  monthCell.setValue(new Date().toISOString().slice(0, 7)); // Текущий месяц
  monthCell.setNumberFormat('0000"-"00');
  
  // Оператор (опционально)
  sheet.getRange('A3').setValue('Оператор (опционально)');
  sheet.getRange('B3').setValue('');
  
  // Анкета (опционально)
  sheet.getRange('A4').setValue('Анкета (опционально)');
  sheet.getRange('B4').setValue('');
  
  sheet.autoResizeColumns(1, 2);
  Logger.log('  ✓ Параметры установлены');
}

// ===== 3. СОЗДАНИЕ ЛИСТА "СВОДКА МЕСЯЦ" =====
function createMonthlySummary(ss) {
  let sheet = ss.getSheetByName('Сводка Месяц');
  if (!sheet) {
    sheet = ss.insertSheet('Сводка Месяц', 1);
    Logger.log('📋 Создан лист "Сводка Месяц"');
  } else {
    sheet.clear();
  }
  
  // KPI КАРТОЧКИ
  sheet.getRange('A1').setValue('📊 СВОДКА ПО МЕСЯЦАМ');
  sheet.getRange('A1').setFontSize(16).setFontWeight('bold');
  
  // Заголовки KPI
  const kpiRow = 3;
  sheet.getRange(`A${kpiRow}`).setValue('Брутто (все)');
  sheet.getRange(`B${kpiRow}`).setValue('Операторам (чистыми)');
  sheet.getRange(`C${kpiRow}`).setValue('OnlyFans');
  sheet.getRange(`D${kpiRow}`).setValue('Крипто');
  sheet.getRange(`E${kpiRow}`).setValue('PayPal');
  
  // KPI значения
  const kpiDataRow = 4;
  sheet.getRange(`A${kpiDataRow}`).setFormula(
    `=SUMIFS('Income_Raw'!R:R, 'Income_Raw'!C:C, "="&'Параметры'!$B$2)`
  );
  sheet.getRange(`B${kpiDataRow}`).setFormula(
    `=SUMIFS('Income_Raw'!S:S, 'Income_Raw'!C:C, "="&'Параметры'!$B$2)`
  );
  sheet.getRange(`C${kpiDataRow}`).setFormula(
    `=SUMIFS('Income_Raw'!K:K, 'Income_Raw'!C:C, "="&'Параметры'!$B$2)`
  );
  sheet.getRange(`D${kpiDataRow}`).setFormula(
    `=SUMIFS('Income_Raw'!N:N, 'Income_Raw'!C:C, "="&'Параметры'!$B$2)`
  );
  sheet.getRange(`E${kpiDataRow}`).setFormula(
    `=SUMIFS('Income_Raw'!Q:Q, 'Income_Raw'!C:C, "="&'Параметры'!$B$2)`
  );
  
  // Форматирование KPI
  sheet.getRange(`A${kpiRow}:E${kpiRow}`).setBackground('#e8f0fe').setFontWeight('bold');
  sheet.getRange(`A${kpiDataRow}:E${kpiDataRow}`).setNumberFormat('$#,##0.00').setFontSize(14).setFontWeight('bold');
  
  // ===== ТАБЛИЦА "ПО ДНЯМ" =====
  sheet.getRange('A7').setValue('📅 ПО ДНЯМ');
  sheet.getRange('A7').setFontSize(12).setFontWeight('bold');
  
  const daysHeaderRow = 8;
  sheet.getRange(`A${daysHeaderRow}`).setValue('День');
  sheet.getRange(`B${daysHeaderRow}`).setValue('Брутто');
  sheet.getRange(`C${daysHeaderRow}`).setValue('Чистыми');
  sheet.getRange(`D${daysHeaderRow}`).setValue('OnlyFans');
  sheet.getRange(`E${daysHeaderRow}`).setValue('Крипто');
  sheet.getRange(`F${daysHeaderRow}`).setValue('PayPal');
  
  sheet.getRange(`A${daysHeaderRow}:F${daysHeaderRow}`).setBackground('#e8f0fe').setFontWeight('bold');
  
  // Формула для дней (1-31)
  for (let day = 1; day <= 31; day++) {
    const row = 8 + day;
    const dayCol = `A${row}`;
    const bruttoCol = `B${row}`;
    const netCol = `C${row}`;
    const ofCol = `D${row}`;
    const cryptoCol = `E${row}`;
    const paypalCol = `F${row}`;
    
    sheet.getRange(dayCol).setValue(day);
    sheet.getRange(bruttoCol).setFormula(
      `=SUMIFS('Income_Raw'!R:R, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!H:H, ${day})`
    );
    sheet.getRange(netCol).setFormula(
      `=SUMIFS('Income_Raw'!S:S, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!H:H, ${day})`
    );
    sheet.getRange(ofCol).setFormula(
      `=SUMIFS('Income_Raw'!K:K, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!H:H, ${day})`
    );
    sheet.getRange(cryptoCol).setFormula(
      `=SUMIFS('Income_Raw'!N:N, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!H:H, ${day})`
    );
    sheet.getRange(paypalCol).setFormula(
      `=SUMIFS('Income_Raw'!Q:Q, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!H:H, ${day})`
    );
  }
  
  sheet.getRange(`B9:F39`).setNumberFormat('$#,##0.00');
  
  // ===== ТАБЛИЦА "ПО ОПЕРАТОРАМ" =====
  sheet.getRange('H7').setValue('👥 ПО ОПЕРАТОРАМ');
  sheet.getRange('H7').setFontSize(12).setFontWeight('bold');
  
  const operatorsHeaderRow = 8;
  sheet.getRange(`H${operatorsHeaderRow}`).setValue('Оператор');
  sheet.getRange(`I${operatorsHeaderRow}`).setValue('Брутто');
  sheet.getRange(`J${operatorsHeaderRow}`).setValue('Чистыми');
  sheet.getRange(`K${operatorsHeaderRow}`).setValue('OnlyFans');
  sheet.getRange(`L${operatorsHeaderRow}`).setValue('Крипто');
  sheet.getRange(`M${operatorsHeaderRow}`).setValue('PayPal');
  
  sheet.getRange(`H${operatorsHeaderRow}:M${operatorsHeaderRow}`).setBackground('#e8f0fe').setFontWeight('bold');
  
  // Используем UNIQUE и SUMIFS для динамического списка операторов
  sheet.getRange('H9').setFormula(
    `=IFERROR(UNIQUE(FILTER('Income_Raw'!E:E, ('Income_Raw'!C:C="="&'Параметры'!$B$2)*('Income_Raw'!E:E<>""))), "")`
  );
  
  // Формулы для сумм по операторам
  for (let row = 9; row <= 40; row++) {
    sheet.getRange(`I${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!R:R, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!E:E, H${row}), "")`
    );
    sheet.getRange(`J${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!S:S, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!E:E, H${row}), "")`
    );
    sheet.getRange(`K${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!K:K, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!E:E, H${row}), "")`
    );
    sheet.getRange(`L${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!N:N, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!E:E, H${row}), "")`
    );
    sheet.getRange(`M${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!Q:Q, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!E:E, H${row}), "")`
    );
  }
  
  sheet.getRange(`I9:M40`).setNumberFormat('$#,##0.00');
  
  // ===== ТАБЛИЦА "ПО АНКЕТАМ" =====
  sheet.getRange('O7').setValue('📱 ПО АНКЕТАМ');
  sheet.getRange('O7').setFontSize(12).setFontWeight('bold');
  
  const anketyHeaderRow = 8;
  sheet.getRange(`O${anketyHeaderRow}`).setValue('Анкета');
  sheet.getRange(`P${anketyHeaderRow}`).setValue('Брутто');
  sheet.getRange(`Q${anketyHeaderRow}`).setValue('Чистыми');
  sheet.getRange(`R${anketyHeaderRow}`).setValue('OnlyFans');
  sheet.getRange(`S${anketyHeaderRow}`).setValue('Крипто');
  sheet.getRange(`T${anketyHeaderRow}`).setValue('PayPal');
  
  sheet.getRange(`O${anketyHeaderRow}:T${anketyHeaderRow}`).setBackground('#e8f0fe').setFontWeight('bold');
  
  // Список анкет
  sheet.getRange('O9').setFormula(
    `=IFERROR(UNIQUE(FILTER('Income_Raw'!F:F, ('Income_Raw'!C:C="="&'Параметры'!$B$2)*('Income_Raw'!F:F<>""))), "")`
  );
  
  // Формулы для сумм по анкетам
  for (let row = 9; row <= 40; row++) {
    sheet.getRange(`P${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!R:R, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!F:F, O${row}), "")`
    );
    sheet.getRange(`Q${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!S:S, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!F:F, O${row}), "")`
    );
    sheet.getRange(`R${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!K:K, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!F:F, O${row}), "")`
    );
    sheet.getRange(`S${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!N:N, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!F:F, O${row}), "")`
    );
    sheet.getRange(`T${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!Q:Q, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!F:F, O${row}), "")`
    );
  }
  
  sheet.getRange(`P9:T40`).setNumberFormat('$#,##0.00');
  
  // Автоширина
  sheet.autoResizeColumns(1, 20);
  Logger.log('  ✓ Сводка Месяц создана с формулами');
}

// ===== 4. СОЗДАНИЕ ЛИСТА "ОПЕРАТОРЫ (МЕСЯЦ)" =====
function createOperatorsSheet(ss) {
  let sheet = ss.getSheetByName('Операторы (месяц)');
  if (!sheet) {
    sheet = ss.insertSheet('Операторы (месяц)', 2);
    Logger.log('📋 Создан лист "Операторы (месяц)"');
  } else {
    sheet.clear();
  }
  
  sheet.getRange('A1').setValue('👥 РЕЙТИНГ ОПЕРАТОРОВ');
  sheet.getRange('A1').setFontSize(16).setFontWeight('bold');
  
  const headerRow = 3;
  sheet.getRange(`A${headerRow}`).setValue('Оператор');
  sheet.getRange(`B${headerRow}`).setValue('Чистыми');
  sheet.getRange(`C${headerRow}`).setValue('% от итого');
  sheet.getRange(`D${headerRow}`).setValue('Брутто');
  sheet.getRange(`E${headerRow}`).setValue('OnlyFans');
  sheet.getRange(`F${headerRow}`).setValue('Крипто');
  sheet.getRange(`G${headerRow}`).setValue('PayPal');
  
  sheet.getRange(`A${headerRow}:G${headerRow}`).setBackground('#4285f4').setFontColor('#ffffff').setFontWeight('bold');
  
  // Динамический список операторов с сортировкой по чистыми (убывание)
  sheet.getRange('A4').setFormula(
    `=SORT(UNIQUE(FILTER('Income_Raw'!E:E, ('Income_Raw'!C:C="="&'Параметры'!$B$2)*('Income_Raw'!E:E<>""))), 1, TRUE)`
  );
  
  // Формулы для каждого оператора
  for (let row = 4; row <= 50; row++) {
    // Чистыми
    sheet.getRange(`B${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!S:S, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!E:E, A${row}), "")`
    );
    // % от итого
    sheet.getRange(`C${row}`).setFormula(
      `=IFERROR(IF(SUMIFS('Income_Raw'!S:S, 'Income_Raw'!C:C, "="&'Параметры'!$B$2)=0, 0, B${row}/SUMIFS('Income_Raw'!S:S, 'Income_Raw'!C:C, "="&'Параметры'!$B$2)), "")`
    );
    // Брутто
    sheet.getRange(`D${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!R:R, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!E:E, A${row}), "")`
    );
    // OnlyFans
    sheet.getRange(`E${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!K:K, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!E:E, A${row}), "")`
    );
    // Крипто
    sheet.getRange(`F${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!N:N, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!E:E, A${row}), "")`
    );
    // PayPal
    sheet.getRange(`G${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!Q:Q, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!E:E, A${row}), "")`
    );
  }
  
  sheet.getRange(`B4:G50`).setNumberFormat('$#,##0.00');
  sheet.getRange(`C4:C50`).setNumberFormat('0.00"%"');
  
  sheet.autoResizeColumns(1, 7);
  Logger.log('  ✓ Операторы (месяц) создана');
}

// ===== 5. СОЗДАНИЕ ЛИСТА "АНКЕТЫ (МЕСЯЦ)" =====
function createAnketySheet(ss) {
  let sheet = ss.getSheetByName('Анкеты (месяц)');
  if (!sheet) {
    sheet = ss.insertSheet('Анкеты (месяц)', 3);
    Logger.log('📋 Создан лист "Анкеты (месяц)"');
  } else {
    sheet.clear();
  }
  
  sheet.getRange('A1').setValue('📱 РЕЙТИНГ АНКЕТ');
  sheet.getRange('A1').setFontSize(16).setFontWeight('bold');
  
  const headerRow = 3;
  sheet.getRange(`A${headerRow}`).setValue('Анкета');
  sheet.getRange(`B${headerRow}`).setValue('Чистыми');
  sheet.getRange(`C${headerRow}`).setValue('% от итого');
  sheet.getRange(`D${headerRow}`).setValue('Брутто');
  sheet.getRange(`E${headerRow}`).setValue('OnlyFans');
  sheet.getRange(`F${headerRow}`).setValue('Крипто');
  sheet.getRange(`G${headerRow}`).setValue('PayPal');
  
  sheet.getRange(`A${headerRow}:G${headerRow}`).setBackground('#4285f4').setFontColor('#ffffff').setFontWeight('bold');
  
  // Динамический список анкет
  sheet.getRange('A4').setFormula(
    `=SORT(UNIQUE(FILTER('Income_Raw'!F:F, ('Income_Raw'!C:C="="&'Параметры'!$B$2)*('Income_Raw'!F:F<>""))), 1, TRUE)`
  );
  
  // Формулы
  for (let row = 4; row <= 50; row++) {
    sheet.getRange(`B${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!S:S, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!F:F, A${row}), "")`
    );
    sheet.getRange(`C${row}`).setFormula(
      `=IFERROR(IF(SUMIFS('Income_Raw'!S:S, 'Income_Raw'!C:C, "="&'Параметры'!$B$2)=0, 0, B${row}/SUMIFS('Income_Raw'!S:S, 'Income_Raw'!C:C, "="&'Параметры'!$B$2)), "")`
    );
    sheet.getRange(`D${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!R:R, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!F:F, A${row}), "")`
    );
    sheet.getRange(`E${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!K:K, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!F:F, A${row}), "")`
    );
    sheet.getRange(`F${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!N:N, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!F:F, A${row}), "")`
    );
    sheet.getRange(`G${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!Q:Q, 'Income_Raw'!C:C, "="&'Параметры'!$B$2, 'Income_Raw'!F:F, A${row}), "")`
    );
  }
  
  sheet.getRange(`B4:G50`).setNumberFormat('$#,##0.00');
  sheet.getRange(`C4:C50`).setNumberFormat('0.00"%"');
  
  sheet.autoResizeColumns(1, 7);
  Logger.log('  ✓ Анкеты (месяц) создана');
}

// ===== 6. СОЗДАНИЕ ЛИСТА "СВОДКА ВСЕ МЕСЯЦЫ" =====
function createAllMonthsSummary(ss) {
  let sheet = ss.getSheetByName('Сводка Все Месяцы');
  if (!sheet) {
    sheet = ss.insertSheet('Сводка Все Месяцы', 4);
    Logger.log('📋 Создан лист "Сводка Все Месяцы"');
  } else {
    sheet.clear();
  }
  
  sheet.getRange('A1').setValue('📈 СВОДКА ПО ВСЕМ МЕСЯЦАМ');
  sheet.getRange('A1').setFontSize(16).setFontWeight('bold');
  
  const headerRow = 3;
  sheet.getRange(`A${headerRow}`).setValue('Месяц (YYYY-MM)');
  sheet.getRange(`B${headerRow}`).setValue('Брутто');
  sheet.getRange(`C${headerRow}`).setValue('Чистыми');
  sheet.getRange(`D${headerRow}`).setValue('OnlyFans');
  sheet.getRange(`E${headerRow}`).setValue('Крипто');
  sheet.getRange(`F${headerRow}`).setValue('PayPal');
  
  sheet.getRange(`A${headerRow}:F${headerRow}`).setBackground('#4285f4').setFontColor('#ffffff').setFontWeight('bold');
  
  // Список всех уникальных месяцев
  sheet.getRange('A4').setFormula(
    `=SORT(UNIQUE(FILTER('Income_Raw'!C:C, 'Income_Raw'!C:C<>"")), 1, FALSE)`
  );
  
  // Формулы для каждого месяца
  for (let row = 4; row <= 100; row++) {
    sheet.getRange(`B${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!R:R, 'Income_Raw'!C:C, A${row}), "")`
    );
    sheet.getRange(`C${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!S:S, 'Income_Raw'!C:C, A${row}), "")`
    );
    sheet.getRange(`D${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!K:K, 'Income_Raw'!C:C, A${row}), "")`
    );
    sheet.getRange(`E${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!N:N, 'Income_Raw'!C:C, A${row}), "")`
    );
    sheet.getRange(`F${row}`).setFormula(
      `=IFERROR(SUMIFS('Income_Raw'!Q:Q, 'Income_Raw'!C:C, A${row}), "")`
    );
  }
  
  sheet.getRange(`B4:F100`).setNumberFormat('$#,##0.00');
  
  sheet.autoResizeColumns(1, 6);
  Logger.log('  ✓ Сводка Все Месяцы создана');
}

function onEdit(e) {
  // Этот обработчик срабатывает при редактировании (опционально)
  // Можно добавить логику для обновления фильтров
}
