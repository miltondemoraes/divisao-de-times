// Admin Dashboard JavaScript
// Configuração da API vinda do config.js
const API_BASE_URL = window.API_CONFIG ? API_CONFIG.getBaseURL() : 'http://localhost:3000';

let currentGame = '';
let games = { valorant: [], lol: [] };
let stats = { valorant: 0, lol: 0, votes: 0, users: 0 };

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário está logado como admin
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.username || currentUser.role !== 'admin') {
        alert('Acesso negado! Apenas administradores podem acessar esta página.');
        window.location.href = 'index.html';
        return;
    }
    
    // Exibir nome do admin
    document.getElementById('adminName').textContent = currentUser.username;
    
    // Carregar dados iniciais
    loadDashboardData();
});

// Carregar dados do dashboard
async function loadDashboardData() {
    try {
        // Carregar estatísticas
        await loadStats();
        
        // Carregar players dos jogos
        await loadGamePlayers();
        
        // Atualizar interface
        updateDashboard();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showNotification('Erro ao carregar dados do dashboard', 'error');
    }
}

// Carregar estatísticas
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/games`);
        if (response.ok) {
            const data = await response.json();
            
            // Contar players por jogo
            stats.valorant = data.valorant ? data.valorant.players.length : 0;
            stats.lol = data.lol ? data.lol.players.length : 0;
            
            // Contar votos por categoria
            stats.valorantVotes = 0;
            stats.lolVotes = 0;
            stats.mapVotes = 0;
            
            // Votos Valorant (players)
            if (data.valorant && data.valorant.votes) {
                stats.valorantVotes = Object.keys(data.valorant.votes).length;
            }
            
            // Votos LoL (players)
            if (data.lol && data.lol.votes) {
                stats.lolVotes = Object.keys(data.lol.votes).length;
            }
            
            // Votos Mapas (Valorant)
            if (data.valorant && data.valorant.maps && data.valorant.maps.votes) {
                stats.mapVotes = Object.keys(data.valorant.maps.votes).length;
            }
            
            games = data;
        }
        
        // Carregar total de usuários
        try {
            const usersResponse = await fetch(`${API_BASE_URL}/api/users`);
            if (usersResponse.ok) {
                const users = await usersResponse.json();
                stats.users = users.length;
            } else {
                console.warn('Endpoint /api/users não encontrado');
                stats.users = 0;
            }
        } catch (userError) {
            console.error('Erro ao carregar usuários:', userError);
            stats.users = 0;
        }
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Carregar players dos jogos
async function loadGamePlayers() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/games`);
        if (response.ok) {
            const data = await response.json();
            games = data;
        }
    } catch (error) {
        console.error('Erro ao carregar players:', error);
    }
}

// Atualizar dashboard
function updateDashboard() {
    // Atualizar estatísticas
    document.getElementById('valorantPlayers').textContent = stats.valorant;
    document.getElementById('lolPlayers').textContent = stats.lol;
    document.getElementById('valorantVotes').textContent = stats.valorantVotes;
    document.getElementById('lolVotes').textContent = stats.lolVotes;
    document.getElementById('mapVotes').textContent = stats.mapVotes;
    document.getElementById('totalUsers').textContent = stats.users;
    
    // Atualizar status dos jogos
    updateGameStatus('valorant');
    updateGameStatus('lol');
    
    // Atualizar contadores de players
    document.getElementById('valorantPlayerCount').textContent = stats.valorant;
    document.getElementById('lolPlayerCount').textContent = stats.lol;
    
    // Atualizar botões
    updateButtons();
    
    // Atualizar status da votação de mapas
    updateMapVotingStatus();
    
    // Renderizar players
    renderPlayers('valorant');
    renderPlayers('lol');
}

// Atualizar status do jogo
function updateGameStatus(game) {
    const statusElement = document.getElementById(`${game}Status`);
    const infoElement = document.getElementById(`${game}Info`);
    const playerCount = game === 'valorant' ? stats.valorant : stats.lol;
    
    let status = 'Configurando';
    let statusClass = '';
    
    if (playerCount === 10) {
        if (games[game] && games[game].votingActive) {
            status = 'Votação Ativa';
            statusClass = 'active';
        } else if (games[game] && games[game].teams && games[game].teams.length > 0) {
            status = 'Concluído';
            statusClass = 'completed';
        } else {
            status = 'Pronto para Votar';
            statusClass = 'completed';
        }
    }
    
    statusElement.textContent = status;
    statusElement.className = `status-badge ${statusClass}`;
    infoElement.textContent = `${playerCount}/10 players cadastrados`;
}

