// Voting Page JavaScript
let currentUser = null;
let currentGame = '';
let games = { valorant: null, lol: null };
let userVotes = { valorant: {}, lol: {} };
let userMapVotes = []; // Array com os 5 mapas selecionados
let pendingGame = '';
let availableMaps = [
    'Bind', 'Haven', 'Split', 'Ascent', 'Icebox', 
    'Breeze', 'Fracture', 'Pearl', 'Lotus', 
    'Sunset', 'Abyss', 'Corrode'
];

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário está logado como votante
    currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.username || currentUser.role !== 'votante') {
        alert('Acesso negado! Apenas votantes podem acessar esta página.');
        window.location.href = 'index.html';
        return;
    }
    
    // Exibir nome do votante
    document.getElementById('voterName').textContent = currentUser.username;
    
    // Carregar dados dos jogos
    loadGamesData();
    
    // Atualizar a cada 10 segundos
    setInterval(loadGamesData, 10000);
});

// Carregar dados dos jogos
async function loadGamesData() {
    try {
        const response = await fetch('http://localhost:3000/api/games');
        if (response.ok) {
            const data = await response.json();
            games = data;
            
            // Atualizar interface
            updateGameStatus();
            updateNavigationStatus();
            
            // Se houver um jogo atual, atualizar conteúdo
            if (currentGame) {
                loadGameVoting(currentGame);
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dados dos jogos:', error);
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

// Atualizar status dos jogos na navegação
function updateNavigationStatus() {
    updateGameNavStatus('valorant');
    updateGameNavStatus('lol');
    updateMapVotingNavStatus(); // Atualizar status da votação de mapas
}

function updateGameNavStatus(game) {
    const statusElement = document.getElementById(`${game}Status`);
    const gameData = games[game];
    
    statusElement.className = 'voting-status';
    
    if (!gameData || !gameData.players || gameData.players.length < 10) {
        statusElement.classList.add('inactive');
        statusElement.title = 'Aguardando players';
    } else if (gameData.votingActive) {
        statusElement.classList.add('active');
        statusElement.title = 'Votação ativa';
    } else if (gameData.teams && gameData.teams.length > 0) {
        statusElement.classList.add('completed');
        statusElement.title = 'Votação encerrada';
    } else {
        statusElement.classList.add('inactive');
        statusElement.title = 'Aguardando início da votação';
    }
}

// Atualizar status geral dos jogos
function updateGameStatus() {
    // Verificar se algum jogo tem votação ativa
    const hasActiveVoting = (games.valorant && games.valorant.votingActive) || 
                           (games.lol && games.lol.votingActive);
    
    // Verificar se algum jogo foi finalizado
    const hasResults = (games.valorant && games.valorant.teams && games.valorant.teams.length > 0) ||
                      (games.lol && games.lol.teams && games.lol.teams.length > 0);
    
    // Mostrar mensagem de resultados se não há votação ativa mas há resultados
    if (!hasActiveVoting && hasResults && !currentGame) {
        showResultsMessage();
    }
}

// Mostrar jogo específico
function showGame(game) {
    // Remover classe active de todos os botões
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Adicionar classe active ao botão clicado
    event.target.classList.add('active');
    
    // Esconder todas as seções
    document.getElementById('gameSelection').style.display = 'none';
    document.getElementById('valorant-voting').classList.remove('active');
    document.getElementById('lol-voting').classList.remove('active');
    document.getElementById('map-voting').classList.remove('active'); // Esconder seção de mapas também
    document.getElementById('resultsMessage').style.display = 'none';
    
    currentGame = game;
    loadGameVoting(game);
}

// Carregar votação do jogo
function loadGameVoting(game) {
    const gameData = games[game];
    const section = document.getElementById(`${game}-voting`);
    const content = document.getElementById(`${game}Content`);
    const description = document.getElementById(`${game}Description`);
    const submitBtn = document.getElementById(`submit${game.charAt(0).toUpperCase() + game.slice(1)}Btn`);
    
    section.classList.add('active');
    
    if (!gameData || !gameData.players || gameData.players.length < 10) {
        content.innerHTML = `
            <div class="status-message waiting">
                <i class="fas fa-clock"></i>
                <h3>Aguardando Players</h3>
                <p>Este jogo ainda não tem 10 players cadastrados.</p>
            </div>
        `;
        description.textContent = 'Aguardando players serem cadastrados';
        submitBtn.disabled = true;
        return;
    }
    
    if (!gameData.votingActive) {
        if (gameData.teams && gameData.teams.length > 0) {
            content.innerHTML = `
                <div class="status-message completed">
                    <i class="fas fa-check-circle"></i>
                    <h3>Votação Encerrada</h3>
                    <p>A votação para este jogo já foi encerrada e os times foram formados.</p>
                    <button class="btn-primary" onclick="viewGameResults('${game}')">
                        <i class="fas fa-eye"></i>
                        Ver Resultados
                    </button>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="status-message waiting">
                    <i class="fas fa-pause"></i>
                    <h3>Votação Não Iniciada</h3>
                    <p>A votação para este jogo ainda não foi iniciada pelo administrador.</p>
                </div>
            `;
        }
        description.textContent = 'Votação não disponível';
        submitBtn.disabled = true;
        return;
    }
    
    // Verificar se o usuário já votou e carregar votos existentes
    const hasVoted = gameData.votes && gameData.votes[currentUser.username];
    
    if (hasVoted) {
        // Carregar votos existentes para permitir edição
        userVotes[game] = { ...gameData.votes[currentUser.username] };
    }
    
    // Carregar interface de votação (sempre disponível durante votação ativa)
    renderVotingInterface(game, gameData.players);
    description.textContent = hasVoted ? 'Você pode alterar seus votos até o encerramento' : 'Vote de 1 a 10 para cada player';
    submitBtn.disabled = false;
}

// Renderizar interface de votação
function renderVotingInterface(game, players) {
    const content = document.getElementById(`${game}Content`);
    
    content.innerHTML = `
        <div class="players-voting-grid">
            ${players.map((player, index) => {
                // Obter valor existente ou usar padrão 5
                const currentValue = (userVotes[game] && userVotes[game][player.name]) || 5;
                return `
                <div class="player-voting-card">
                    <div class="player-voting-header">
                        <div class="player-voting-avatar">
                            ${player.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="player-voting-name">${player.name}</div>
                    </div>
                    <div class="rating-section">
                        <div class="rating-label">Sua avaliação:</div>
                        <div class="rating-input">
                            <input type="range" 
                                   class="rating-slider" 
                                   id="${game}-player-${index}" 
                                   min="1" 
                                   max="10" 
                                   value="${currentValue}" 
                                   oninput="updateRating('${game}', ${index}, this.value)">
                            <input type="number" 
                                   class="rating-value" 
                                   id="${game}-value-${index}" 
                                   min="1" 
                                   max="10" 
                                   value="${currentValue}" 
                                   onchange="updateSlider('${game}', ${index}, this.value)">
                        </div>
                        <div class="rating-stars" id="${game}-stars-${index}">
                            ${generateStars(currentValue)}
                        </div>
                    </div>
                </div>
            `;}).join('')}
        </div>
    `;
    
    // Inicializar votos (preservar valores existentes ou usar padrão 5)
    if (!userVotes[game]) {
        userVotes[game] = {};
    }
    
    players.forEach((player, index) => {
        // Só definir valor padrão se não existir voto para este player
        if (userVotes[game][player.name] === undefined) {
            userVotes[game][player.name] = 5;
        }
        
        // Atualizar interface com valores corretos
        const currentValue = userVotes[game][player.name];
        const slider = document.getElementById(`${game}-player-${index}`);
        const numberInput = document.getElementById(`${game}-value-${index}`);
        const starsElement = document.getElementById(`${game}-stars-${index}`);
        
        if (slider) slider.value = currentValue;
        if (numberInput) numberInput.value = currentValue;
        if (starsElement) starsElement.innerHTML = generateStars(currentValue);
    });
    
    // Atualizar botão de envio
    updateSubmitButton(game);
}

// Gerar estrelas para visualização
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 10; i++) {
        stars += `<span class="star ${i <= rating ? 'filled' : ''}">★</span>`;
    }
    return stars;
}

// Atualizar rating via slider
function updateRating(game, playerIndex, value) {
    const valueInput = document.getElementById(`${game}-value-${playerIndex}`);
    const starsContainer = document.getElementById(`${game}-stars-${playerIndex}`);
    
    valueInput.value = value;
    starsContainer.innerHTML = generateStars(parseInt(value));
    
    // Salvar voto
    const players = games[game].players;
    if (players && players[playerIndex]) {
        userVotes[game][players[playerIndex].name] = parseInt(value);
    }
    
    updateSubmitButton(game);
}

// Atualizar slider via input numérico
function updateSlider(game, playerIndex, value) {
    const slider = document.getElementById(`${game}-player-${playerIndex}`);
    const starsContainer = document.getElementById(`${game}-stars-${playerIndex}`);
    
    // Validar valor
    value = Math.max(1, Math.min(10, parseInt(value) || 1));
    
    slider.value = value;
    starsContainer.innerHTML = generateStars(value);
    
    // Salvar voto
    const players = games[game].players;
    if (players && players[playerIndex]) {
        userVotes[game][players[playerIndex].name] = value;
    }
    
    updateSubmitButton(game);
}

// Atualizar botão de envio
function updateSubmitButton(game) {
    const submitBtn = document.getElementById(`submit${game.charAt(0).toUpperCase() + game.slice(1)}Btn`);
    const hasAllVotes = games[game] && games[game].players && 
                       games[game].players.every(player => userVotes[game][player.name] !== undefined);
    
    submitBtn.disabled = !hasAllVotes;
}

// Enviar votos
function submitVotes(game) {
    const gameVotes = userVotes[game];
    
    if (!gameVotes || Object.keys(gameVotes).length === 0) {
        showNotification('Por favor, avalie todos os players antes de enviar.', 'error');
        return;
    }
    
    // Mostrar modal de confirmação
    showConfirmModal(game, gameVotes);
}

// Mostrar modal de confirmação
function showConfirmModal(game, votes) {
    pendingGame = game;
    const modal = document.getElementById('confirmModal');
    const summary = document.getElementById('voteSummary');
    
    summary.innerHTML = Object.entries(votes).map(([player, score]) => `
        <div class="vote-item">
            <span class="vote-player">${player}</span>
            <span class="vote-score">${score}/10</span>
        </div>
    `).join('');
    
    modal.style.display = 'block';
}

// Confirmar envio de votos
async function confirmSubmitVotes() {
    const game = pendingGame;
    const votes = userVotes[game];
    
    try {
        const response = await fetch(`http://localhost:3000/api/games/${game}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: currentUser.username,
                votes: votes
            })
        });
        
        if (response.ok) {
            showNotification('Votos enviados com sucesso!', 'success');
            closeConfirmModal();
            
            // Recarregar dados e atualizar interface
            await loadGamesData();
            if (currentGame === game) {
                loadGameVoting(game);
            }
        } else {
            const error = await response.json();
            showNotification(error.message || 'Erro ao enviar votos', 'error');
        }
    } catch (error) {
        console.error('Erro ao enviar votos:', error);
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

// Fechar modal de confirmação
function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    pendingGame = '';
}

// Mostrar mensagem de resultados
function showResultsMessage() {
    document.getElementById('gameSelection').style.display = 'none';
    document.getElementById('valorant-voting').classList.remove('active');
    document.getElementById('lol-voting').classList.remove('active');
    document.getElementById('resultsMessage').style.display = 'flex';
}

// Ver resultados
function viewResults() {
    loadResults();
    document.getElementById('resultsModal').style.display = 'block';
}

// Ver resultados de um jogo específico
function viewGameResults(game) {
    loadGameSpecificResults(game);
    document.getElementById('resultsModal').style.display = 'block';
}

// Carregar resultados
async function loadResults() {
    try {
        const response = await fetch('http://localhost:3000/api/games');
        if (response.ok) {
            const data = await response.json();
            const resultsContent = document.getElementById('resultsContent');
            
            let html = '';
            
            // Valorant
            const hasValorantTeams = data.valorant && data.valorant.teams && (
                Array.isArray(data.valorant.teams) ? data.valorant.teams.length > 0 : 
                Object.values(data.valorant.teams).some(team => team && team.length > 0)
            );
            const hasValorantMaps = data.valorant && data.valorant.maps && data.valorant.maps.selected && data.valorant.maps.selected.length > 0;
            
            if (hasValorantTeams || hasValorantMaps) {
                html += `
                    <div class="game-results">
                        <h4><i class="fas fa-crosshairs"></i> Valorant</h4>
                        ${hasValorantTeams ? renderTeams(data.valorant.teams) : ''}
                        ${hasValorantMaps ? renderValorantMaps(data.valorant.maps) : ''}
                    </div>
                `;
            }
            
            // LoL
            if (data.lol && data.lol.teams && data.lol.teams.length > 0) {
                html += `
                    <div class="game-results">
                        <h4><i class="fas fa-shield-alt"></i> League of Legends</h4>
                        ${renderTeams(data.lol.teams)}
                    </div>
                `;
            }
            
            if (!html) {
                html = '<p class="status-message">Nenhum resultado disponível ainda.</p>';
            }
            
            resultsContent.innerHTML = html;
        }
    } catch (error) {
        console.error('Erro ao carregar resultados:', error);
        document.getElementById('resultsContent').innerHTML = 
            '<p class="status-message">Erro ao carregar resultados.</p>';
    }
}

// Carregar resultados de um jogo específico
async function loadGameSpecificResults(game) {
    try {
        const response = await fetch('http://localhost:3000/api/games');
        if (response.ok) {
            const data = await response.json();
            const resultsContent = document.getElementById('resultsContent');
            
            const hasTeams = data[game] && data[game].teams && (
                Array.isArray(data[game].teams) ? data[game].teams.length > 0 : 
                Object.values(data[game].teams).some(team => team && team.length > 0)
            );
            const hasMaps = game === 'valorant' && data[game] && data[game].maps && data[game].maps.selected && data[game].maps.selected.length > 0;
            
            if (hasTeams || hasMaps) {
                const gameTitle = game === 'valorant' ? 'Valorant' : 'League of Legends';
                const gameIcon = game === 'valorant' ? 'fas fa-crosshairs' : 'fas fa-shield-alt';
                
                let mapsHtml = '';
                if (game === 'valorant' && hasMaps) {
                    mapsHtml = renderValorantMaps(data[game].maps);
                }
                
                resultsContent.innerHTML = `
                    <div class="game-results">
                        <h4><i class="${gameIcon}"></i> ${gameTitle}</h4>
                        ${hasTeams ? renderTeams(data[game].teams) : ''}
                        ${mapsHtml}
                    </div>
                `;
            } else {
                resultsContent.innerHTML = '<p class="status-message">Nenhum resultado disponível para este jogo.</p>';
            }
        }
    } catch (error) {
        console.error('Erro ao carregar resultados:', error);
        resultsContent.innerHTML = '<p class="status-message">Erro ao carregar resultados.</p>';
    }
}

// Renderizar times
function renderTeams(teams) {
    // Se teams é um objeto, converter para array
    let teamsArray = teams;
    if (teams && !Array.isArray(teams)) {
        teamsArray = Object.values(teams).filter(team => team && team.length > 0);
    }
    
    if (!teamsArray || teamsArray.length === 0) {
        return '';
    }
    
    return teamsArray.map((team, index) => `
        <div class="team-result">
            <div class="team-title">Time ${index + 1} (Média: ${team.averageScore ? team.averageScore.toFixed(1) : 'N/A'})</div>
            <div class="team-players">
                ${team.players ? team.players.map(player => `
                    <span class="team-player">${player.name} (${player.score ? player.score.toFixed(1) : 'N/A'})</span>
                `).join('') : ''}
            </div>
        </div>
    `).join('');
}

// Renderizar mapas do Valorant
function renderValorantMaps(mapsData) {
    if (!mapsData || !mapsData.selected || mapsData.selected.length === 0) {
        return '';
    }
    
    return `
        <div class="maps-results">
            <h5><i class="fas fa-map"></i> Mapas Selecionados</h5>
            <div class="selected-maps-grid">
                ${mapsData.selected.map((map, index) => `
                    <div class="selected-map-card">
                        <div class="map-position">${index + 1}º</div>
                        <div class="map-name">${map.name}</div>
                        <div class="map-votes">${map.votes} ${map.votes === 1 ? 'voto' : 'votos'}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Fechar modal de resultados
function closeResultsModal() {
    document.getElementById('resultsModal').style.display = 'none';
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

// ===== FUNÇÕES PARA VOTAÇÃO DE MAPAS =====

// Mostrar votação de mapas
function showMapVoting() {
    // Remover classe active de todos os botões
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Adicionar classe active ao botão de mapas
    event.target.classList.add('active');
    
    // Esconder todas as seções
    document.getElementById('gameSelection').style.display = 'none';
    document.getElementById('valorant-voting').classList.remove('active');
    document.getElementById('lol-voting').classList.remove('active');
    document.getElementById('resultsMessage').style.display = 'none';
    
    // Mostrar seção de mapas
    document.getElementById('map-voting').classList.add('active');
    
    loadMapVoting();
}

// Mostrar seção de resultados
function showResults() {
    // Remover classe active de todos os botões
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Adicionar classe active ao botão de resultados
    event.target.classList.add('active');
    
    // Esconder todas as seções
    document.getElementById('gameSelection').style.display = 'none';
    document.getElementById('valorant-voting').classList.remove('active');
    document.getElementById('lol-voting').classList.remove('active');
    document.getElementById('map-voting').classList.remove('active');
    document.getElementById('resultsMessage').style.display = 'none';
    
    // Mostrar seção de resultados
    document.getElementById('results-section').classList.add('active');
    
    loadResultsSection();
}

// Carregar seção de resultados
function loadResultsSection() {
    const resultsContent = document.getElementById('resultsContent');
    
    // Fazer a própria chamada da API para não interferir com o modal
    loadResultsData(resultsContent);
}

// Carregar dados de resultados para um container específico
async function loadResultsData(container) {
    try {
        const response = await fetch('http://localhost:3000/api/games');
        if (response.ok) {
            const data = await response.json();
            
            let html = '';
            
            // Valorant
            const hasValorantTeams = data.valorant && data.valorant.teams && (
                Array.isArray(data.valorant.teams) ? data.valorant.teams.length > 0 : 
                Object.values(data.valorant.teams).some(team => team && team.length > 0)
            );
            const hasValorantMaps = data.valorant && data.valorant.maps && data.valorant.maps.selected && data.valorant.maps.selected.length > 0;
            
            if (hasValorantTeams || hasValorantMaps) {
                html += `
                    <div class="game-results">
                        <h4><i class="fas fa-crosshairs"></i> Valorant</h4>
                        ${hasValorantTeams ? renderTeams(data.valorant.teams) : ''}
                        ${hasValorantMaps ? renderValorantMaps(data.valorant.maps) : ''}
                    </div>
                `;
            }
            
            // LoL
            if (data.lol && data.lol.teams && data.lol.teams.length > 0) {
                html += `
                    <div class="game-results">
                        <h4><i class="fas fa-shield-alt"></i> League of Legends</h4>
                        ${renderTeams(data.lol.teams)}
                    </div>
                `;
            }
            
            if (!html) {
                html = '<p class="status-message">Nenhum resultado disponível ainda.</p>';
            }
            
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Erro ao carregar resultados:', error);
        container.innerHTML = 
            '<p class="status-message">Erro ao carregar resultados.</p>';
    }
}

// Carregar votação de mapas
function loadMapVoting() {
    const content = document.getElementById('mapContent');
    const description = document.getElementById('mapDescription');
    const submitBtn = document.getElementById('submitMapBtn');
    
    // Verificar se a votação de mapas está ativa
    if (!games.valorant || !games.valorant.maps || !games.valorant.maps.votingActive) {
        content.innerHTML = `
            <div class="status-message waiting">
                <i class="fas fa-clock"></i>
                <h3>Votação de Mapas Não Iniciada</h3>
                <p>A votação de mapas ainda não foi iniciada pelo administrador.</p>
            </div>
        `;
        description.textContent = 'Aguardando início da votação';
        submitBtn.disabled = true;
        return;
    }
    
    // Verificar se o usuário já votou
    if (games.valorant.maps.votes && games.valorant.maps.votes[currentUser.username]) {
        content.innerHTML = `
            <div class="status-message completed">
                <i class="fas fa-check-circle"></i>
                <h3>Voto Registrado</h3>
                <p>Você já enviou seus votos para os mapas. Aguarde o encerramento da votação.</p>
            </div>
        `;
        description.textContent = 'Voto já registrado';
        submitBtn.disabled = true;
        return;
    }
    
    // Renderizar interface de votação de mapas
    renderMapVotingInterface();
    description.textContent = 'Selecione seus 5 mapas favoritos';
    submitBtn.disabled = userMapVotes.length !== 5;
}

// Renderizar interface de votação de mapas
function renderMapVotingInterface() {
    const content = document.getElementById('mapContent');
    
    content.innerHTML = `
        <div class="map-selection-counter">
            <div class="selection-counter">Mapas selecionados: <span id="mapCounter">0</span>/5</div>
            <div class="selection-instruction">Clique nos mapas para selecioná-los</div>
        </div>
        <div class="maps-voting-grid">
            ${availableMaps.map(map => `
                <div class="map-voting-card" onclick="toggleMapSelection('${map}')" id="map-${map}">
                    <div class="map-icon">
                        ${map.charAt(0)}
                    </div>
                    <div class="map-name">${map}</div>
                    <div class="map-description">Clique para selecionar</div>
                </div>
            `).join('')}
        </div>
    `;
    
    updateMapCounter();
}

// Alternar seleção de mapa
function toggleMapSelection(mapName) {
    const mapCard = document.getElementById(`map-${mapName}`);
    const mapIndex = userMapVotes.indexOf(mapName);
    
    if (mapIndex > -1) {
        // Remover mapa se já estiver selecionado
        userMapVotes.splice(mapIndex, 1);
        mapCard.classList.remove('selected');
    } else {
        // Adicionar mapa se não estiver selecionado e ainda houver espaço
        if (userMapVotes.length < 5) {
            userMapVotes.push(mapName);
            mapCard.classList.add('selected');
        } else {
            showNotification('Você já selecionou 5 mapas. Desmarque um para selecionar outro.', 'error');
            return;
        }
    }
    
    updateMapCounter();
    updateMapSubmitButton();
}

// Atualizar contador de mapas
function updateMapCounter() {
    const counter = document.getElementById('mapCounter');
    if (counter) {
        counter.textContent = userMapVotes.length;
    }
}

// Atualizar botão de envio de mapas
function updateMapSubmitButton() {
    const submitBtn = document.getElementById('submitMapBtn');
    submitBtn.disabled = userMapVotes.length !== 5;
}

// Enviar votos de mapas
function submitMapVotes() {
    if (userMapVotes.length !== 5) {
        showNotification('Por favor, selecione exatamente 5 mapas.', 'error');
        return;
    }
    
    // Mostrar modal de confirmação para mapas
    showMapConfirmModal();
}

// Mostrar modal de confirmação para mapas
function showMapConfirmModal() {
    const modal = document.getElementById('confirmModal');
    const summary = document.getElementById('voteSummary');
    
    // Atualizar conteúdo do modal para mapas
    document.querySelector('.modal-header h3').innerHTML = '<i class="fas fa-map"></i> Confirmar Votação de Mapas';
    document.querySelector('.modal-body p').textContent = 'Tem certeza que deseja enviar seus votos para os mapas? Esta ação não pode ser desfeita.';
    
    summary.innerHTML = `
        <h4>Seus mapas selecionados:</h4>
        ${userMapVotes.map((map, index) => `
            <div class="vote-item">
                <span class="vote-player">${index + 1}º - ${map}</span>
            </div>
        `).join('')}
    `;
    
    // Atualizar botão de confirmação
    const confirmBtn = document.querySelector('.modal-body .btn-primary');
    confirmBtn.onclick = confirmSubmitMapVotes;
    
    modal.style.display = 'block';
}

// Confirmar envio de votos de mapas
async function confirmSubmitMapVotes() {
    try {
        const response = await fetch('http://localhost:3000/api/valorant/maps/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: currentUser.username,
                selectedMaps: userMapVotes
            })
        });
        
        if (response.ok) {
            showNotification('Votos de mapas enviados com sucesso!', 'success');
            closeConfirmModal();
            
            // Recarregar dados e atualizar interface
            await loadGamesData();
            loadMapVoting();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Erro ao enviar votos de mapas', 'error');
        }
    } catch (error) {
        console.error('Erro ao enviar votos de mapas:', error);
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

// Atualizar status da votação de mapas na navegação
function updateMapVotingNavStatus() {
    const statusElement = document.getElementById('mapVotingStatus');
    
    statusElement.className = 'voting-status';
    
    if (!games.valorant || !games.valorant.maps) {
        statusElement.classList.add('inactive');
        statusElement.title = 'Votação não iniciada';
    } else if (games.valorant.maps.votingActive) {
        statusElement.classList.add('active');
        statusElement.title = 'Votação de mapas ativa';
    } else if (games.valorant.maps.selected && games.valorant.maps.selected.length > 0) {
        statusElement.classList.add('completed');
        statusElement.title = 'Mapas selecionados';
    } else {
        statusElement.classList.add('inactive');
        statusElement.title = 'Aguardando';
    }
}

// Event listeners para modais
document.addEventListener('click', function(e) {
    if (e.target === document.getElementById('confirmModal')) {
        closeConfirmModal();
    }
    if (e.target === document.getElementById('resultsModal')) {
        closeResultsModal();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeConfirmModal();
        closeResultsModal();
    }
});
