// Configuração para API Base URL
const API_CONFIG = {
    // Detecta automaticamente se está em produção ou desenvolvimento
    getBaseURL: function() {
        // Se estiver em produção (hostname não é localhost)
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            // Use a URL atual do site (para Render.com ou qualquer outro deploy)
            return `${window.location.protocol}//${window.location.host}`;
        }
        // Se estiver em desenvolvimento
        return 'http://localhost:3000';
    }
};

// Função helper para fazer requests
const apiRequest = async (endpoint, options = {}) => {
    const baseURL = API_CONFIG.getBaseURL();
    const url = `${baseURL}/api${endpoint}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        return response;
    } catch (error) {
        console.error(`Erro na requisição para ${url}:`, error);
        throw error;
    }
};

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.API_CONFIG = API_CONFIG;
    window.apiRequest = apiRequest;
}
