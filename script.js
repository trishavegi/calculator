// DOM Elements
const previousOperandElement = document.getElementById('expression');
const currentOperandElement = document.getElementById('currentOperand');
const historyList = document.getElementById('historyList');
const themeBtn = document.getElementById('themeBtn');
const modeBtn = document.getElementById('modeBtn');
const scientificGrid = document.getElementById('scientificGrid');

// Calculator State
let currentInput = '0';
let previousInput = '';
let currentOperator = null;
let waitingForNextOperand = false;
let lastResultWasError = false;
let calculationHistory = [];
let isScientificMode = true;
let pendingFunction = null;  // Store pending scientific function (sin, cos, etc.)
let functionValue = null;     // Store value for the function

// Load saved history from localStorage
function loadHistory() {
    const saved = localStorage.getItem('calcHistory');
    if (saved) {
        calculationHistory = JSON.parse(saved);
        updateHistoryDisplay();
    }
}

// Save history to localStorage
function saveHistory() {
    localStorage.setItem('calcHistory', JSON.stringify(calculationHistory.slice(-20)));
}

// Add to history
function addToHistory(expression, result) {
    const historyItem = {
        expression: expression,
        result: result,
        timestamp: new Date().toLocaleTimeString()
    };
    calculationHistory.unshift(historyItem);
    if (calculationHistory.length > 20) calculationHistory.pop();
    saveHistory();
    updateHistoryDisplay();
}

// Update history display
function updateHistoryDisplay() {
    if (!historyList) return;
    
    if (calculationHistory.length === 0) {
        historyList.innerHTML = '<div class="history-placeholder">No calculations yet</div>';
        return;
    }
    
    historyList.innerHTML = calculationHistory.map((item, index) => `
        <div class="history-item" data-result="${item.result}">
            <span class="history-expression">${item.expression} =</span>
            <span class="history-result">${item.result}</span>
        </div>
    `).join('');
    
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const result = item.getAttribute('data-result');
            recallCalculation(result);
        });
    });
}

// Recall calculation result
function recallCalculation(result) {
    currentInput = result;
    previousInput = '';
    currentOperator = null;
    waitingForNextOperand = true;
    lastResultWasError = false;
    pendingFunction = null;
    functionValue = null;
    updateDisplay();
}

// Clear history
function clearHistory() {
    calculationHistory = [];
    saveHistory();
    updateHistoryDisplay();
}

// Theme toggle
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeBtn.innerHTML = '🌙 Dark';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        themeBtn.innerHTML = '☀️ Light';
    }
}

// Mode toggle (Basic/Scientific)
function toggleMode() {
    isScientificMode = !isScientificMode;
    if (scientificGrid) {
        scientificGrid.style.display = isScientificMode ? 'grid' : 'none';
        modeBtn.innerHTML = isScientificMode ? '🔢 Basic' : '🔬 Scientific';
    }
}

// Update display
function updateDisplay() {
    let displayValue = currentInput === '' ? '0' : currentInput;
    if (currentOperandElement) {
        currentOperandElement.innerText = displayValue;
    }
    
    if (previousOperandElement) {
        // Show pending function if exists
        if (pendingFunction) {
            let funcDisplay = '';
            switch(pendingFunction) {
                case 'sin': funcDisplay = 'sin('; break;
                case 'cos': funcDisplay = 'cos('; break;
                case 'tan': funcDisplay = 'tan('; break;
                case 'sqrt': funcDisplay = '√('; break;
                case 'log': funcDisplay = 'log('; break;
                case 'ln': funcDisplay = 'ln('; break;
                case 'square': funcDisplay = 'sqr('; break;
                case 'cube': funcDisplay = 'cube('; break;
                case 'factorial': funcDisplay = 'fact('; break;
                case 'reciprocal': funcDisplay = '1/('; break;
                default: funcDisplay = pendingFunction + '(';
            }
            previousOperandElement.innerText = funcDisplay;
        } else if (previousInput !== '' && currentOperator !== null) {
            let operatorSymbol = '';
            switch (currentOperator) {
                case '+': operatorSymbol = '+'; break;
                case '-': operatorSymbol = '−'; break;
                case '*': operatorSymbol = '×'; break;
                case '/': operatorSymbol = '÷'; break;
                case '^': operatorSymbol = '^'; break;
                default: operatorSymbol = currentOperator;
            }
            previousOperandElement.innerText = `${previousInput} ${operatorSymbol}`;
        } else {
            previousOperandElement.innerText = '';
        }
    }
}

