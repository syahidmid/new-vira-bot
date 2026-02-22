/**
 * debugDB.js
 * ==================================================
 * This file contains DATABASE DEBUGGING functions.
 *
 * Purpose:
 * - Used ONLY for inspecting and validating DB-related logic.
 * - Runs outside bot runtime / wizard / scene flow.
 * - Executed manually from Google Apps Script Editor.
 *
 * General Debug Workflow:
 * 1. Identify the function that needs to be debugged.
 *    (Example: category prediction, keyword lookup, DB mapping)
 *
 * 2. Create a dedicated debug function in this file.
 *    - The debug function MUST NOT modify any DB data.
 *    - The debug function MUST call the target function internally.
 *
 * 3. Inside the debug function:
 *    - Use `var` to define test input(s).
 *    - Call the target function using those variables.
 *    - Use `Logger.log()` to observe the output.
 *
 * Rules:
 * - No business logic is implemented here.
 * - No DB write / update / delete is allowed.
 * - No dependency on bot context, wizard, or runtime state.
 * - Logger output should focus only on the data being inspected.
 *
 * This file serves as a shared debugging reference
 * between developer and assistant.
 * 
 * 
 */

/**
 * DEBUG: <Target Function Name>
 * --------------------------------------------------
 * Steps:
 * - Define input using `var`
 * - Call the target function
 * - Log only the relevant output
 */
function debugTargetFunctionExample() {
    var input = 'sample input value';

    var result = targetFunctionToDebug(input);

    Logger.log(result);
}


/**
 * DEBUG: findcatTransactionFromDbOnly
 * --------------------------------------------------
 * Inspects the category result returned by the function.
 */
function debugFindCategory() {
    var transactionName = 'Kopi Kenangan';

    var result = findcatTransactionFromDbOnly(transactionName);

    Logger.log('Transaction Name: ' + transactionName);
    Logger.log('Category: ' + result.category);
    Logger.log('Matched: ' + result.matched);
}

function debugAppendDefaultCategory() {
    var payload = {
        Query: 'Kopi',
        Cat: 'Food and Drink',
        Tag: 'Ngopi'
    }

    var result = appendSheets(dbcatandTag, payload)

    Logger.log(result)
}
