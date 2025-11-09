// =================================================
// dashboard.js - النسخة الكاملة والنهائية
// مسؤول عن منطق لوحة تحكم المعلم
// =================================================

// !! مهم جداً: تأكد من أن هذا الرابط هو رابط الـ API الصحيح والفعال !!
const API_URL = "https://script.google.com/macros/s/AKfycbyA8pyKh-U9ZGZiX6nf18kASDmcwmuIvliJew-cRHPq6JKh8LlZyaCVCb-_46653OdHQw/exec";

// --- إشارة إلى عناصر الصفحة (DOM Elements  ) ---
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loadingIndicator = document.getElementById('loading-indicator');
const passwordInput = document.getElementById('admin-password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const testNameInput = document.getElementById('test-name');
const classNameSelect = document.getElementById('class-name');
const testTypeSelect = document.getElementById('test-type');
const questionCountInput = document.getElementById('question-count');
const createTestBtn = document.getElementById('create-test-btn');
const createStatus = document.getElementById('create-status');
const dashboardTestList = document.getElementById('dashboard-test-list');
const refreshTestsBtn = document.getElementById('refresh-tests-btn');

let adminPassword = '';

// --- ربط الأحداث (Event Listeners) ---

// حدث تسجيل الدخول
loginBtn.addEventListener('click', () => {
    adminPassword = passwordInput.value;
    if (!adminPassword) {
        loginError.textContent = "الرجاء إدخال كلمة المرور.";
        loginError.style.display = 'block';
        return;
    }
    loginError.style.display = 'none';
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'block';
    fetchExistingTests();
});

// حدث الضغط على زر إنشاء الاختبار
createTestBtn.addEventListener('click', () => {
    const testData = {
        testName: testNameInput.value.trim(),
        className: classNameSelect.value,
        testType: testTypeSelect.value, // قراءة القيمة من القائمة المنسدلة
        questionCount: parseInt(questionCountInput.value, 10)
    };

    if (!testData.testName || testData.questionCount < 1) {
        alert("الرجاء التأكد من إدخال اسم للاختبار وأن عدد الأسئلة 1 على الأقل.");
        return;
    }

    // تجهيز الطلب لإرساله إلى API
    const requestPayload = {
        action: 'createTest',
        password: adminPassword,
        data: testData
    };

    createStatus.textContent = "جاري إنشاء الاختبار...";
    createStatus.style.color = 'orange';
    createTestBtn.disabled = true;

    // إرسال الطلب
    fetch(API_URL, {
        method: 'POST',
        // 'no-cors' يستخدم عادة مع Google Apps Script لتجنب مشاكل CORS
        // لكنه يمنع قراءة الرد مباشرة، لذا نعتمد على أن الطلب تم إرساله
        mode: 'no-cors', 
        body: JSON.stringify(requestPayload)
    })
    .then(() => {
        createStatus.textContent = "تم إرسال طلب الإنشاء بنجاح! قم بتحديث القائمة لرؤية الاختبار الجديد.";
        createStatus.style.color = 'green';
        testNameInput.value = ''; // تفريغ حقل الاسم بعد النجاح
    })
    .catch(error => {
        console.error('Create Test Error:', error);
        createStatus.textContent = "حدث خطأ أثناء إرسال الطلب.";
        createStatus.style.color = 'red';
    })
    .finally(() => {
        createTestBtn.disabled = false; // إعادة تفعيل الزر
    });
});

// حدث الضغط على زر تحديث قائمة الاختبارات
refreshTestsBtn.addEventListener('click', fetchExistingTests);

// --- الدوال الرئيسية ---

/**
 * دالة جلب وعرض قائمة الاختبارات الموجودة
 * تقوم بإنشاء جدول لعرض تفاصيل كل اختبار
 */
function fetchExistingTests() {
    dashboardTestList.innerHTML = '<p>جاري تحميل الاختبارات...</p>';
    
    fetch(`${API_URL}?action=getTests`)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (data.error) throw new Error(data.error);
            
            dashboardTestList.innerHTML = '';
            if (!data.tests || data.tests.length === 0) {
                dashboardTestList.innerHTML = '<p>لم يتم إنشاء أي اختبارات بعد.</p>';
                return;
            }

            const table = document.createElement('table');
            
            // إضافة عناوين الجدول
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>اسم الاختبار</th>
                        <th>الصف</th>
                        <th>نوع الاختبار</th>
                        <th>عدد الأسئلة</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            
            const tbody = table.querySelector('tbody');
            
            // قاموس لترجمة أنواع الاختبارات إلى نصوص عربية واضحة
            const typeNames = {
                'multiple_choice': 'اختيار من متعدد',
                'writing': 'كتابة',
                'jumbled_letters': 'ترتيب حروف',
                'phonetic_distinction': 'تمييز صوتي'
            };

            // ملء الجدول ببيانات الاختبارات
            data.tests.forEach(test => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${test.testName}</td>
                    <td>${test.className}</td>
                    <td>${typeNames[test.testType] || 'غير معروف'}</td>
                    <td>${test.questionCount}</td>
                `;
            });

            dashboardTestList.appendChild(table);
        })
        .catch(error => {
            console.error('Fetch tests error:', error);
            dashboardTestList.innerHTML = `<p style="color: red;">فشل في تحميل قائمة الاختبارات: ${error.message}</p>`;
        });
}
