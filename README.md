# Soso Zone - Sistema de Login E-sports

## 📋 Descrição
Sistema de login moderno com tema de E-sports, criado com HTML, CSS e JavaScript + Node.js. O sistema salva dados em arquivo TXT real na pasta `data/`.

## 🚀 Instalação e Execução

### 1. Instalar dependências
```bash
npm install
```

### 2. Iniciar o servidor
```bash
npm start
```

### 3. Acessar o sistema
Abra seu navegador em: `http://localhost:3000`

## 📁 Estrutura de Arquivos
```
├── index.html          # Interface principal
├── styles.css          # Estilos e animações  
├── script.js           # Lógica do frontend
├── server.js           # Servidor Node.js + API
├── package.json        # Dependências do projeto
├── data/
│   └── users.txt       # Arquivo TXT com dados dos usuários
└── README.md           # Documentação
```

## 💾 Sistema de Arquivo TXT

### Localização dos Dados
- **Arquivo**: `data/users.txt`
- **Formato**: JSON estruturado
- **Backup automático**: Dados salvos a cada operação

### Estrutura dos Dados
```json
[
  {
    "id": 1234567890,
    "username": "player1",
    "email": "player1@sososzone.com", 
    "password": "senha123",
    "createdAt": "2025-08-26T..."
  }
]
```

## � Funcionalidades

### API Endpoints
- `GET /api/users` - Listar usuários
- `POST /api/login` - Fazer login
- `POST /api/register` - Criar conta
- `GET /api/stats` - Estatísticas do sistema

### Tela de Login
- Campo de usuário e senha
- Validação em tempo real
- Animações suaves
- Mensagens de feedback
- **Dados salvos em arquivo TXT**

### Tela de Cadastro
- Campos: usuário, email, senha e confirmação
- Validações completas
- Verificação de duplicatas
- **Salvamento automático em TXT**

## 👤 Usuários de Teste
- **admin** / admin123
- **player1** / 123456

## 🎨 Características Visuais
- **Tema**: E-sports/Gaming com cores douradas
- **Cores**: Dourado (#ffd700) sobre fundo roxo para máximo contraste
- **Animações**: Background gradiente, efeitos hover, partículas
- **Fontes**: Orbitron (futurista) e Rajdhani (moderna)

## � Tecnologias
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Node.js + Express
- **Banco**: Arquivo TXT (JSON estruturado)
- **CORS**: Habilitado para desenvolvimento

## � Monitoramento
- Console logs detalhados
- Verificação de status do servidor
- Estatísticas de usuários
- Backup manual disponível

---
*Desenvolvido para o projeto "Divisor de Times" - Sistema Soso Zone*
