const fetch = require('node-fetch');

async function testAPI() {
    try {
        console.log('🧪 Testando API...');
        
        // Teste 1: Stats
        console.log('1️⃣ Testando /api/stats');
        const statsResponse = await fetch('http://localhost:3000/api/stats');
        console.log('Status:', statsResponse.status);
        const statsData = await statsResponse.json();
        console.log('Stats:', statsData);
        
        // Teste 2: Login
        console.log('\n2️⃣ Testando /api/login');
        const loginResponse = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'mutucapin',
                password: 'jms270804'
            })
        });
        console.log('Status:', loginResponse.status);
        const loginData = await loginResponse.json();
        console.log('Login:', loginData);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

testAPI();
