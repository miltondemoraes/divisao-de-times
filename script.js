// Controle de formulários
function switchToRegister() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
}

function switchToLogin() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
}

// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api';

// Funções para trabalhar com a API
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/users`);
        return await response.json();
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        showMessage('Erro ao conectar com o servidor', 'error');
        return [];
    }
}

async function loginUser(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        return { success: response.ok, data };
    } catch (error) {
        console.error('Erro no login:', error);
        return { success: false, data: { message: 'Erro ao conectar com o servidor' } };
    }
}

async function registerUser(username, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        return { success: response.ok, data };
    } catch (error) {
        console.error('Erro no registro:', error);
        return { success: false, data: { message: 'Erro ao conectar com o servidor' } };
    }
}

function showMessage(message, type = 'info') {
    // Remove mensagem anterior se existir
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas ${type === 'error' ? 'fa-exclamation-triangle' : type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;

    // Adicionar estilos da mensagem
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 300px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    `;

    if (type === 'error') {
        messageDiv.style.background = 'linear-gradient(45deg, #dc2626, #ef4444)';
    } else if (type === 'success') {
        messageDiv.style.background = 'linear-gradient(45deg, #059669, #10b981)';
    } else {
        messageDiv.style.background = 'linear-gradient(45deg, #8b5cf6, #a855f7)';
    }

    document.body.appendChild(messageDiv);

    // Remove a mensagem após 4 segundos
    setTimeout(() => {
        messageDiv.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 4000);
}

// Adicionar estilos das animações das mensagens
const messageStyles = document.createElement('style');
messageStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(messageStyles);

// Função de login
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showMessage('Por favor, preencha todos os campos!', 'error');
        return;
    }
    
    // Mostrar loading
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    submitBtn.disabled = true;
    
    const result = await loginUser(username, password);
    
    // Restaurar botão
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    
    if (result.success) {
        // Salvar usuário logado
        localStorage.setItem('currentUser', JSON.stringify({
            username: result.data.user.username,
            role: result.data.user.role
        }));
        
        showMessage(`Bem-vindo(a) de volta, ${result.data.user.username}! 🎮`, 'success');
        console.log('Usuário logado:', result.data.user);
        
        // Redirecionar baseado no role
        setTimeout(() => {
            if (result.data.user.role === 'admin') {
                window.location.href = 'admin.html'; // Página do admin
            } else {
                window.location.href = 'voting.html'; // Página de votação
            }
        }, 2000);
    } else {
        showMessage(result.data.message, 'error');
    }
}

// Função de cadastro
async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validações
    if (!username || !email || !password || !confirmPassword) {
        showMessage('Por favor, preencha todos os campos!', 'error');
        return;
    }
    
    if (username.length < 3) {
        showMessage('O nome de usuário deve ter pelo menos 3 caracteres!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('A senha deve ter pelo menos 6 caracteres!', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('As senhas não coincidem!', 'error');
        return;
    }
    
    // Validação de email básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Por favor, insira um email válido!', 'error');
        return;
    }
    
    // Mostrar loading
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';
    submitBtn.disabled = true;
    
    const result = await registerUser(username, email, password);
    
    // Restaurar botão
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    
    if (result.success) {
        showMessage('Conta criada com sucesso! 🎉', 'success');
        console.log('Usuário criado:', result.data.user);
        
        // Limpar formulário e voltar para login
        document.getElementById('registerFormElement').reset();
        setTimeout(() => {
            switchToLogin();
        }, 2000);
    } else {
        showMessage(result.data.message, 'error');
    }
}

// Função para adicionar efeitos visuais nos inputs
function addInputEffects() {
    const inputs = document.querySelectorAll('input');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.01)';
            this.parentElement.style.transition = 'transform 0.3s ease';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
        
        // Efeito sutil de digitação - apenas mudança de opacidade
        input.addEventListener('input', function() {
            if (this.value.length > 0) {
                this.style.opacity = '1';
            } else {
                this.style.opacity = '0.9';
            }
        });
    });
}

// Função para adicionar efeitos nos botões
function addButtonEffects() {
    const buttons = document.querySelectorAll('.btn-primary');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.02)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Função para criar partículas no fundo
function createParticles() {
    const particleCount = 25; // Reduzido de 50 para 25
    const container = document.querySelector('.container');
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            background: rgba(139, 92, 246, 0.4);
            border-radius: 50%;
            animation: particleFloat ${8 + Math.random() * 12}s linear infinite;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 8}s;
            pointer-events: none;
        `;
        container.appendChild(particle);
    }
}

// Adicionar animação das partículas
const particleStyles = document.createElement('style');
particleStyles.textContent = `
    @keyframes particleFloat {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(particleStyles);

// Função para verificar se o servidor está rodando
async function checkServerStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (response.ok) {
            const stats = await response.json();
            console.log('📊 Estatísticas do servidor:', stats);
            return true;
        }
        return false;
    } catch (error) {
        console.warn('⚠️ Servidor não está rodando. Execute: npm start');
        showMessage('Servidor não conectado. Verifique se está rodando!', 'error');
        return false;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar status do servidor
    const serverOk = await checkServerStatus();
    
    if (serverOk) {
        console.log('🎮 Soso Zone Login System Initialized');
        console.log('👤 Usuários de teste: admin/admin123, player1/123456');
        console.log('📁 Dados salvos em: data/users.txt');
    }
    
    // Adicionar event listeners aos formulários
    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
    document.getElementById('registerFormElement').addEventListener('submit', handleRegister);
    
    // Adicionar efeitos visuais
    addInputEffects();
    addButtonEffects();
    createParticles();
    
    // Adicionar efeito sutil para inputs de senha
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.querySelector('i').style.transform = 'scale(1.1)';
            this.parentElement.querySelector('i').style.transition = 'transform 0.3s ease';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.querySelector('i').style.transform = 'scale(1)';
        });
    });
});

// Função para exportar dados dos usuários
async function exportUserData() {
    try {
        const users = await loadUsers();
        const dataStr = JSON.stringify(users, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'soso_zone_users_backup.txt';
        link.click();
        
        showMessage('Dados exportados com sucesso!', 'success');
    } catch (error) {
        showMessage('Erro ao exportar dados!', 'error');
    }
}

// Função para importar dados dos usuários
function importUserData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const users = JSON.parse(e.target.result);
                saveUsers(users);
                showMessage('Dados importados com sucesso!', 'success');
            } catch (error) {
                showMessage('Erro ao importar dados!', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Adicionar atalhos de teclado
document.addEventListener('keydown', function(event) {
    // Enter para submeter o formulário visível
    if (event.key === 'Enter' && event.ctrlKey) {
        const visibleForm = document.querySelector('.form-wrapper:not(.hidden) form');
        if (visibleForm) {
            visibleForm.dispatchEvent(new Event('submit'));
        }
    }
    
    // Ctrl + R para alternar entre formulários
    if (event.key === 'r' && event.ctrlKey) {
        event.preventDefault();
        const loginForm = document.getElementById('loginForm');
        if (loginForm.classList.contains('hidden')) {
            switchToLogin();
        } else {
            switchToRegister();
        }
    }
});
