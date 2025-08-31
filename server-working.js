const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

console.log('🚀 Iniciando Os Sacanas Hub Server...');

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
                    teams: [],
                    postGame: {
                        votingActive: false,
                        votes: {}, // { username: { best: ['player1', 'player2', 'player3'], worst: ['player4', 'player5', 'player6'] } }
                        results: {
                            best: [],
                            worst: []
                        }
                    }
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
                teams: [],
                postGame: {
                    votingActive: false,
                    votes: {},
                    results: {
                        best: [],
                        worst: []
                    }
                }
            }
        };
        console.log(`🎮 Dados dos jogos carregados`);
        return games;
    } catch (error) {
        console.error('❌ Erro ao ler jogos:', error.message);
        return {
            valorant: { players: [], votes: {}, votingActive: false, teams: [] },
            lol: { 
                players: [], 
                votes: {}, 
                votingActive: false, 
                teams: [],
                postGame: {
                    votingActive: false,
                    votes: {},
                    results: {
                        best: [],
                        worst: []
                    }
                }
            }
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

// ===== ALGORITMO DE BALANCEAMENTO DE TIMES =====

function balanceTeams(players) {
    const numPlayers = players.length;
    const teamSize = Math.floor(numPlayers / 2);
    
    // Função para calcular a diferença de médias entre dois times
    function calculateScoreDifference(team1, team2) {
        const avg1 = team1.reduce((sum, p) => sum + p.score, 0) / team1.length;
        const avg2 = team2.reduce((sum, p) => sum + p.score, 0) / team2.length;
        return Math.abs(avg1 - avg2);
    }
    
    // Função para gerar todas as combinações possíveis de times
    function generateCombinations(players, teamSize) {
        const combinations = [];
        
        function backtrack(start, currentTeam) {
            if (currentTeam.length === teamSize) {
                const team1 = [...currentTeam];
                const team2 = players.filter(p => !team1.includes(p));
                combinations.push([team1, team2]);
                return;
            }
            
            for (let i = start; i < players.length; i++) {
                currentTeam.push(players[i]);
                backtrack(i + 1, currentTeam);
                currentTeam.pop();
            }
        }
        
        backtrack(0, []);
        return combinations;
    }
    
    // Para muitos players, usar algoritmo heurístico mais rápido
    if (numPlayers > 12) {
        return balanceTeamsHeuristic(players, teamSize);
    }
    
    // Para poucos players, buscar a melhor combinação
    const combinations = generateCombinations(players, teamSize);
    let bestCombination = combinations[0];
    let smallestDifference = calculateScoreDifference(bestCombination[0], bestCombination[1]);
    
    combinations.forEach(([team1, team2]) => {
        const difference = calculateScoreDifference(team1, team2);
        if (difference < smallestDifference) {
            smallestDifference = difference;
            bestCombination = [team1, team2];
        }
    });
    
    // Formatar resultado
    const [team1Players, team2Players] = bestCombination;
    const team1Avg = team1Players.reduce((sum, p) => sum + p.score, 0) / team1Players.length;
    const team2Avg = team2Players.reduce((sum, p) => sum + p.score, 0) / team2Players.length;
    
    return [
        { players: team1Players, averageScore: parseFloat(team1Avg.toFixed(2)) },
        { players: team2Players, averageScore: parseFloat(team2Avg.toFixed(2)) }
    ];
}

// Algoritmo heurístico para muitos players (mais rápido)
function balanceTeamsHeuristic(players, teamSize) {
    const team1 = [];
    const team2 = [];
    
    // Ordenar players por score (maior para menor)
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    
    // Algoritmo guloso: sempre adicionar ao time com menor média atual
    sortedPlayers.forEach(player => {
        const team1Avg = team1.length > 0 ? team1.reduce((sum, p) => sum + p.score, 0) / team1.length : 0;
        const team2Avg = team2.length > 0 ? team2.reduce((sum, p) => sum + p.score, 0) / team2.length : 0;
        
        // Se um time está cheio, adicionar ao outro
        if (team1.length === teamSize) {
            team2.push(player);
        } else if (team2.length === teamSize) {
            team1.push(player);
        } else {
            // Adicionar ao time com menor média atual
            if (team1Avg <= team2Avg) {
                team1.push(player);
            } else {
                team2.push(player);
            }
        }
    });
    
    // Calcular médias finais
    const team1Avg = team1.reduce((sum, p) => sum + p.score, 0) / team1.length;
    const team2Avg = team2.reduce((sum, p) => sum + p.score, 0) / team2.length;
    
    return [
        { players: team1, averageScore: parseFloat(team1Avg.toFixed(2)) },
        { players: team2, averageScore: parseFloat(team2Avg.toFixed(2)) }
    ];
}

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
    
    // Ordenar por score em ordem decrescente
    players.sort((a, b) => b.score - a.score);
    
    // Implementar algoritmo de balanceamento inteligente
    const teams = balanceTeams(players);
    
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
                email: 'admin@sacanashub.com',
                password: 'jms270804',
                role: 'admin',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                username: 'player1',
                email: 'player1@sacanashub.com',
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
        server: 'Os Sacanas Hub',
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

// ===== ENDPOINTS PARA VOTAÇÃO PÓS-JOGO (LoL) =====

// POST - Iniciar votação pós-jogo
app.post('/api/lol/post-game/start', (req, res) => {
    try {
        const games = readGames();
        
        // Verificar se há players suficientes
        if (!games.lol.players || games.lol.players.length < 3) {
            return res.status(400).json({ 
                success: false, 
                message: 'É necessário ter pelo menos 3 players para iniciar a votação pós-jogo' 
            });
        }
        
        // Inicializar votação pós-jogo
        games.lol.postGame.votingActive = true;
        games.lol.postGame.votes = {};
        games.lol.postGame.results = { best: [], worst: [] };
        
        if (writeGames(games)) {
            res.json({ 
                success: true, 
                message: 'Votação pós-jogo iniciada com sucesso!',
                players: games.lol.players.map(p => p.name)
            });
            console.log('🏆 Votação pós-jogo do LoL iniciada');
        } else {
            res.status(500).json({ success: false, message: 'Erro ao iniciar votação pós-jogo' });
        }
    } catch (error) {
        console.error('❌ Erro ao iniciar votação pós-jogo:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// POST - Registrar voto pós-jogo
app.post('/api/lol/post-game/vote', (req, res) => {
    try {
        const { username, best, worst } = req.body;
        
        // Validações
        if (!username || !best || !worst) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username, melhores e piores jogadores são obrigatórios' 
            });
        }
        
        if (!Array.isArray(best) || !Array.isArray(worst)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Melhores e piores jogadores devem ser arrays' 
            });
        }
        
        if (best.length !== 3 || worst.length !== 3) {
            return res.status(400).json({ 
                success: false, 
                message: 'Deve votar em exatamente 3 melhores e 3 piores jogadores' 
            });
        }
        
        const games = readGames();
        
        if (!games.lol.postGame.votingActive) {
            return res.status(400).json({ 
                success: false, 
                message: 'Votação pós-jogo não está ativa' 
            });
        }
        
        // Registrar voto
        games.lol.postGame.votes[username] = { best, worst };
        
        if (writeGames(games)) {
            res.json({ 
                success: true, 
                message: 'Voto pós-jogo registrado com sucesso!' 
            });
            console.log(`🗳️ Voto pós-jogo registrado de ${username}`);
        } else {
            res.status(500).json({ success: false, message: 'Erro ao registrar voto pós-jogo' });
        }
    } catch (error) {
        console.error('❌ Erro ao registrar voto pós-jogo:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// POST - Encerrar votação pós-jogo e calcular resultados
app.post('/api/lol/post-game/end', (req, res) => {
    try {
        const games = readGames();
        
        if (!games.lol.postGame.votingActive) {
            return res.status(400).json({ 
                success: false, 
                message: 'Não há votação pós-jogo ativa' 
            });
        }
        
        // Calcular resultados
        const votes = games.lol.postGame.votes;
        const bestCount = {};
        const worstCount = {};
        
        // Contar votos com pontuação (1º lugar = 3 pontos, 2º = 2 pontos, 3º = 1 ponto)
        Object.values(votes).forEach(vote => {
            // Melhores jogadores
            vote.best.forEach((player, index) => {
                const points = 3 - index; // 1º = 3pts, 2º = 2pts, 3º = 1pt
                bestCount[player] = (bestCount[player] || 0) + points;
            });
            
            // Piores jogadores
            vote.worst.forEach((player, index) => {
                const points = 3 - index; // 1º = 3pts, 2º = 2pts, 3º = 1pt
                worstCount[player] = (worstCount[player] || 0) + points;
            });
        });
        
        // Ordenar e pegar top 3
        const bestResults = Object.entries(bestCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([player, points], index) => ({ 
                position: index + 1, 
                player, 
                points,
                message: getBestPlayerMessage(index + 1, player)
            }));
        
        const worstResults = Object.entries(worstCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([player, points], index) => ({ 
                position: index + 1, 
                player, 
                points,
                message: getWorstPlayerMessage(index + 1, player)
            }));
        
        // Salvar resultados
        games.lol.postGame.results = { best: bestResults, worst: worstResults };
        games.lol.postGame.votingActive = false;
        
        if (writeGames(games)) {
            res.json({ 
                success: true, 
                message: 'Votação pós-jogo encerrada e resultados calculados!',
                results: { best: bestResults, worst: worstResults }
            });
            console.log('🏆 Votação pós-jogo do LoL encerrada e resultados calculados');
        } else {
            res.status(500).json({ success: false, message: 'Erro ao encerrar votação pós-jogo' });
        }
    } catch (error) {
        console.error('❌ Erro ao encerrar votação pós-jogo:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Funções auxiliares para mensagens personalizadas
function getBestPlayerMessage(position, player) {
    switch(position) {
        case 1: return `A Dona Maria hoje é do: ${player}`;
        case 2: return `Hoje a Aninha fica com o: ${player}`;
        case 3: return `A Cleusa sobrou pro: ${player}`;
        default: return `${position}º lugar: ${player}`;
    }
}

function getWorstPlayerMessage(position, player) {
    switch(position) {
        case 1: return `Hoje o Bimbo e o seu Didi se divertiram no papeiro do: ${player}`;
        case 2: return `Seu Carlos botou legal no: ${player}`;
        case 3: return `Carlinhos fez um tobogã de porra no papeiro do: ${player}`;
        default: return `${position}º pior: ${player}`;
    }
}

// GET - Status da votação pós-jogo
app.get('/api/lol/post-game/status', (req, res) => {
    try {
        const games = readGames();
        res.json({
            success: true,
            votingActive: games.lol.postGame?.votingActive || false,
            totalVotes: Object.keys(games.lol.postGame?.votes || {}).length,
            results: games.lol.postGame?.results || { best: [], worst: [] },
            players: games.lol.players.map(p => p.name)
        });
    } catch (error) {
        console.error('❌ Erro ao buscar status pós-jogo:', error);
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
        console.log('🎮 ===== OS SACANAS HUB SERVER =====');
        console.log(`🌐 Rodando em: http://localhost:${PORT}`);
        console.log(`👤 Admin: mutucapin / jms270804`);
        console.log(`👥 Votante teste: player1 / 123456`);
        console.log(`📁 Dados em: ${USERS_FILE}`);
        console.log('===================================');
        console.log('');
        console.log('✅ Servidor pronto! Acesse http://localhost:3000');
    });
    
} catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
}

module.exports = app;
