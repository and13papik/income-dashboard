/**
 * INCOME DASHBOARD - Google Apps Script v2
 * Append-only логика + временной контекст
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
    const incomeSheet = getOrCreateSheet('Income_Raw');
    const operatorsSheet = getOrCreateSheet('Operators');
    const anketySheet = getOrCreateSheet('Ankety');
    const adminsSheet = getOrCreateSheet('Admins');

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

// ===== ДОХОДЫ (Income_Raw) =====
function addIncomeRow(income) {
    const sheet = getOrCreateSheet('Income_Raw');
    
    // Создаём заголовки только если таблица пуста
    if (sheet.getLastRow() === 0) {
        sheet.appendRow([
            'id', 'date_iso', 'month', 'timestamp',
            'operator', 'anketa', 'shift', 'day',
            'of_gross', 'of_percent', 'of_net',
            'crypto_gross', 'crypto_percent', 'crypto_net',
            'paypal_gross', 'paypal_percent', 'paypal_net',
            'gross_total', 'net_total'
        ]);
    }
    
    // APPEND (добавляем строку в конец, НЕ перезаписываем)
    sheet.appendRow([
        income.id,
        income.date_iso,
        income.month,
        income.timestamp,
        income.operator,
        income.anketa,
        income.shift,
        income.day,
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
    // Для update: удаляем старую, добавляем новую (append)
    deleteIncomeRow(income.id);
    addIncomeRow(income);
}

function deleteIncomeRow(id) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Income_Raw');
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
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
                date_iso: data[i][1],
                month: data[i][2],
                timestamp: data[i][3],
                operator: data[i][4],
                anketa: data[i][5],
                shift: data[i][6],
                day: data[i][7],
                sources: {
                    onlyfans: { gross: data[i][8], percent: data[i][9], operatorShare: data[i][10] },
                    crypto: { gross: data[i][11], percent: data[i][12], operatorShare: data[i][13] },
                    paypal: { gross: data[i][14], percent: data[i][15], operatorShare: data[i][16] }
                },
                total: { gross: data[i][17], operatorShare: data[i][18] }
            });
        } catch (e) {
            Logger.log('Error parsing income row: ' + e);
        }
    }
    
    return incomes;
}

// ===== АВАНСЫ И ЗАРПЛАТА (Advances_Raw) =====
function addPaymentRow(payment) {
    const sheet = getOrCreateSheet('Advances_Raw');
    
    if (sheet.getLastRow() === 0) {
        sheet.appendRow(['id', 'date_iso', 'month', 'timestamp', 'operator', 'type', 'amount']);
    }
    
    sheet.appendRow([
        payment.id,
        payment.date_iso,
        payment.month,
        payment.timestamp,
        payment.operator,
        payment.type === 'advance' ? 'Аванс' : 'Зарплата',
        payment.amount
    ]);
}

function deletePaymentRow(id) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Advances_Raw');
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
        if (data[i][0] == id) {
            sheet.deleteRow(i + 1);
            break;
        }
    }
}

// ===== ШТРАФЫ (Penalties_Raw) =====
function addPenaltyRow(penalty) {
    const sheet = getOrCreateSheet('Penalties_Raw');
    
    if (sheet.getLastRow() === 0) {
        sheet.appendRow(['id', 'date_iso', 'month', 'timestamp', 'operator', 'amount', 'reason']);
    }
    
    sheet.appendRow([
        penalty.id,
        penalty.date_iso,
        penalty.month,
        penalty.timestamp,
        penalty.operator,
        penalty.amount,
        penalty.reason
    ]);
}

function deletePenaltyRow(id) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Penalties_Raw');
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
        if (data[i][0] == id) {
            sheet.deleteRow(i + 1);
            break;
        }
    }
}

// ===== ОПЕРАТОРЫ =====
function addOperatorRow(name) {
    const sheet = getOrCreateSheet('Operators');
    if (sheet.getLastRow() === 0) sheet.appendRow(['Name']);
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === name) return;
    }
    sheet.appendRow([name]);
}

function deleteOperatorRow(name) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Operators');
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
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
    const sheet = getOrCreateSheet('Ankety');
    if (sheet.getLastRow() === 0) sheet.appendRow(['Name']);
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === name) return;
    }
    sheet.appendRow([name]);
}

function deleteAnketaRow(name) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Ankety');
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
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
    const sheet = getOrCreateSheet('Admins');
    if (sheet.getLastRow() === 0) sheet.appendRow(['Name']);
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === name) return;
    }
    sheet.appendRow([name]);
}

function deleteAdminRow(name) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Admins');
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
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
    Logger.log('✓ Google Apps Script v2 готов!');
    Logger.log('Листы: Income_Raw, Advances_Raw, Penalties_Raw, Operators, Ankety, Admins');
}
