const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

console.log('🚀 Iniciando Soso Zone Server...');

const app = express();
const PORT = 3000;
const USERS_FILE = path.join(__dirname, 'data', 'users.txt');
const GAMES_FILE = path.join(__dirname, 'data', 'games.txt');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

console.log('✅ Middlewares configurados');

// Função para ler usuários
function readUsers() {
    try {
        if (!fs.existsSync(USERS_FILE)) {
            console.log('📁 Arquivo users.txt não existe, criando...');
            return [];
        }
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        const users = data.trim() ? JSON.parse(data) : [];
        console.log(`👥 ${users.length} usuários carregados`);
        return users;
    } catch (error) {
        console.error('❌ Erro ao ler usuários:', error.message);
        return [];
    }
}

// Função para salvar usuários
function writeUsers(users) {
    try {
        const dataDir = path.dirname(USERS_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        console.log(`💾 ${users.length} usuários salvos`);
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar usuários:', error.message);
        return false;
    }
}

// Função para ler jogos
function readGames() {
    try {
        if (!fs.existsSync(GAMES_FILE)) {
            console.log('📁 Arquivo games.txt não existe, criando...');
            const defaultGames = {
                valorant: { 
                    players: [], 
                    votes: {}, 
                    votingActive: false, 
                    teams: [],
                    maps: {
                        available: [
                            'Bind', 'Haven', 'Split', 'Ascent', 'Icebox', 
                            'Breeze', 'Fracture', 'Pearl', 'Lotus', 
                            'Sunset', 'Abyss', 'Corrode'
                        ],
                        votes: {}, // { username: ['map1', 'map2', 'map3', 'map4', 'map5'] }
                        votingActive: false,
                        selected: [] // Top 5 mapas escolhidos
                    }
                },
                lol: { 
                    players: [], 
                    votes: {}, 
                    votingActive: false, 
                    teams: [] 
                }
            };
            writeGames(defaultGames);
            return defaultGames;
        }
        const data = fs.readFileSync(GAMES_FILE, 'utf8');
        const games = data.trim() ? JSON.parse(data) : {
            valorant: { 
                players: [], 
                votes: {}, 
                votingActive: false, 
                teams: [],
                maps: {
                    available: [
                        'Bind', 'Haven', 'Split', 'Ascent', 'Icebox', 
                        'Breeze', 'Fracture', 'Pearl', 'Lotus', 
                        'Sunset', 'Abyss', 'Corrode'
                    ],
                    votes: {},
                    votingActive: false,
                    selected: []
                }
            },
            lol: { 
                players: [], 
                votes: {}, 
                votingActive: false, 
                teams: [] 
            }
        };
        console.log(`🎮 Dados dos jogos carregados`);
        return games;
    } catch (error) {
        console.error('❌ Erro ao ler jogos:', error.message);
        return {
            valorant: { players: [], votes: {}, votingActive: false, teams: [] },
            lol: { players: [], votes: {}, votingActive: false, teams: [] }
        };
    }
}

// Função para salvar jogos
function writeGames(games) {
    try {
        const dataDir = path.dirname(GAMES_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2));
        console.log(`💾 Dados dos jogos salvos`);
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar jogos:', error.message);
        return false;
    }
}