// Atualizar botões
function updateButtons() {
    // Valorant
    const valorantAddBtn = document.getElementById('addValorantBtn');
    const valorantStartBtn = document.getElementById('startValorantVoting');
    const valorantEndBtn = document.getElementById('endValorantVoting');
    
    valorantAddBtn.disabled = stats.valorant >= 10;
    valorantStartBtn.disabled = stats.valorant < 10 || (games.valorant && games.valorant.votingActive);
    valorantEndBtn.disabled = !games.valorant || !games.valorant.votingActive;
    
    // LoL
    const lolAddBtn = document.getElementById('addLolBtn');
    const lolStartBtn = document.getElementById('startLolVoting');
    const lolEndBtn = document.getElementById('endLolVoting');
    
    lolAddBtn.disabled = stats.lol >= 10;
    lolStartBtn.disabled = stats.lol < 10 || (games.lol && games.lol.votingActive);
    lolEndBtn.disabled = !games.lol || !games.lol.votingActive;
}

// Renderizar players
function renderPlayers(game) {
    const container = document.getElementById(`${game}PlayersGrid`);
    const players = games[game] ? games[game].players : [];
    
    if (players.length === 0) {
        container.innerHTML = '<p class="no-results">Nenhum player cadastrado ainda</p>';
        return;
    }
    
    container.innerHTML = players.map((player, index) => `
        <div class="player-card">
            <div class="player-avatar">
                ${player.name.charAt(0).toUpperCase()}
            </div>
            <div class="player-name">${player.name}</div>
            <div class="player-stats">
                ${getPlayerVoteCount(game, player.name)} votos recebidos
            </div>
            <div class="player-actions">
                <button class="btn-danger btn-small" onclick="removePlayer('${game}', ${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Função para contar quantos votos um player recebeu
function getPlayerVoteCount(game, playerName) {
    if (!games[game] || !games[game].votes) {
        return 0;
    }
    
    let count = 0;
    // Iterar sobre todos os votantes
    Object.values(games[game].votes).forEach(voterVotes => {
        // Verificar se este votante votou neste player
        if (voterVotes[playerName] !== undefined) {
            count++;
        }
    });
    
    return count;
}

// Navegação entre seções
function showSection(sectionName) {
    // Remover classe active de todas as seções
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remover classe active de todos os botões de navegação
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Ativar seção e botão correspondentes
    document.getElementById(`${sectionName}-section`).classList.add('active');
    event.target.classList.add('active');
}

// Modal para adicionar player
function showAddPlayerModal(game) {
    currentGame = game;
    document.getElementById('addPlayerModal').style.display = 'block';
    document.getElementById('playerName').focus();
}

function closeModal() {
    document.getElementById('addPlayerModal').style.display = 'none';
    document.getElementById('addPlayerForm').reset();
}

// Event listener para o formulário de adicionar player
document.getElementById('addPlayerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const playerName = document.getElementById('playerName').value.trim();
    
    if (!playerName) {
        showNotification('Por favor, digite o nome do player', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/games/${currentGame}/players`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: playerName })
        });
        
        if (response.ok) {
            showNotification(`Player ${playerName} adicionado com sucesso!`, 'success');
            closeModal();
            await loadDashboardData(); // Recarregar dados
        } else {
            const error = await response.json();
            showNotification(error.message || 'Erro ao adicionar player', 'error');
        }
        
    } catch (error) {
        console.error('Erro ao adicionar player:', error);
        showNotification('Erro ao conectar com o servidor', 'error');
    }
});

