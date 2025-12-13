const API_URL = 'http://localhost:3000/api/v1/auth';

async function verifyLogin() {
    const email = `test_${Date.now()}@example.com`;
    const password = 'Password123!';

    console.log(`1. Registering user: ${email}`);
    try {
        const registerRes = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                firstName: 'Test',
                lastName: 'User'
            })
        });

        if (!registerRes.ok) {
            console.error('Registration failed:', await registerRes.text());
            return;
        }
        console.log('Registration successful');

        console.log('2. Logging in...');
        const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password
            })
        });

        if (!loginRes.ok) {
            console.error('Login failed:', await loginRes.text());
            return;
        }

        console.log('Login successful');
        console.log('3. Checking Cookies...');

        // fetch in Node.js might handle headers differently
        // getSetCookie() is available in Node 20+
        let cookies = [];
        if (loginRes.headers.getSetCookie) {
            cookies = loginRes.headers.getSetCookie();
        } else {
            // Fallback for older node versions or different implementations
            const cookieHeader = loginRes.headers.get('set-cookie');
            if (cookieHeader) cookies = [cookieHeader];
        }

        console.log('Set-Cookie Headers:', cookies);

        const hasAccessToken = cookies.some(c => c.includes('munshi_access_token'));
        const hasRefreshToken = cookies.some(c => c.includes('munshi_refresh_token'));

        if (hasAccessToken && hasRefreshToken) {
            console.log('SUCCESS: Both cookies are present.');

            const accessTokenCookie = cookies.find(c => c.includes('munshi_access_token'));
            console.log('Access Token Cookie Attributes:', accessTokenCookie);

            if (accessTokenCookie && accessTokenCookie.includes('Secure') && accessTokenCookie.includes('HttpOnly')) {
                console.log('Attributes check: Secure and HttpOnly are present.');
            } else {
                console.log('Attributes check: Secure or HttpOnly might be missing (Check if this is expected for dev).');
            }

        } else {
            console.error('FAILURE: Missing cookies.');
            if (!hasAccessToken) console.error('- Missing munshi_access_token');
            if (!hasRefreshToken) console.error('- Missing munshi_refresh_token');
        }
    } catch (error) {
        console.error('Error during verification:', error);
    }
}

verifyLogin();