// GET - Obter dados dos jogos
app.get('/api/games', (req, res) => {
    try {
        const games = readGames();
        res.json(games);
    } catch (error) {
        console.error('❌ Erro ao obter jogos:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// GET - Obter lista de usuários
app.get('/api/users', (req, res) => {
    try {
        const users = readUsers();
        res.json(users);
    } catch (error) {
        console.error('❌ Erro ao obter usuários:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// POST - Adicionar player
app.post('/api/games/:game/players', (req, res) => {
    const { game } = req.params;
    const { name } = req.body;
    
    if (!['valorant', 'lol'].includes(game)) {
        return res.status(400).json({ success: false, message: 'Modalidade inválida' });
    }
    
    if (!name || name.trim() === '') {
        return res.status(400).json({ success: false, message: 'Nome do player é obrigatório' });
    }
    
    const games = readGames();
    
    // Verificar se já tem 10 players
    if (games[game].players.length >= 10) {
        return res.status(400).json({ success: false, message: 'Máximo de 10 players por modalidade' });
    }
    
    // Verificar se player já existe
    if (games[game].players.find(p => p.name.toLowerCase() === name.toLowerCase())) {
        return res.status(409).json({ success: false, message: 'Player já cadastrado nesta modalidade' });
    }
    
    const newPlayer = {
        id: Date.now(),
        name: name.trim(),
        addedAt: new Date().toISOString(),
        votes: {}
    };
    
    games[game].players.push(newPlayer);
    
    if (writeGames(games)) {
        res.json({ success: true, message: 'Player adicionado com sucesso!', player: newPlayer });
        console.log(`🎮 Player ${name} adicionado ao ${game.toUpperCase()}`);
    } else {
        res.status(500).json({ success: false, message: 'Erro ao salvar player' });
    }
});

// DELETE - Remover player
app.delete('/api/games/:game/players/:playerIndex', (req, res) => {
    const { game, playerIndex } = req.params;
    
    if (!['valorant', 'lol'].includes(game)) {
        return res.status(400).json({ success: false, message: 'Modalidade inválida' });
    }
    
    const games = readGames();
    const index = parseInt(playerIndex);
    
    if (isNaN(index) || index < 0 || index >= games[game].players.length) {
        return res.status(400).json({ success: false, message: 'Índice de player inválido' });
    }
    
    const removedPlayer = games[game].players.splice(index, 1)[0];
    
    if (writeGames(games)) {
        res.json({ success: true, message: 'Player removido com sucesso!', player: removedPlayer });
        console.log(`🗑️ Player ${removedPlayer.name} removido do ${game.toUpperCase()}`);
    } else {
        res.status(500).json({ success: false, message: 'Erro ao remover player' });
    }
});

// POST - Iniciar votação
app.post('/api/games/:game/voting/start', (req, res) => {
    const { game } = req.params;
    
    if (!['valorant', 'lol'].includes(game)) {
        return res.status(400).json({ success: false, message: 'Modalidade inválida' });
    }
    
    const games = readGames();
    
    if (games[game].players.length !== 10) {
        return res.status(400).json({ success: false, message: 'É necessário ter exatamente 10 players para iniciar a votação' });
    }
    
    games[game].votingActive = true;
    games[game].votes = {};
    
    if (writeGames(games)) {
        res.json({ success: true, message: 'Votação iniciada com sucesso!' });
        console.log(`🗳️ Votação iniciada para ${game.toUpperCase()}`);
    } else {
        res.status(500).json({ success: false, message: 'Erro ao iniciar votação' });
    }
});

// POST - Encerrar votação
app.post('/api/games/:game/voting/end', (req, res) => {
    const { game } = req.params;
    
    if (!['valorant', 'lol'].includes(game)) {
        return res.status(400).json({ success: false, message: 'Modalidade inválida' });
    }
    
    const games = readGames();
    
    if (!games[game].votingActive) {
        return res.status(400).json({ success: false, message: 'Não há votação ativa para esta modalidade' });
    }
    
    // Calcular médias e dividir times
    const players = games[game].players.map(player => {
        const votes = Object.values(games[game].votes).map(userVotes => userVotes[player.name]).filter(vote => vote !== undefined);
        const average = votes.length > 0 ? votes.reduce((sum, vote) => sum + vote, 0) / votes.length : 5;
        return { ...player, score: average };
    });
    
    // Ordenar por score e dividir em times
    players.sort((a, b) => b.score - a.score);
    
    const teams = [
        { players: [], averageScore: 0 },
        { players: [], averageScore: 0 }
    ];
    
    // Distribuir players alternadamente
    players.forEach((player, index) => {
        const teamIndex = index % 2;
        teams[teamIndex].players.push(player);
    });
    
    // Calcular médias dos times
    teams.forEach(team => {
        team.averageScore = team.players.reduce((sum, player) => sum + player.score, 0) / team.players.length;
    });
    
    games[game].votingActive = false;
    games[game].teams = teams;
    
    if (writeGames(games)) {
        res.json({ success: true, message: 'Votação encerrada e times calculados!', teams });
        console.log(`🏆 Votação encerrada para ${game.toUpperCase()}, times calculados`);
    } else {
        res.status(500).json({ success: false, message: 'Erro ao encerrar votação' });
    }
});

// POST - Registrar voto
app.post('/api/games/:game/vote', (req, res) => {
    const { game } = req.params;
    const { username, votes } = req.body;
    
    if (!['valorant', 'lol'].includes(game)) {
        return res.status(400).json({ success: false, message: 'Modalidade inválida' });
    }
    
    const games = readGames();
    
    if (!games[game].votingActive) {
        return res.status(400).json({ success: false, message: 'Votação não está ativa para esta modalidade' });
    }
    
    // Permitir atualização de voto - remover verificação que impedia alteração
    const isNewVote = !games[game].votes[username];
    games[game].votes[username] = votes;
    
    if (writeGames(games)) {
        const message = isNewVote ? 'Voto registrado com sucesso!' : 'Voto atualizado com sucesso!';
        res.json({ success: true, message });
        console.log(`🗳️ Voto ${isNewVote ? 'registrado' : 'atualizado'} de ${username} para ${game.toUpperCase()}`);
    } else {
        res.status(500).json({ success: false, message: 'Erro ao registrar voto' });
    }
});

// ===== ENDPOINTS PARA VOTAÇÃO DE MAPAS =====

// POST - Iniciar votação de mapas do Valorant
app.post('/api/valorant/maps/voting/start', (req, res) => {
    try {
        const games = readGames();
        
        // Verificar se há exatamente 10 players
        if (!games.valorant.players || games.valorant.players.length !== 10) {
            return res.status(400).json({ success: false, message: 'É necessário ter exatamente 10 players para iniciar a votação de mapas' });
        }
        
        // Inicializar votação de mapas
        if (!games.valorant.maps) {
            games.valorant.maps = {
                available: [
                    'Bind', 'Haven', 'Split', 'Ascent', 'Icebox', 
                    'Breeze', 'Fracture', 'Pearl', 'Lotus', 
                    'Sunset', 'Abyss', 'Corrode'
                ],
                votes: {},
                votingActive: false,
                selected: []
            };
        }
        
        games.valorant.maps.votingActive = true;
        games.valorant.maps.votes = {};
        games.valorant.maps.selected = [];
        
        if (writeGames(games)) {
            res.json({ success: true, message: 'Votação de mapas iniciada com sucesso!' });
            console.log(`🗺️ Votação de mapas do Valorant iniciada`);
        } else {
            res.status(500).json({ success: false, message: 'Erro ao iniciar votação de mapas' });
        }
    } catch (error) {
        console.error('❌ Erro ao iniciar votação de mapas:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// POST - Votar em mapas
app.post('/api/valorant/maps/vote', (req, res) => {
    try {
        const { username, selectedMaps } = req.body;
        
        if (!username || !selectedMaps || !Array.isArray(selectedMaps) || selectedMaps.length !== 5) {
            return res.status(400).json({ success: false, message: 'É necessário selecionar exatamente 5 mapas' });
        }
        
        const games = readGames();
        
        // Verificar se votação está ativa
        if (!games.valorant.maps || !games.valorant.maps.votingActive) {
            return res.status(400).json({ success: false, message: 'Votação de mapas não está ativa' });
        }
        
        // Verificar se usuário já votou
        if (games.valorant.maps.votes[username]) {
            return res.status(400).json({ success: false, message: 'Você já votou nos mapas' });
        }
        
        // Verificar se todos os mapas são válidos
        const validMaps = games.valorant.maps.available;
        for (const map of selectedMaps) {
            if (!validMaps.includes(map)) {
                return res.status(400).json({ success: false, message: `Mapa inválido: ${map}` });
            }
        }
        
        // Registrar voto
        games.valorant.maps.votes[username] = selectedMaps;
        
        if (writeGames(games)) {
            res.json({ success: true, message: 'Voto em mapas registrado com sucesso!' });
            console.log(`🗺️ Voto em mapas registrado de ${username}`);
        } else {
            res.status(500).json({ success: false, message: 'Erro ao registrar voto em mapas' });
        }
    } catch (error) {
        console.error('❌ Erro ao votar em mapas:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// POST - Encerrar votação de mapas e calcular os 5 mais votados
app.post('/api/valorant/maps/voting/end', (req, res) => {
    try {
        const games = readGames();
        
        if (!games.valorant.maps || !games.valorant.maps.votingActive) {
            return res.status(400).json({ success: false, message: 'Não há votação de mapas ativa' });
        }
        
        // Contar votos para cada mapa
        const mapVotes = {};
        games.valorant.maps.available.forEach(map => {
            mapVotes[map] = 0;
        });
        
        // Processar votos
        Object.values(games.valorant.maps.votes).forEach(userMaps => {
            userMaps.forEach(map => {
                if (mapVotes[map] !== undefined) {
                    mapVotes[map]++;
                }
            });
        });
        
        // Ordenar mapas por número de votos (decrescente)
        const sortedMaps = Object.entries(mapVotes)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5) // Pegar apenas os 5 primeiros
            .map(([map, votes]) => ({ name: map, votes }));
        
        // Salvar resultados
        games.valorant.maps.votingActive = false;
        games.valorant.maps.selected = sortedMaps;
        
        if (writeGames(games)) {
            res.json({ 
                success: true, 
                message: 'Votação de mapas encerrada!', 
                selectedMaps: sortedMaps 
            });
            console.log(`🏆 Votação de mapas encerrada. Mapas selecionados:`, sortedMaps.map(m => m.name).join(', '));
        } else {
            res.status(500).json({ success: false, message: 'Erro ao encerrar votação de mapas' });
        }
    } catch (error) {
        console.error('❌ Erro ao encerrar votação de mapas:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

console.log('🔧 Configurando servidor...');

// Inicializar usuários padrão
function initializeUsers() {
    console.log('🔧 Inicializando usuários...');
    const users = readUsers();
    
    if (users.length === 0) {
        const defaultUsers = [
            {
                id: 1,
                username: 'mutucapin',
                email: 'admin@sososzone.com',
                password: 'jms270804',
                role: 'admin',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                username: 'player1',
                email: 'player1@sososzone.com',
                password: '123456',
                role: 'votante',
                createdAt: new Date().toISOString()
            }
        ];
        
        if (writeUsers(defaultUsers)) {
            console.log('✅ Usuários padrão criados');
        }
    } else {
        console.log('✅ Usuários já existem');
    }
}

// === ROTAS ===

// Página inicial
app.get('/', (req, res) => {
    console.log('🌐 Servindo página inicial');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    console.log(`🔐 Tentativa de login: ${username}`);
    
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Username e password são obrigatórios' 
        });
    }
    
    const users = readUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        const { password: _, ...userWithoutPassword } = user;
        console.log(`✅ Login bem-sucedido: ${username} (${user.role})`);
        res.json({ 
            success: true, 
            message: 'Login realizado com sucesso!',
            user: userWithoutPassword
        });
    } else {
        console.log(`❌ Login falhou: ${username}`);
        res.status(401).json({ 
            success: false, 
            message: 'Usuário ou senha incorretos' 
        });
    }
});

// Registro
app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    console.log(`📝 Tentativa de registro: ${username}`);
    
    if (!username || !email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Todos os campos são obrigatórios' 
        });
    }
    
    const users = readUsers();
    
    if (users.find(u => u.username === username)) {
        return res.status(409).json({ 
            success: false, 
            message: 'Nome de usuário já existe' 
        });
    }
    
    if (users.find(u => u.email === email)) {
        return res.status(409).json({ 
            success: false, 
            message: 'Email já cadastrado' 
        });
    }
    
    const newUser = {
        id: Date.now(),
        username,
        email,
        password,
        role: 'votante',
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    if (writeUsers(users)) {
        const { password: _, ...userWithoutPassword } = newUser;
        console.log(`✅ Usuário registrado: ${username}`);
        res.status(201).json({ 
            success: true, 
            message: 'Usuário criado com sucesso!',
            user: userWithoutPassword
        });
    } else {
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao salvar usuário' 
        });
    }
});

// Status do servidor
app.get('/api/status', (req, res) => {
    const users = readUsers();
    res.json({
        success: true,
        server: 'Soso Zone',
        timestamp: new Date().toISOString(),
        users: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        votantes: users.filter(u => u.role === 'votante').length
    });
});

// POST - Resetar votação (players)
app.post('/api/games/:game/reset-voting', (req, res) => {
    const { game } = req.params;
    
    if (!['valorant', 'lol'].includes(game)) {
        return res.status(400).json({ success: false, message: 'Modalidade inválida' });
    }
    
    try {
        const games = readGames();
        
        // Reset players voting data
        games[game].players.forEach(player => {
            player.votes = {};
        });
        
        // Reset voting status - reseta todas as propriedades de controle
        games[game].votingActive = false;
        games[game].votingOpen = false;
        games[game].voting_active = false;
        games[game].teams = [];
        games[game].votes = {};
        
        if (writeGames(games)) {
            res.json({ 
                success: true, 
                message: `Votação do ${game.toUpperCase()} resetada com sucesso!` 
            });
            console.log(`🔄 Votação do ${game.toUpperCase()} resetada`);
        } else {
            res.status(500).json({ success: false, message: 'Erro ao resetar votação' });
        }
    } catch (error) {
        console.error('❌ Erro ao resetar votação:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// POST - Resetar votação de mapas
app.post('/api/games/valorant/reset-maps', (req, res) => {
    try {
        const games = readGames();
        
        // Reset maps voting data
        if (games.valorant.maps) {
            games.valorant.maps.votes = {};
            games.valorant.maps.votingActive = false;
            games.valorant.maps.selected = [];
        }
        
        // Reset map voting status - reseta todas as propriedades
        games.valorant.mapVotingOpen = false;
        
        if (writeGames(games)) {
            res.json({ 
                success: true, 
                message: 'Votação de mapas resetada com sucesso!' 
            });
            console.log('🗺️ Votação de mapas resetada');
        } else {
            res.status(500).json({ success: false, message: 'Erro ao resetar votação de mapas' });
        }
    } catch (error) {
        console.error('❌ Erro ao resetar votação de mapas:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Teste
app.get('/test', (req, res) => {
    res.json({ 
        message: 'Servidor funcionando!', 
        timestamp: new Date(),
        admin: 'mutucapin/jms270804'
    });
});

// Inicializar e rodar servidor
console.log('🔧 Configurando servidor...');

try {
    initializeUsers();
    
    app.listen(PORT, () => {
        console.log('');
        console.log('🎮 ===== SOSO ZONE SERVER =====');
        console.log(`🌐 Rodando em: http://localhost:${PORT}`);
        console.log(`👤 Admin: mutucapin / jms270804`);
        console.log(`👥 Votante teste: player1 / 123456`);
        console.log(`📁 Dados em: ${USERS_FILE}`);
        console.log('=============================');
        console.log('');
        console.log('✅ Servidor pronto! Acesse http://localhost:3000');
    });
    
} catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
}

module.exports = app;