// Remover player
async function removePlayer(game, playerIndex) {
    if (!confirm('Tem certeza que deseja remover este player?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/games/${game}/players/${playerIndex}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Player removido com sucesso!', 'success');
            await loadDashboardData(); // Recarregar dados
        } else {
            const error = await response.json();
            showNotification(error.message || 'Erro ao remover player', 'error');
        }
        
    } catch (error) {
        console.error('Erro ao remover player:', error);
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

// Iniciar votação
async function startVoting(game) {
    if (!confirm(`Iniciar votação para ${game.toUpperCase()}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/games/${game}/voting/start`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showNotification(`Votação de ${game.toUpperCase()} iniciada!`, 'success');
            await loadDashboardData(); // Recarregar dados
        } else {
            const error = await response.json();
            showNotification(error.message || 'Erro ao iniciar votação', 'error');
        }
        
    } catch (error) {
        console.error('Erro ao iniciar votação:', error);
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

// Encerrar votação
async function endVoting(game) {
    if (!confirm(`Encerrar votação para ${game.toUpperCase()}? Os times serão calculados automaticamente.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/games/${game}/voting/end`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification(`Votação de ${game.toUpperCase()} encerrada! Times calculados.`, 'success');
            await loadDashboardData(); // Recarregar dados
            
            // Mostrar resultados automaticamente
            showSection('results');
            // Recarregar resultados atualizados
            setTimeout(loadResults, 100);
        } else {
            const error = await response.json();
            showNotification(error.message || 'Erro ao encerrar votação', 'error');
        }
        
    } catch (error) {
        console.error('Erro ao encerrar votação:', error);
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

// Exibir resultados
function displayResults(game, teams, maps = null) {
    const resultsContainer = document.getElementById(`${game}Results`);
    
    let content = '';
    
    // Exibir times se existirem
    if (teams && teams.length > 0) {
        content += teams.map((team, index) => `
            <div class="team-result">
                <div class="team-title">Time ${index + 1} (Média: ${team.averageScore.toFixed(1)})</div>
                <div class="team-players">
                    ${team.players.map(player => `
                        <span class="team-player">${player.name} (${player.score.toFixed(1)})</span>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
    
    // Exibir mapas se for Valorant e tiver mapas selecionados
    if (game === 'valorant' && maps && maps.length > 0) {
        content += `
            <div class="maps-results-admin">
                <h4><i class="fas fa-map"></i> Mapas Selecionados</h4>
                <div class="admin-maps-grid">
                    ${maps.map((map, index) => `
                        <div class="admin-map-card">
                            <div class="map-position">${index + 1}º</div>
                            <div class="map-name">${map.name}</div>
                            <div class="map-votes">${map.votes} ${map.votes === 1 ? 'voto' : 'votos'}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    if (!content) {
        content = '<p class="no-results">Nenhuma votação concluída ainda</p>';
    }
    
    resultsContainer.innerHTML = content;
}

// Carregar e exibir resultados existentes
async function loadResults() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/games`);
        if (response.ok) {
            const data = await response.json();
            
            if (data.valorant) {
                const valorantMaps = data.valorant.maps && data.valorant.maps.selected ? data.valorant.maps.selected : null;
                displayResults('valorant', data.valorant.teams, valorantMaps);
            }
            
            if (data.lol && data.lol.teams) {
                displayResults('lol', data.lol.teams);
            }
        }
    } catch (error) {
        console.error('Erro ao carregar resultados:', error);
    }
}

// Logout
function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// Sistema de notificações
function showNotification(message, type = 'info') {
    // Remover notificação existente
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Adicionar estilos inline
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: ${type === 'success' ? 'linear-gradient(45deg, #2ed573, #7bed9f)' : 
                      type === 'error' ? 'linear-gradient(45deg, #ff4757, #ff6b7a)' : 
                      'linear-gradient(45deg, #3742fa, #5352ed)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Event listeners para modal
document.addEventListener('click', function(e) {
    if (e.target === document.getElementById('addPlayerModal')) {
        closeModal();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Carregar resultados quando a seção de resultados for ativada
document.addEventListener('click', function(e) {
    if (e.target.textContent.includes('Resultados')) {
        setTimeout(loadResults, 100);
    }
});

// ===== FUNÇÕES PARA VOTAÇÃO DE MAPAS =====

// Iniciar votação de mapas
async function startMapVoting() {
    if (!confirm('Iniciar votação de mapas do Valorant?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/valorant/maps/voting/start`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showNotification('Votação de mapas iniciada!', 'success');
            await loadDashboardData(); // Recarregar dados
        } else {
            const error = await response.json();
            showNotification(error.message || 'Erro ao iniciar votação de mapas', 'error');
        }
    } catch (error) {
        console.error('Erro ao iniciar votação de mapas:', error);
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

// Encerrar votação de mapas
async function endMapVoting() {
    if (!confirm('Encerrar votação de mapas? Os 5 mapas mais votados serão selecionados.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/valorant/maps/voting/end`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('Votação de mapas encerrada! Mapas selecionados.', 'success');
            await loadDashboardData(); // Recarregar dados
            
            // Exibir resultados
            displayMapResults(result.selectedMaps);
        } else {
            const error = await response.json();
            showNotification(error.message || 'Erro ao encerrar votação de mapas', 'error');
        }
    } catch (error) {
        console.error('Erro ao encerrar votação de mapas:', error);
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

// Exibir resultados da votação de mapas
function displayMapResults(selectedMaps) {
    const resultsContainer = document.getElementById('mapsResults');
    
    if (!selectedMaps || selectedMaps.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">Nenhum mapa selecionado ainda</p>';
        return;
    }
    
    resultsContainer.innerHTML = `
        <h4>🗺️ Mapas Selecionados (Top 5)</h4>
        <div class="maps-grid">
            ${selectedMaps.map((mapData, index) => `
                <div class="map-result-card selected">
                    <div class="map-position">${index + 1}º lugar</div>
                    <div class="map-name">${mapData.name}</div>
                    <div class="map-votes">${mapData.votes} votos</div>
                </div>
            `).join('')}
        </div>
    `;
}

// Atualizar status da votação de mapas
function updateMapVotingStatus() {
    const statusElement = document.getElementById('mapVotingStatus');
    const infoElement = document.getElementById('mapVotingInfo');
    const startBtn = document.getElementById('startMapVotingBtn');
    const endBtn = document.getElementById('endMapVotingBtn');
    
    if (!games.valorant || !games.valorant.players || games.valorant.players.length < 10) {
        statusElement.textContent = 'Aguardando';
        statusElement.className = 'status-badge';
        infoElement.textContent = 'Configure os players primeiro';
        startBtn.disabled = true;
        endBtn.disabled = true;
        return;
    }
    
    if (games.valorant.maps && games.valorant.maps.votingActive) {
        statusElement.textContent = 'Votação Ativa';
        statusElement.className = 'status-badge active';
        const voteCount = Object.keys(games.valorant.maps.votes || {}).length;
        infoElement.textContent = `${voteCount}/10 votantes participaram`;
        startBtn.disabled = true;
        endBtn.disabled = false;
    } else if (games.valorant.maps && games.valorant.maps.selected && games.valorant.maps.selected.length > 0) {
        statusElement.textContent = 'Concluído';
        statusElement.className = 'status-badge completed';
        infoElement.textContent = 'Mapas selecionados com sucesso';
        startBtn.disabled = true;
        endBtn.disabled = true;
        displayMapResults(games.valorant.maps.selected);
    } else {
        statusElement.textContent = 'Pronto';
        statusElement.className = 'status-badge completed';
        infoElement.textContent = 'Pronto para iniciar votação de mapas';
        startBtn.disabled = false;
        endBtn.disabled = true;
    }
}

// Função para resetar votação de players
async function resetVoting(game) {
    console.log('resetVoting chamada para:', game);
    
    if (!confirm(`Tem certeza que deseja resetar toda a votação do ${game.toUpperCase()}? Esta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        console.log('Enviando requisição para:', `/api/games/${game}/reset-voting`);
        const response = await fetch(`/api/games/${game}/reset-voting`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        console.log('Resposta recebida:', data);
        
        if (data.success) {
            showNotification(data.message, 'success');
            await loadDashboardData(); // Recarregar todos os dados
        } else {
            showNotification(data.message || 'Erro ao resetar votação', 'error');
        }
    } catch (error) {
        console.error('Erro ao resetar votação:', error);
        showNotification('Erro ao resetar votação', 'error');
    }
}

// Função para resetar votação de mapas
async function resetMapVoting() {
    console.log('resetMapVoting chamada');
    
    if (!confirm('Tem certeza que deseja resetar toda a votação de mapas? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        console.log('Enviando requisição para: /api/games/valorant/reset-maps');
        const response = await fetch('/api/games/valorant/reset-maps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        console.log('Resposta recebida:', data);
        
        if (data.success) {
            showNotification(data.message, 'success');
            await loadDashboardData(); // Recarregar todos os dados
        } else {
            showNotification(data.message || 'Erro ao resetar votação de mapas', 'error');
        }
    } catch (error) {
        console.error('Erro ao resetar votação de mapas:', error);
        showNotification('Erro ao resetar votação de mapas', 'error');
    }
}

// Atualizar dados a cada 30 segundos
setInterval(loadDashboardData, 30000);
