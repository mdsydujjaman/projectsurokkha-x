const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(__dirname));
app.use('/backup', express.static(path.join(__dirname, 'backup')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/backup', (req, res) => res.sendFile(path.join(__dirname, 'backup/index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Live on ${PORT}`));
