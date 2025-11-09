// =================================================
// script.js - النسخة الكاملة والنهائية
// مسؤول عن منطق اختبار الطالب لجميع أنواع الأسئلة
// =================================================

// !! مهم جداً: تأكد من أن هذا الرابط هو رابط الـ API الصحيح والفعال !!
const API_URL = "https://script.google.com/macros/s/AKfycbyA8pyKh-U9ZGZiX6nf18kASDmcwmuIvliJew-cRHPq6JKh8LlZyaCVCb-_46653OdHQw/exec";

// --- إشارة إلى عناصر الصفحة (DOM Elements  ) ---
// شاشات رئيسية
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const loadingIndicator = document.getElementById('loading-indicator');

// عناصر شاشة البداية
const testListContainer = document.getElementById('test-list-container');
const nameInputContainer = document.getElementById('name-input-container');
const selectedTestName = document.getElementById('selected-test-name');
const studentNameInput = document.getElementById('student-name');
const startBtn = document.getElementById('start-btn');

// عناصر شاشة الاختبار العامة
const progressText = document.getElementById('progress-text');

// عناصر قالب الاختيار من متعدد
const mcTemplate = document.getElementById('multiple-choice-template');
const mcWordText = document.getElementById('mc-word-text');
const mcSpeakButton = document.getElementById('mc-speak-button');
const mcOptionsContainer = document.getElementById('mc-options-container');

// عناصر قالب الكتابة
const wrTemplate = document.getElementById('writing-template');
const wrMeaningText = document.getElementById('wr-meaning-text');
const wrInput = document.getElementById('wr-input');
const wrCheckBtn = document.getElementById('wr-check-btn');
const wrFeedback = document.getElementById('wr-feedback');

// عناصر قالب الحروف المبعثرة
const jlTemplate = document.getElementById('jumbled-letters-template');
const jlMeaningText = document.getElementById('jl-meaning-text');
const jlAnswerDisplay = document.getElementById('jl-answer-display');
const jlLettersContainer = document.getElementById('jl-letters-container');
const jlResetBtn = document.getElementById('jl-reset-btn');

// عناصر قالب التمييز الصوتي
const phTemplate = document.getElementById('phonetic-template');
const phSpeakButton = document.getElementById('ph-speak-button');
const phOptionsContainer = document.getElementById('ph-options-container');

// عناصر شاشة النتائج
const resultName = document.getElementById('result-name');
const correctCountSpan = document.getElementById('correct-count');
const incorrectCountSpan = document.getElementById('incorrect-count');
const finalScoreSpan = document.getElementById('final-score');
const saveStatus = document.getElementById('save-status');
const restartBtn = document.getElementById('restart-btn');

