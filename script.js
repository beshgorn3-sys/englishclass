// =================================================
// script.js - نسخة مصححة لمعالجة أخطاء ReferenceError
// =================================================

// !! مهم جداً: تأكد من أن هذا الرابط هو رابط الـ API الصحيح والفعال !!
const API_URL = "https://script.google.com/macros/s/AKfycbzGmx9xmraivkjGR-Zss_iTDAdmBfZRibsuZiSThy2pDB8OAHpeSJfLCio5gJ6we-IAAg/exec";

// --- إشارة إلى عناصر الصفحة (DOM Elements  ) ---
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const loadingIndicator = document.getElementById('loading-indicator');
const allScreens = [startScreen, quizScreen, resultScreen, loadingIndicator];

// عناصر شاشة البداية
const testListContainer = document.getElementById('test-list-container');
const nameInputContainer = document.getElementById('name-input-container');
const selectedTestName = document.getElementById('selected-test-name');
const studentNameInput = document.getElementById('student-name');
const startBtn = document.getElementById('start-btn');

// عناصر شاشة الاختبار العامة
const progressText = document.getElementById('progress-text');

// قوالب الأسئلة
const mcTemplate = document.getElementById('multiple-choice-template');
const mcWordText = document.getElementById('mc-word-text');
const mcSpeakButton = document.getElementById('mc-speak-button');
const mcOptionsContainer = document.getElementById('mc-options-container');
const wrTemplate = document.getElementById('writing-template');
const wrMeaningText = document.getElementById('wr-meaning-text');
const wrInput = document.getElementById('wr-input');
const wrCheckBtn = document.getElementById('wr-check-btn');
const wrFeedback = document.getElementById('wr-feedback');
const jlTemplate = document.getElementById('jumbled-letters-template');
const jlMeaningText = document.getElementById('jl-meaning-text');
const jlAnswerDisplay = document.getElementById('jl-answer-display');
const jlLettersContainer = document.getElementById('jl-letters-container');
const jlResetBtn = document.getElementById('jl-reset-btn');
const phTemplate = document.getElementById('phonetic-template');
const phSpeakButton = document.getElementById('ph-speak-button');
const phOptionsContainer = document.getElementById('ph-options-container');
const vtbFillTemplate = document.getElementById('vtb-fill-blank-template');
const vtbFillSentence = document.getElementById('vtb-fill-sentence');
const vtbFillOptions = document.getElementById('vtb-fill-options');
const vtbUnscrambleTemplate = document.getElementById('vtb-unscramble-template');
const vtbUnscrambleAnswer = document.getElementById('vtb-unscramble-answer');
const vtbUnscrambleWords = document.getElementById('vtb-unscramble-words');
const vtbUnscrambleResetBtn = document.getElementById('vtb-unscramble-reset-btn');
const vtbFormQuestionTemplate = document.getElementById('vtb-form-question-template');
const vtbQuestionSentence = document.getElementById('vtb-question-sentence');
const vtbQuestionOptions = document.getElementById('vtb-question-options');

// ==========================================================
// ** الجزء الذي تم حذفه بالخطأ وإعادة إضافته هنا **
// عناصر شاشة النتائج
const resultName = document.getElementById('result-name');
const correctCountSpan = document.getElementById('correct-count');
const incorrectCountSpan = document.getElementById('incorrect-count');
const finalScoreSpan = document.getElementById('final-score');
const saveStatus = document.getElementById('save-status');
const restartBtn = document.getElementById('restart-btn');
// ==========================================================


// --- متغيرات حالة الاختبار ---
let studentName = "";
let selectedTestId = "";
let testData = {};
let currentQuestionIndex = 0;
let correctAnswers = 0;
let incorrectAnswers = 0;
const FEEDBACK_DELAY = 2000;

// --- تهيئة التطبيق ---
document.addEventListener('DOMContentLoaded', loadTests);

// --- دوال جلب البيانات والتهيئة ---
function loadTests() {
    showScreen('loading');
    fetch(`${API_URL}?action=getTests`)
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            displayTests(data.tests);
            showScreen('start');
        })
        .catch(onFailure);
}

