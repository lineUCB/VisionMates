const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { transcribeAudio } = require('./whisper');

const app = express();
const port = 3000;
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.get('/',(req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/findaplacetogo.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'findaplacetogo.html'));
});

app.get('/futurevoicememo.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'futurevoicememo.html'));
});

app.get('/findaplacetogo2.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'findaplacetogo2.html'));
});

app.get('/livereccommendation.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'livereccommendation.html'));
});

app.get('/livereccommendation2.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'livereccommendation.html'));
});

app.get('/mainmenu.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'newMenu.html'));
});

app.get('/viewallmemos.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'viewallmemos.html'));
});


app.post('/upload', upload.single('audio'), async (req, res) => {
    const audioPath = req.file.path;
    const location = JSON.parse(req.body.location);
    const time = Date.now();

    try {
        const transcription = await transcribeAudio(audioPath);
        fs.unlinkSync(audioPath); 
        const memo = { transcription, time, location };

        res.json(memo);
    } catch (error) {
        res.status(500).json({ error: 'Transcription failed' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