// --- متغيرات حالة الاختبار ---
let studentName = "";
let selectedTestId = "";
let testData = {}; // سيحتوي على الأسئلة ونوع الاختبار
let currentQuestionIndex = 0;
let correctAnswers = 0;
let incorrectAnswers = 0;
const FEEDBACK_DELAY = 2000; // مدة الانتظار قبل الانتقال للسؤال التالي

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
        'phonetic_distinction': 'تمييز صوتي'
    };
    tests.forEach(test => {
        const testButton = document.createElement('button');
        testButton.className = 'test-btn';
        testButton.dataset.testid = test.testId;
        testButton.dataset.testname = test.testName;
        testButton.innerHTML = `
            <span class="test-name">${test.testName}</span>
            <span class="test-details">${test.className} - ${test.questionCount} أسئلة (${typeNames[test.testType] || 'غير معروف'})</span>
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

// --- دوال عرض الأسئلة (النظام الموجه) ---

function displayQuestion() {
    if (currentQuestionIndex >= testData.questions.length) {
        showResults();
        return;
    }
    // إخفاء كل القوالب أولاً
    document.querySelectorAll('.question-template').forEach(t => t.style.display = 'none');
    progressText.textContent = `السؤال ${currentQuestionIndex + 1} من ${testData.questions.length}`;
    
    // توجيه السؤال إلى الدالة المناسبة بناءً على نوع الاختبار
    switch (testData.testType) {
        case 'writing':
            displayWritingQuestion();
            break;
        case 'jumbled_letters':
            displayJumbledLettersQuestion();
            break;
        case 'phonetic_distinction':
            displayPhoneticQuestion();
            break;
        case 'multiple_choice':
        default:
            displayMultipleChoiceQuestion();
            break;
    }
}

function displayMultipleChoiceQuestion() {
    mcTemplate.style.display = 'block';
    const question = testData.questions[currentQuestionIndex];
    mcWordText.textContent = question.word;
    mcOptionsContainer.innerHTML = '';

    const correctAnswer = question.meaning;
    let options = [correctAnswer];
    const wrongAnswers = testData.questions.filter(q => q.meaning !== correctAnswer).map(q => q.meaning);
    const shuffledWrong = shuffleArray(wrongAnswers);
    for (let i = 0; i < 3 && i < shuffledWrong.length; i++) {
        options.push(shuffledWrong[i]);
    }
    while (options.length < 4) options.push(`خيار خاطئ ${options.length}`);
    
    const shuffledOptions = shuffleArray(options);
    shuffledOptions.forEach(optionText => {
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

    const letters = shuffleArray(question.word.toUpperCase().split(''));
    letters.forEach(letter => {
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
    
    const shuffledOptions = shuffleArray(question.options);
    shuffledOptions.forEach(optionText => {
        const button = document.createElement('button');
        button.className = 'option';
        button.textContent = optionText;
        button.onclick = () => checkPhoneticAnswer(button);
        phOptionsContainer.appendChild(button);
    });

    phSpeakButton.onclick = () => speakWord(question.wordToSpeak);
    speakWord(question.wordToSpeak);
}

// --- دوال التحقق من الإجابات ---

function checkMultipleChoiceAnswer(selectedButton) {
    const allButtons = mcOptionsContainer.querySelectorAll('button');
    allButtons.forEach(button => button.disabled = true);
    const isCorrect = selectedButton.textContent === testData.questions[currentQuestionIndex].meaning;
    
    handleFeedback(isCorrect, selectedButton, allButtons, testData.questions[currentQuestionIndex].meaning);
    nextQuestion();
}

function checkWritingAnswer() {
    wrInput.disabled = true;
    wrCheckBtn.disabled = true;
    const userAnswer = wrInput.value.trim().toLowerCase();
    const correctAnswer = testData.questions[currentQuestionIndex].word.toLowerCase();
    
    if (userAnswer === correctAnswer) {
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
    const userAnswer = jlAnswerDisplay.textContent;
    const correctAnswer = testData.questions[currentQuestionIndex].word.toUpperCase();
    
    if (userAnswer === correctAnswer) {
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
    const isCorrect = selectedButton.textContent === testData.questions[currentQuestionIndex].wordToSpeak;

    handleFeedback(isCorrect, selectedButton, allButtons, testData.questions[currentQuestionIndex].wordToSpeak);
    nextQuestion();
}

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
        jlAnswerDisplay.style.color = '';
        jlAnswerDisplay.style.borderColor = '';
        currentQuestionIndex++;
        displayQuestion();
    }, FEEDBACK_DELAY);
}

// --- دوال إدارة الاختبار والنتائج ---

function showResults() {
    showScreen('result');
    const totalQuestions = testData.questions.length;
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    resultName.textContent = studentName;
    correctCountSpan.textContent = correctAnswers;
    incorrectCountSpan.textContent = incorrectAnswers;
    finalScoreSpan.textContent = `نتيجتك النهائية هي: ${score}%`;
    saveStatus.textContent = "جاري حفظ نتيجتك...";
    
    const resultData = {
        name: studentName,
        correct: correctAnswers,
        incorrect: incorrectAnswers,
        result: `${score}%`,
        testId: selectedTestId
    };
    const requestPayload = { action: 'saveResult', data: resultData };
    fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(requestPayload)
    })
    .then(() => { saveStatus.textContent = "تم حفظ نتيجتك بنجاح!"; })
    .catch(err => {
        console.error("Save error:", err);
        saveStatus.textContent = "فشل في إرسال طلب الحفظ.";
    });
}

// --- ربط الأحداث (Event Listeners) ---

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

// --- دوال مساعدة ---

function showScreen(screenName) {
    document.querySelectorAll('#start-screen, #quiz-screen, #result-screen').forEach(s => s.classList.remove('active'));
    loadingIndicator.style.display = 'none';
    
    const screenElement = document.getElementById(`${screenName}-screen`);
    if (screenElement) {
        if (screenName === 'loading') {
            loadingIndicator.style.display = 'block';
        } else {
            screenElement.classList.add('active');
        }
    }
}

function onFailure(error) {
    alert(`حدث خطأ: ${error.message}`);
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