function displayTests(tests) {
    testListContainer.innerHTML = '';
    if (!tests || tests.length === 0) {
        testListContainer.innerHTML = '<p>لا توجد اختبارات متاحة حاليًا.</p>';
        return;
    }
    const typeNames = {
        'multiple_choice': 'اختيار من متعدد',
        'writing': 'كتابة',
        'jumbled_letters': 'ترتيب حروف',
        'phonetic_distinction': 'تمييز صوتي',
        'vtb_fill_blank': 'أفعال الكون (إكمال)',
        'vtb_unscramble': 'أفعال الكون (ترتيب)',
        'vtb_form_question': 'أفعال الكون (استفهام)'
    };
    tests.forEach(test => {
        const testButton = document.createElement('button');
        testButton.className = 'test-btn';
        testButton.dataset.testid = test.testId;
        testButton.dataset.testname = test.testName;
        testButton.innerHTML = `
            <span class="test-name">${test.testName}</span>
            <span class="test-details">${test.className} - ${test.questionCount} أسئلة (${typeNames[test.testType] || test.testType})</span>
        `;
        testListContainer.appendChild(testButton);
    });
}

function startQuiz() {
    currentQuestionIndex = 0;
    correctAnswers = 0;
    incorrectAnswers = 0;
    showScreen('quiz');
    displayQuestion();
}

// --- دالة عرض الأسئلة الموجهة ---
function displayQuestion() {
    if (currentQuestionIndex >= testData.questions.length) {
        showResults();
        return;
    }
    document.querySelectorAll('.question-template').forEach(t => t.style.display = 'none');
    progressText.textContent = `السؤال ${currentQuestionIndex + 1} من ${testData.questions.length}`;
    
    switch (testData.testType) {
        case 'writing': displayWritingQuestion(); break;
        case 'jumbled_letters': displayJumbledLettersQuestion(); break;
        case 'phonetic_distinction': displayPhoneticQuestion(); break;
        case 'vtb_fill_blank': displayVtbFillBlank(); break;
        case 'vtb_unscramble': displayVtbUnscramble(); break;
        case 'vtb_form_question': displayVtbFormQuestion(); break;
        case 'multiple_choice': default: displayMultipleChoiceQuestion(); break;
    }
}

// --- دوال عرض الأسئلة ---
function displayMultipleChoiceQuestion() {
    mcTemplate.style.display = 'block';
    const question = testData.questions[currentQuestionIndex];
    mcWordText.textContent = question.word;
    mcOptionsContainer.innerHTML = '';
    let options = [question.meaning];
    const wrongAnswers = shuffleArray(testData.questions.filter(q => q.meaning !== question.meaning)).map(q => q.meaning);
    options.push(...wrongAnswers.slice(0, 3));
    while (options.length < 4) options.push(`خيار خاطئ ${options.length}`);
    shuffleArray(options).forEach(optionText => {
        const button = document.createElement('button');
        button.className = 'option';
        button.textContent = optionText;
        button.onclick = () => checkMultipleChoiceAnswer(button);
        mcOptionsContainer.appendChild(button);
    });
}

function displayWritingQuestion() {
    wrTemplate.style.display = 'block';
    const question = testData.questions[currentQuestionIndex];
    wrMeaningText.textContent = question.meaning;
    wrInput.value = '';
    wrInput.disabled = false;
    wrCheckBtn.disabled = false;
    wrFeedback.textContent = '';
    wrInput.focus();
}

function displayJumbledLettersQuestion() {
    jlTemplate.style.display = 'block';
    const question = testData.questions[currentQuestionIndex];
    jlMeaningText.textContent = question.meaning;
    jlAnswerDisplay.textContent = '';
    jlLettersContainer.innerHTML = '';
    shuffleArray(question.word.toUpperCase().split('')).forEach(letter => {
        const button = document.createElement('button');
        button.textContent = letter;
        button.addEventListener('click', () => {
            jlAnswerDisplay.textContent += button.textContent;
            button.disabled = true;
            if (jlAnswerDisplay.textContent.length === question.word.length) {
                checkJumbledLettersAnswer();
            }
        });
        jlLettersContainer.appendChild(button);
    });
}

function displayPhoneticQuestion() {
    phTemplate.style.display = 'block';
    const question = testData.questions[currentQuestionIndex];
    phOptionsContainer.innerHTML = '';
    shuffleArray(question.options).forEach(optionText => {
        const button = document.createElement('button');
        button.className = 'option';
        button.textContent = optionText;
        button.onclick = () => checkPhoneticAnswer(button);
        phOptionsContainer.appendChild(button);
    });
    phSpeakButton.onclick = () => speakWord(question.wordToSpeak);
    speakWord(question.wordToSpeak);
}

function displayVtbFillBlank() {
    vtbFillTemplate.style.display = 'block';
    const q = testData.questions[currentQuestionIndex];
    vtbFillSentence.innerHTML = `${q.subject} <span style="color: #007bff;">____</span> ${q.complement}.`;
    const options = shuffleArray(['am', 'is', 'are']);
    vtbFillOptions.innerHTML = '';
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'option';
        button.textContent = option;
        button.onclick = () => checkVtbFillBlank(button);
        vtbFillOptions.appendChild(button);
    });
}

