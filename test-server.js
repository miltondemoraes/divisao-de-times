const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

console.log('🎮 Os Sacanas Hub Server iniciando...');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Servir a página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Teste básico
app.get('/test', (req, res) => {
    res.json({ message: 'Servidor funcionando!', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`🎮 Os Sacanas Hub Server rodando em http://localhost:${PORT}`);
    console.log(`👤 Admin: mutucapin/jms270804`);
    console.log(`👥 Acesse: http://localhost:${PORT}`);
});