// Sanitize number
function sanitizeNumber(str) {
    if (str === '') return '0';
    if (str.includes('.')) {
        let parts = str.split('.');
        parts[0] = parts[0].replace(/^0+/, '') || '0';
        if (parts[1] && parts[1].length > 10) parts[1] = parts[1].slice(0, 10);
        let newStr = parts.join('.');
        if (newStr.endsWith('.')) newStr = newStr.slice(0, -1);
        return newStr;
    }
    return str.replace(/^0+/, '') || '0';
}

// Append number or decimal
function appendToCurrent(value) {
    if (lastResultWasError) {
        clearAll();
        lastResultWasError = false;
    }
    
    if (waitingForNextOperand) {
        currentInput = (value === '.') ? '0.' : value;
        waitingForNextOperand = false;
    } else {
        if (value === '.') {
            if (currentInput.includes('.')) return;
            if (currentInput === '' || currentInput === '0') {
                currentInput = '0.';
            } else {
                currentInput += '.';
            }
        } else {
            if (currentInput === '0' && !waitingForNextOperand) {
                currentInput = value;
            } else {
                currentInput += value;
            }
        }
    }
    currentInput = sanitizeNumber(currentInput);
    updateDisplay();
}

// Perform calculation
function calculate(operator, aStr, bStr) {
    let a = parseFloat(aStr);
    let b = parseFloat(bStr);
    if (isNaN(a)) a = 0;
    if (isNaN(b)) b = 0;
    
    let result;
    switch (operator) {
        case '+': result = a + b; break;
        case '-': result = a - b; break;
        case '*': result = a * b; break;
        case '/': 
            if (b === 0) return 'ERROR';
            result = a / b;
            break;
        case '%': result = a * b / 100; break;
        case '^': result = Math.pow(a, b); break;
        default: return null;
    }
    
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        result = parseFloat(result.toFixed(10));
        return result.toString();
    }
    return 'ERROR';
}

// Execute scientific function
function executeScientificFunction(func, value) {
    let num = parseFloat(value);
    if (isNaN(num)) num = 0;
    
    let result;
    let funcName = '';
    
    switch (func) {
        case 'sqrt':
            if (num < 0) return 'ERROR';
            result = Math.sqrt(num);
            funcName = `√(${value})`;
            break;
        case 'square':
            result = Math.pow(num, 2);
            funcName = `sqr(${value})`;
            break;
        case 'cube':
            result = Math.pow(num, 3);
            funcName = `cube(${value})`;
            break;
        case 'sin':
            result = Math.sin(num * Math.PI / 180);
            funcName = `sin(${value}°)`;
            break;
        case 'cos':
            result = Math.cos(num * Math.PI / 180);
            funcName = `cos(${value}°)`;
            break;
        case 'tan':
            result = Math.tan(num * Math.PI / 180);
            funcName = `tan(${value}°)`;
            break;
        case 'log':
            if (num <= 0) return 'ERROR';
            result = Math.log10(num);
            funcName = `log(${value})`;
            break;
        case 'ln':
            if (num <= 0) return 'ERROR';
            result = Math.log(num);
            funcName = `ln(${value})`;
            break;
        case 'factorial':
            if (num < 0 || !Number.isInteger(num) || num > 170) return 'ERROR';
            result = factorial(num);
            funcName = `${value}!`;
            break;
        case 'reciprocal':
            if (num === 0) return 'ERROR';
            result = 1 / num;
            funcName = `1/${value}`;
            break;
        default:
            return null;
    }
    
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        result = parseFloat(result.toFixed(10));
    }
    
    return { result: result.toString(), funcName: funcName };
}

// Set pending scientific function (sin, cos, etc.)
function setPendingFunction(func) {
    console.log("Setting pending function:", func);
    
    if (lastResultWasError) {
        clearAll();
        lastResultWasError = false;
    }
    
    // If there's a pending operation, calculate it first
    if (currentOperator !== null && previousInput !== '' && !waitingForNextOperand) {
        let calcResult = calculate(currentOperator, previousInput, currentInput);
        if (calcResult === 'ERROR') {
            currentInput = 'ERR';
            previousInput = '';
            currentOperator = null;
            waitingForNextOperand = false;
            lastResultWasError = true;
            updateDisplay();
            return;
        }
        currentInput = calcResult;
        previousInput = '';
        currentOperator = null;
    }
    
    // Set the pending function
    pendingFunction = func;
    waitingForNextOperand = true;
    updateDisplay();
}