function displayVtbUnscramble() {
    vtbUnscrambleTemplate.style.display = 'block';
    const q = testData.questions[currentQuestionIndex];
    vtbUnscrambleAnswer.textContent = '';
    vtbUnscrambleWords.innerHTML = '';
    const words = [q.subject, q.verb, 'not', ...q.complement.split(' ')];
    const shuffledWords = shuffleArray(words);
    shuffledWords.forEach(word => {
        const button = document.createElement('button');
        button.textContent = word;
        button.onclick = () => {
            vtbUnscrambleAnswer.textContent += (vtbUnscrambleAnswer.textContent ? ' ' : '') + word;
            button.disabled = true;
            if (vtbUnscrambleAnswer.textContent.split(' ').length === words.length) {
                checkVtbUnscramble();
            }
        };
        vtbUnscrambleWords.appendChild(button);
    });
}

function displayVtbFormQuestion() {
    vtbFormQuestionTemplate.style.display = 'block';
    const q = testData.questions[currentQuestionIndex];
    vtbQuestionSentence.innerHTML = `<span style="color: #007bff;">____</span> ${q.subject} ${q.complement}?`;
    const wrongVerbs = ['am', 'is', 'are'].filter(v => v !== q.verb);
    const options = shuffleArray([q.verb, q.subject, wrongVerbs[0]]);
    vtbQuestionOptions.innerHTML = '';
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'option';
        button.textContent = option;
        button.onclick = () => checkVtbFormQuestion(button);
        vtbQuestionOptions.appendChild(button);
    });
}

// --- دوال التحقق من الإجابات ---
function checkMultipleChoiceAnswer(selectedButton) {
    const allButtons = mcOptionsContainer.querySelectorAll('button');
    allButtons.forEach(button => button.disabled = true);
    handleFeedback(selectedButton.textContent === testData.questions[currentQuestionIndex].meaning, selectedButton, allButtons, testData.questions[currentQuestionIndex].meaning);
    nextQuestion();
}

function checkWritingAnswer() {
    wrInput.disabled = true;
    wrCheckBtn.disabled = true;
    const isCorrect = wrInput.value.trim().toLowerCase() === testData.questions[currentQuestionIndex].word.toLowerCase();
    if (isCorrect) {
        correctAnswers++;
        wrFeedback.textContent = 'إجابة صحيحة!';
        wrFeedback.style.color = 'green';
    } else {
        incorrectAnswers++;
        wrFeedback.textContent = `إجابة خاطئة. الصحيح هو: ${testData.questions[currentQuestionIndex].word}`;
        wrFeedback.style.color = 'red';
    }
    nextQuestion();
}

function checkJumbledLettersAnswer() {
    const isCorrect = jlAnswerDisplay.textContent.toUpperCase() === testData.questions[currentQuestionIndex].word.toUpperCase();
    if (isCorrect) {
        correctAnswers++;
        jlAnswerDisplay.style.color = 'green';
        jlAnswerDisplay.style.borderColor = 'green';
    } else {
        incorrectAnswers++;
        jlAnswerDisplay.style.color = 'red';
        jlAnswerDisplay.style.borderColor = 'red';
    }
    nextQuestion();
}

function checkPhoneticAnswer(selectedButton) {
    const allButtons = phOptionsContainer.querySelectorAll('button');
    allButtons.forEach(btn => btn.disabled = true);
    handleFeedback(selectedButton.textContent === testData.questions[currentQuestionIndex].wordToSpeak, selectedButton, allButtons, testData.questions[currentQuestionIndex].wordToSpeak);
    nextQuestion();
}

function checkVtbFillBlank(selectedButton) {
    const allButtons = vtbFillOptions.querySelectorAll('button');
    allButtons.forEach(btn => btn.disabled = true);
    const q = testData.questions[currentQuestionIndex];
    const isCorrect = selectedButton.textContent === q.verb;
    handleFeedback(isCorrect, selectedButton, allButtons, q.verb);
    nextQuestion();
}

function checkVtbUnscramble() {
    const q = testData.questions[currentQuestionIndex];
    const correctAnswer = `${q.subject} ${q.verb} not ${q.complement}`;
    const userAnswer = vtbUnscrambleAnswer.textContent;
    if (userAnswer === correctAnswer) {
        correctAnswers++;
        vtbUnscrambleAnswer.style.color = 'green';
        vtbUnscrambleAnswer.style.borderColor = 'green';
    } else {
        incorrectAnswers++;
        vtbUnscrambleAnswer.style.color = 'red';
        vtbUnscrambleAnswer.style.borderColor = 'red';
    }
    nextQuestion();
}

