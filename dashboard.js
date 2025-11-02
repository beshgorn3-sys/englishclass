// =================================================
// dashboard.js - نسخة معدلة لدعم أنواع الأسئلة
// =================================================

// !! مهم جداً: تأكد من أن هذا الرابط هو رابط الـ API الصحيح والفعال !!
const API_URL = "https://script.google.com/macros/s/AKfycbwERHQjRMJFED_ZvyaRneg9V__NGFyi7s1h5PuB2_2JyuLpcd2AJZ4-D6zP3dMO0gt9_Q/exec";

// --- إشارة إلى عناصر الصفحة (DOM Elements ) ---
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loadingIndicator = document.getElementById('loading-indicator');
const passwordInput = document.getElementById('admin-password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const testNameInput = document.getElementById('test-name');
const classNameSelect = document.getElementById('class-name');
const testTypeSelect = document.getElementById('test-type'); // <-- **الإشارة إلى العنصر الجديد**
const questionCountInput = document.getElementById('question-count');
const createTestBtn = document.getElementById('create-test-btn');
const createStatus = document.getElementById('create-status');
const dashboardTestList = document.getElementById('dashboard-test-list');
const refreshTestsBtn = document.getElementById('refresh-tests-btn');

let adminPassword = '';

// --- ربط الأحداث (Event Listeners) ---

loginBtn.addEventListener('click', () => {
    adminPassword = passwordInput.value;
    if (!adminPassword) {
        loginError.textContent = "الرجاء إدخال كلمة المرور.";
        loginError.style.display = 'block';
        return;
    }
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'block';
    fetchExistingTests();
});

// **تعديل**: عند الضغط على زر إنشاء الاختبار
createTestBtn.addEventListener('click', () => {
    const testData = {
        testName: testNameInput.value.trim(),
        className: classNameSelect.value,
        testType: testTypeSelect.value, // <-- **قراءة القيمة من القائمة المنسدلة الجديدة**
        questionCount: parseInt(questionCountInput.value, 10)
    };

    if (!testData.testName || testData.questionCount < 1) {
        alert("الرجاء التأكد من إدخال اسم للاختبار وأن عدد الأسئلة 1 على الأقل.");
        return;
    }

    const requestPayload = {
        action: 'createTest',
        password: adminPassword,
        data: testData // testData الآن تحتوي على testType
    };

    createStatus.textContent = "جاري إنشاء الاختبار...";
    createStatus.style.color = 'orange';
    createTestBtn.disabled = true;

    fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(requestPayload)
    })
    .then(() => {
        createStatus.textContent = "تم إرسال طلب الإنشاء بنجاح! قم بتحديث القائمة لرؤية الاختبار الجديد.";
        createStatus.style.color = 'green';
        testNameInput.value = '';
    })
    .catch(error => {
        console.error('Create Test Error:', error);
        createStatus.textContent = "حدث خطأ أثناء إرسال الطلب.";
        createStatus.style.color = 'red';
    })
    .finally(() => {
        createTestBtn.disabled = false;
    });
});

refreshTestsBtn.addEventListener('click', fetchExistingTests);

// --- الدوال الرئيسية ---

/**
 * **تعديل**: دالة جلب وعرض قائمة الاختبارات الموجودة
 */
function fetchExistingTests() {
    dashboardTestList.innerHTML = '<p>جاري تحميل الاختبارات...</p>';
    
    fetch(`${API_URL}?action=getTests`)
        .then(res => res.ok ? res.json() : Promise.reject(res.status))
        .then(data => {
            if (data.error) throw new Error(data.error);
            
            dashboardTestList.innerHTML = '';
            if (!data.tests || data.tests.length === 0) {
                dashboardTestList.innerHTML = '<p>لم يتم إنشاء أي اختبارات بعد.</p>';
                return;
            }

            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            
            // **تعديل**: إضافة عمود "نوع الاختبار" إلى الجدول
            table.innerHTML = `
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">اسم الاختبار</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">الصف</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">نوع الاختبار</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">الأسئلة</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            
            const tbody = table.querySelector('tbody');
            const typeNames = {
                'multiple_choice': 'اختيار من متعدد',
                'writing': 'كتابة',
                'jumbled_letters': 'ترتيب حروف'
            };

            data.tests.forEach(test => {
                const row = tbody.insertRow();
                // **تعديل**: إضافة خلية جديدة لعرض نوع الاختبار
                row.innerHTML = `
                    <td style="padding: 8px; border: 1px solid #ddd;">${test.testName}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${test.className}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${typeNames[test.testType] || 'غير معروف'}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${test.questionCount}</td>
                `;
            });

            dashboardTestList.appendChild(table);
        })
        .catch(error => {
            console.error('Fetch tests error:', error);
            dashboardTestList.innerHTML = `<p style="color: red;">فشل في تحميل قائمة الاختبارات: ${error.message}</p>`;
        });
}
