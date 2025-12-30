/**
 * INCOME DASHBOARD - Google Apps Script
 * 
 * УСТАНОВКА:
 * 1. Откройте Google Sheets
 * 2. Инструменты → Редактор скриптов
 * 3. Вставьте весь этот код
 * 4. Сохраните (Ctrl+S)
 * 5. Развернуть → Новое развертывание → Web app
 * 6. Execute as: Ваш аккаунт
 * 7. Who has access: Anyone
 * 8. Скопируйте URL развертывания
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const action = data.action;
        const payload = data.data;

        let response = {};

        switch (action) {
            case 'addIncome':
                addIncomeRow(payload);
                response = { status: 'success' };
                break;
            case 'updateIncome':
                updateIncomeRow(payload);
                response = { status: 'success' };
                break;
            case 'deleteIncome':
                deleteIncomeRow(payload.id);
                response = { status: 'success' };
                break;
            case 'getAllData':
                response = getAllData();
                break;
            case 'addPayment':
                addPaymentRow(payload);
                response = { status: 'success' };
                break;
            case 'deletePayment':
                deletePaymentRow(payload.id);
                response = { status: 'success' };
                break;
            case 'addPenalty':
                addPenaltyRow(payload);
                response = { status: 'success' };
                break;
            case 'deletePenalty':
                deletePenaltyRow(payload.id);
                response = { status: 'success' };
                break;
            case 'addOperator':
                addOperatorRow(payload.name);
                response = { status: 'success' };
                break;
            case 'deleteOperator':
                deleteOperatorRow(payload.name);
                response = { status: 'success' };
                break;
            case 'addAnketa':
                addAnketaRow(payload.name);
                response = { status: 'success' };
                break;
            case 'deleteAnketa':
                deleteAnketaRow(payload.name);
                response = { status: 'success' };
                break;
            case 'addAdmin':
                addAdminRow(payload.name);
                response = { status: 'success' };
                break;
            case 'deleteAdmin':
                deleteAdminRow(payload.name);
                response = { status: 'success' };
                break;
            default:
                response = { status: 'error', message: 'Unknown action' };
        }

        return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        Logger.log('Error: ' + error);
        return ContentService.createTextOutput(JSON.stringify({status: 'error', error: error.toString()})).setMimeType(ContentService.MimeType.JSON);
    }
}

function getAllData() {
    const incomeSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Доходы') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Доходы');
    const operatorsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Операторы') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Операторы');
    const anketySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Анкеты') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Анкеты');
    const adminsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Администраторы') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Администраторы');

    const incomes = getIncomes(incomeSheet);
    const operators = getOperators(operatorsSheet);
    const ankety = getAnkety(anketySheet);
    const admins = getAdmins(adminsSheet);

    return {
        incomes: incomes,
        operators: operators,
        ankety: ankety,
        admins: admins
    };
}

// ===== ДОХОДЫ =====
function addIncomeRow(income) {
    const sheet = getOrCreateSheet('Доходы');
    
    if (sheet.getLastRow() === 0) {
        sheet.appendRow([
            'ID', 'Дата', 'Время', 'Оператор', 'Анкета', 'Смена',
            'OnlyFans Брутто', 'OnlyFans %', 'OnlyFans Чистыми',
            'Крипто Брутто', 'Крипто %', 'Крипто Чистыми',
            'PayPal Брутто', 'PayPal %', 'PayPal Чистыми',
            'Общий Брутто', 'Общий Чистыми'
        ]);
    }
    
    sheet.appendRow([
        income.id,
        income.date,
        income.timestamp,
        income.operator,
        income.anketa,
        income.shift,
        income.sources.onlyfans.gross,
        income.sources.onlyfans.percent,
        income.sources.onlyfans.operatorShare,
        income.sources.crypto.gross,
        income.sources.crypto.percent,
        income.sources.crypto.operatorShare,
        income.sources.paypal.gross,
        income.sources.paypal.percent,
        income.sources.paypal.operatorShare,
        income.total.gross,
        income.total.operatorShare
    ]);
}

function updateIncomeRow(income) {
    const sheet = getOrCreateSheet('Доходы');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] == income.id) {
            sheet.getRange(i + 1, 1, 1, 17).setValues([[
                income.id,
                income.date,
                income.timestamp,
                income.operator,
                income.anketa,
                income.shift,
                income.sources.onlyfans.gross,
                income.sources.onlyfans.percent,
                income.sources.onlyfans.operatorShare,
                income.sources.crypto.gross,
                income.sources.crypto.percent,
                income.sources.crypto.operatorShare,
                income.sources.paypal.gross,
                income.sources.paypal.percent,
                income.sources.paypal.operatorShare,
                income.total.gross,
                income.total.operatorShare
            ]]);
            break;
        }
    }
}

function deleteIncomeRow(id) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Доходы');
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] == id) {
            sheet.deleteRow(i + 1);
            break;
        }
    }
}

function getIncomes(sheet) {
    if (sheet.getLastRow() === 0) return [];
    
    const data = sheet.getDataRange().getValues();
    const incomes = [];
    
    for (let i = 1; i < data.length; i++) {
        try {
            incomes.push({
                id: data[i][0],
                date: data[i][1],
                timestamp: data[i][2],
                operator: data[i][3],
                anketa: data[i][4],
                shift: data[i][5],
                sources: {
                    onlyfans: { gross: data[i][6], percent: data[i][7], operatorShare: data[i][8] },
                    crypto: { gross: data[i][9], percent: data[i][10], operatorShare: data[i][11] },
                    paypal: { gross: data[i][12], percent: data[i][13], operatorShare: data[i][14] }
                },
                total: { gross: data[i][15], operatorShare: data[i][16] }
            });
        } catch (e) {
            Logger.log('Error parsing income row: ' + e);
        }
    }
    
    return incomes;
}

// ===== АВАНСЫ И ЗАРПЛАТА =====
function addPaymentRow(payment) {
    const sheet = getOrCreateSheet('Авансы и Зарплата');
    
    if (sheet.getLastRow() === 0) {
        sheet.appendRow(['ID', 'Оператор', 'Тип', 'Сумма', 'Дата']);
    }
    
    sheet.appendRow([
        payment.id,
        payment.operator,
        payment.type === 'advance' ? 'Аванс' : 'Зарплата',
        payment.amount,
        payment.date
    ]);
}

function deletePaymentRow(id) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Авансы и Зарплата');
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] == id) {
            sheet.deleteRow(i + 1);
            break;
        }
    }
}

// ===== ШТРАФЫ =====
function addPenaltyRow(penalty) {
    const sheet = getOrCreateSheet('Штрафы');
    
    if (sheet.getLastRow() === 0) {
        sheet.appendRow(['ID', 'Оператор', 'Сумма', 'Причина', 'Дата']);
    }
    
    sheet.appendRow([
        penalty.id,
        penalty.operator,
        penalty.amount,
        penalty.reason,
        penalty.date
    ]);
}

function deletePenaltyRow(id) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Штрафы');
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] == id) {
            sheet.deleteRow(i + 1);
            break;
        }
    }
}

// ===== ОПЕРАТОРЫ =====
function addOperatorRow(name) {
    const sheet = getOrCreateSheet('Операторы');
    if (sheet.getLastRow() === 0) sheet.appendRow(['Имя']);
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === name) return;
    }
    sheet.appendRow([name]);
}

function deleteOperatorRow(name) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Операторы');
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === name) {
            sheet.deleteRow(i + 1);
            break;
        }
    }
}

function getOperators(sheet) {
    if (sheet.getLastRow() === 0) return ["Operator 1", "Operator 2", "Operator 3"];
    
    const data = sheet.getDataRange().getValues();
    const operators = [];
    
    for (let i = 1; i < data.length; i++) {
        if (data[i][0]) operators.push(data[i][0]);
    }
    
    return operators.length > 0 ? operators : ["Operator 1", "Operator 2", "Operator 3"];
}

// ===== АНКЕТЫ =====
function addAnketaRow(name) {
    const sheet = getOrCreateSheet('Анкеты');
    if (sheet.getLastRow() === 0) sheet.appendRow(['Имя']);
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === name) return;
    }
    sheet.appendRow([name]);
}

function deleteAnketaRow(name) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Анкеты');
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === name) {
            sheet.deleteRow(i + 1);
            break;
        }
    }
}

function getAnkety(sheet) {
    if (sheet.getLastRow() === 0) return ["Succuba", "Mommy", "Nola", "Lust", "Mermaid", "Stacy", "Fitness", "Caitlyn"];
    
    const data = sheet.getDataRange().getValues();
    const ankety = [];
    
    for (let i = 1; i < data.length; i++) {
        if (data[i][0]) ankety.push(data[i][0]);
    }
    
    return ankety.length > 0 ? ankety : ["Succuba", "Mommy", "Nola", "Lust", "Mermaid", "Stacy", "Fitness", "Caitlyn"];
}

// ===== АДМИНИСТРАТОРЫ =====
function addAdminRow(name) {
    const sheet = getOrCreateSheet('Администраторы');
    if (sheet.getLastRow() === 0) sheet.appendRow(['Имя']);
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === name) return;
    }
    sheet.appendRow([name]);
}

function deleteAdminRow(name) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Администраторы');
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === name) {
            sheet.deleteRow(i + 1);
            break;
        }
    }
}

function getAdmins(sheet) {
    if (sheet.getLastRow() === 0) return ["Admin 1", "Admin 2"];
    
    const data = sheet.getDataRange().getValues();
    const admins = [];
    
    for (let i = 1; i < data.length; i++) {
        if (data[i][0]) admins.push(data[i][0]);
    }
    
    return admins.length > 0 ? admins : ["Admin 1", "Admin 2"];
}

// ===== УТИЛИТЫ =====
function getOrCreateSheet(name) {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(name);
    }
    return sheet;
}

function test() {
    Logger.log('✓ Google Apps Script готов!');
}