function checkVtbFormQuestion(selectedButton) {
    const allButtons = vtbQuestionOptions.querySelectorAll('button');
    allButtons.forEach(btn => btn.disabled = true);
    const q = testData.questions[currentQuestionIndex];
    const isCorrect = selectedButton.textContent === q.verb;
    handleFeedback(isCorrect, selectedButton, allButtons, q.verb);
    nextQuestion();
}

// --- دوال مساعدة وإدارة الاختبار ---
function handleFeedback(isCorrect, selectedButton, allButtons, correctAnswerText) {
    if (isCorrect) {
        correctAnswers++;
        selectedButton.classList.add('correct');
    } else {
        incorrectAnswers++;
        selectedButton.classList.add('incorrect');
        allButtons.forEach(button => {
            if (button.textContent === correctAnswerText) {
                button.classList.add('correct');
            }
        });
    }
}

function nextQuestion() {
    setTimeout(() => {
        vtbUnscrambleAnswer.style.color = '';
        vtbUnscrambleAnswer.style.borderColor = '';
        jlAnswerDisplay.style.color = '';
        jlAnswerDisplay.style.borderColor = '';
        currentQuestionIndex++;
        displayQuestion();
    }, FEEDBACK_DELAY);
}

function showResults() {
    showScreen('result');
    const totalQuestions = testData.questions.length;
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    resultName.textContent = studentName;
    correctCountSpan.textContent = correctAnswers;
    incorrectCountSpan.textContent = incorrectAnswers;
    finalScoreSpan.textContent = `نتيجتك النهائية هي: ${score}%`;
    saveStatus.textContent = "جاري حفظ نتيجتك...";
    const resultData = { name: studentName, correct: correctAnswers, incorrect: incorrectAnswers, result: `${score}%`, testId: selectedTestId };
    const requestPayload = { action: 'saveResult', data: resultData };
    fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(requestPayload) })
    .then(() => { saveStatus.textContent = "تم حفظ نتيجتك بنجاح!"; })
    .catch(err => {
        console.error("Save error:", err);
        saveStatus.textContent = "فشل في إرسال طلب الحفظ.";
    });
}

// --- ربط الأحداث ---
testListContainer.addEventListener('click', (event) => {
    const testButton = event.target.closest('.test-btn');
    if (testButton) {
        selectedTestId = testButton.dataset.testid;
        selectedTestName.textContent = testButton.dataset.testname;
        testListContainer.style.display = 'none';
        nameInputContainer.style.display = 'block';
        studentNameInput.focus();
    }
});

startBtn.addEventListener('click', () => {
    studentName = studentNameInput.value.trim();
    if (studentName === "") {
        alert("الرجاء إدخال اسمك.");
        return;
    }
    showScreen('loading');
    fetch(`${API_URL}?action=getTestQuestions&testId=${selectedTestId}`)
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            testData = data;
            startQuiz();
        })
        .catch(onFailure);
});

restartBtn.addEventListener('click', () => {
    nameInputContainer.style.display = 'none';
    testListContainer.style.display = 'block';
    loadTests();
});

mcSpeakButton.addEventListener('click', () => speakWord(mcWordText.textContent));
wrCheckBtn.addEventListener('click', checkWritingAnswer);
wrInput.addEventListener('keyup', (event) => { if (event.key === 'Enter') checkWritingAnswer(); });
jlResetBtn.addEventListener('click', () => { displayJumbledLettersQuestion(); });
vtbUnscrambleResetBtn.addEventListener('click', () => { displayVtbUnscramble(); });

// --- دوال مساعدة نهائية ---
function showScreen(screenName) {
    allScreens.forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });
    const screenToShow = document.getElementById(`${screenName}-screen`);
    if (screenToShow) {
        screenToShow.style.display = 'block';
        screenToShow.classList.add('active');
    } else if (screenName === 'loading') {
        loadingIndicator.style.display = 'block';
    }
}

function onFailure(error) {
    console.error('An error occurred:', error);
    alert(`حدث خطأ: ${error.message}\nالرجاء المحاولة مرة أخرى.`);
    nameInputContainer.style.display = 'none';
    testListContainer.style.display = 'block';
    showScreen('start');
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function speakWord(word) {
    if ('speechSynthesis' in window && word) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    } else {
        console.warn("Speech Synthesis not supported or no word to speak.");
    }
}