// Evaluate (handle equals button)
function evaluate() {
    console.log("Evaluate called", {pendingFunction, currentOperator, previousInput, currentInput});
    
    if (lastResultWasError) {
        clearAll();
        updateDisplay();
        lastResultWasError = false;
        return;
    }
    
    // Handle pending scientific function (sin 30 =)
    if (pendingFunction) {
        let resultObj = executeScientificFunction(pendingFunction, currentInput);
        if (resultObj === 'ERROR' || resultObj.result === 'ERROR') {
            currentInput = 'ERR';
            previousInput = '';
            currentOperator = null;
            waitingForNextOperand = false;
            lastResultWasError = true;
            pendingFunction = null;
            updateDisplay();
            return;
        }
        
        // Add to history
        addToHistory(resultObj.funcName, resultObj.result);
        
        // Set result
        currentInput = resultObj.result;
        previousInput = '';
        currentOperator = null;
        waitingForNextOperand = true;
        pendingFunction = null;
        lastResultWasError = false;
        updateDisplay();
        return;
    }
    
    // Handle regular operator
    if (currentOperator === null) {
        return;
    }
    
    if (previousInput === '') {
        return;
    }
    
    let currentVal = currentInput === '' ? '0' : currentInput;
    let expression = `${previousInput} ${currentOperator} ${currentVal}`;
    let result = calculate(currentOperator, previousInput, currentVal);
    
    if (result === 'ERROR') {
        currentInput = 'ERR';
        previousInput = '';
        currentOperator = null;
        waitingForNextOperand = false;
        lastResultWasError = true;
        updateDisplay();
        return;
    }
    
    addToHistory(expression, result);
    currentInput = result;
    previousInput = '';
    currentOperator = null;
    waitingForNextOperand = true;
    lastResultWasError = false;
    updateDisplay();
}

// Set operator
function setOperator(op) {
    if (lastResultWasError) {
        clearAll();
        lastResultWasError = false;
    }
    
    // Clear any pending function
    pendingFunction = null;
    
    if (waitingForNextOperand && currentOperator !== null) {
        currentOperator = op;
        updateDisplay();
        return;
    }
    
    if (currentOperator !== null && previousInput !== '' && !waitingForNextOperand) {
        let result = calculate(currentOperator, previousInput, currentInput);
        if (result === 'ERROR') {
            currentInput = 'ERR';
            previousInput = '';
            currentOperator = null;
            waitingForNextOperand = false;
            lastResultWasError = true;
            updateDisplay();
            return;
        }
        previousInput = result;
        currentInput = result;
        currentOperator = op;
        waitingForNextOperand = true;
        updateDisplay();
    } else {
        previousInput = currentInput !== '' ? currentInput : '0';
        currentOperator = op;
        waitingForNextOperand = true;
        updateDisplay();
    }
}

// Constants (pi and e) - these execute immediately
function insertConstant(constant) {
    if (lastResultWasError) clearAll();
    
    let value = constant === 'pi' ? Math.PI : Math.E;
    let funcName = constant === 'pi' ? 'π' : 'e';
    
    currentInput = value.toString();
    waitingForNextOperand = true;
    previousInput = '';
    currentOperator = null;
    pendingFunction = null;
    
    addToHistory(funcName, currentInput);
    updateDisplay();
}

// Factorial function
function factorial(n) {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// Power function
function setPower() {
    pendingFunction = null;
    setOperator('^');
}

// Clear all
function clearAll() {
    currentInput = '0';
    previousInput = '';
    currentOperator = null;
    waitingForNextOperand = false;
    lastResultWasError = false;
    pendingFunction = null;
    functionValue = null;
    updateDisplay();
}

// Delete last character
function deleteLast() {
    if (lastResultWasError) {
        clearAll();
        return;
    }
    if (waitingForNextOperand && !pendingFunction) return;
    
    if (currentInput.length === 1) {
        currentInput = '0';
    } else {
        currentInput = currentInput.slice(0, -1);
        if (currentInput === '') currentInput = '0';
    }
    currentInput = sanitizeNumber(currentInput);
    updateDisplay();
}

// Handle percentage
function handlePercent() {
    if (lastResultWasError) clearAll();
    pendingFunction = null;
    
    let numericValue = parseFloat(currentInput);
    if (isNaN(numericValue)) numericValue = 0;
    let percentValue = numericValue / 100;
    currentInput = percentValue.toString();
    if (currentInput.includes('e')) {
        currentInput = percentValue.toFixed(10).replace(/\.?0+$/, '');
    }
    currentInput = sanitizeNumber(currentInput);
    updateDisplay();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log("Calculator initialized - Traditional Scientific Mode");
    
    // Number buttons
    document.querySelectorAll('.number').forEach(btn => {
        btn.addEventListener('click', () => {
            const number = btn.getAttribute('data-number');
            if (number !== null) appendToCurrent(number);
        });
    });
    
    // Operator buttons
    const addBtn = document.getElementById('addBtn');
    const subtractBtn = document.getElementById('subtractBtn');
    const multiplyBtn = document.getElementById('multiplyBtn');
    const divideBtn = document.getElementById('divideBtn');
    const equalsBtn = document.getElementById('equalsBtn');
    const clearBtn = document.getElementById('clearBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const dotBtn = document.getElementById('dotBtn');
    const percentBtn = document.getElementById('percentBtn');
    const sqrtBtn = document.getElementById('sqrtBtn');
    
    if (addBtn) addBtn.addEventListener('click', () => setOperator('+'));
    if (subtractBtn) subtractBtn.addEventListener('click', () => setOperator('-'));
    if (multiplyBtn) multiplyBtn.addEventListener('click', () => setOperator('*'));
    if (divideBtn) divideBtn.addEventListener('click', () => setOperator('/'));
    if (equalsBtn) equalsBtn.addEventListener('click', evaluate);
    if (clearBtn) clearBtn.addEventListener('click', clearAll);
    if (deleteBtn) deleteBtn.addEventListener('click', deleteLast);
    if (dotBtn) dotBtn.addEventListener('click', () => appendToCurrent('.'));
    if (percentBtn) percentBtn.addEventListener('click', handlePercent);
    if (sqrtBtn) sqrtBtn.addEventListener('click', () => setPendingFunction('sqrt'));
    
    // Scientific buttons - these SET the pending function, don't execute yet
    const squareBtn = document.getElementById('squareBtn');
    const cubeBtn = document.getElementById('cubeBtn');
    const sinBtn = document.getElementById('sinBtn');
    const cosBtn = document.getElementById('cosBtn');
    const tanBtn = document.getElementById('tanBtn');
    const logBtn = document.getElementById('logBtn');
    const lnBtn = document.getElementById('lnBtn');
    const factorialBtn = document.getElementById('factorialBtn');
    const reciprocalBtn = document.getElementById('reciprocalBtn');
    const piBtn = document.getElementById('piBtn');
    const eBtn = document.getElementById('eBtn');
    const powBtn = document.getElementById('powBtn');
    
    if (squareBtn) squareBtn.addEventListener('click', () => setPendingFunction('square'));
    if (cubeBtn) cubeBtn.addEventListener('click', () => setPendingFunction('cube'));
    if (sinBtn) sinBtn.addEventListener('click', () => setPendingFunction('sin'));
    if (cosBtn) cosBtn.addEventListener('click', () => setPendingFunction('cos'));
    if (tanBtn) tanBtn.addEventListener('click', () => setPendingFunction('tan'));
    if (logBtn) logBtn.addEventListener('click', () => setPendingFunction('log'));
    if (lnBtn) lnBtn.addEventListener('click', () => setPendingFunction('ln'));
    if (factorialBtn) factorialBtn.addEventListener('click', () => setPendingFunction('factorial'));
    if (reciprocalBtn) reciprocalBtn.addEventListener('click', () => setPendingFunction('reciprocal'));
    if (piBtn) piBtn.addEventListener('click', () => insertConstant('pi'));
    if (eBtn) eBtn.addEventListener('click', () => insertConstant('e'));
    if (powBtn) powBtn.addEventListener('click', setPower);
    
    // Theme and mode
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    if (modeBtn) modeBtn.addEventListener('click', toggleMode);
    
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearHistory);
});

// Keyboard support
window.addEventListener('keydown', (e) => {
    const key = e.key;
    if (key >= '0' && key <= '9') {
        e.preventDefault();
        appendToCurrent(key);
    } else if (key === '.') {
        e.preventDefault();
        appendToCurrent('.');
    } else if (key === '+') {
        e.preventDefault();
        setOperator('+');
    } else if (key === '-') {
        e.preventDefault();
        setOperator('-');
    } else if (key === '*') {
        e.preventDefault();
        setOperator('*');
    } else if (key === '/') {
        e.preventDefault();
        setOperator('/');
    } else if (key === '%') {
        e.preventDefault();
        handlePercent();
    } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        evaluate();
    } else if (key === 'Escape') {
        e.preventDefault();
        clearAll();
    } else if (key === 'Backspace') {
        e.preventDefault();
        deleteLast();
    } else if (key === 's') {
        e.preventDefault();
        setPendingFunction('sin');
    } else if (key === 'c') {
        e.preventDefault();
        setPendingFunction('cos');
    } else if (key === 't') {
        e.preventDefault();
        setPendingFunction('tan');
    }
});

// Initialize
loadHistory();
updateDisplay();