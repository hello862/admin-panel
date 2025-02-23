const express = require('express');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const port = 3000;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'supersecretkey', resave: false, saveUninitialized: true }));

// Users with roles and passwords
let users = {
    sadface: {
        password: '$2b$10$IgW7klOyEybd4vXDKBmOmOOaQKDcOWytTdonC5vdMD1UjNyn7Q/g.',
        username: 'sadface',
        role: 'Authority'
    },
    murizada: {
        password: '$2$10$iTAbY1rEIQygDRG5oHfKgu1wXkv.awStsz9hcJTYtCk8jw34WCPNu',
        username: 'murizada',
        role: 'Authority'
    },
    trey: {
        password: '$2b$10$xnVKGZttlcDRbdl.s8GAQeK8yVgQsMB35HjELfdql02Gf2Iu2WWfW',
        username: 'trey',
        role: 'Right hand man'
    },
    spxltz: {
        password: '$2b$10$k0ldtanDk7ACaE2yS1lK1e65XcIibFr0CXXu11wqFTVQbLYTu5iY.',
        username: 'spxltz',
        role: 'Director'
    },
    sst: {
        password: '$2b$10$rDL47zZQmPsp9SDrQPp9HumOj32px5duvhu6wdlXn4zzaEcgZoTdi',
        username: 'sst',
        role: 'Director'
    },
    nocs: {
        password: '$2b$10$UuMHlCTOMfawM3uiEnU1MOjOckVdWQtvW4s3VhuR9XS3klob1li9q',
        username: 'nocs',
        role: 'Management'
    },
    juggin: {
        password: '$2b$10$an9gvRPXp.k2Lm0u88wDuORgFY9kbp5svgMzovMWsiBxHtXygA2Hi',
        username: 'juggin',
        role: 'Management'
    }
};

// Role hierarchy: higher number means lower role
const roleHierarchy = [
    'Authority',         // 0
    'Right hand man',    // 1
    'Director',          // 2
    'Management',        // 3
    'Support'            // 4
];

// Promote a user to a higher role
function promoteUser(currentRole, targetUsername) {
    const currentRoleIndex = roleHierarchy.indexOf(currentRole);
    const targetRoleIndex = roleHierarchy.indexOf(users[targetUsername].role);

    if (currentRoleIndex < targetRoleIndex) {
        // Perform promotion (increase the target user's role)
        const newRoleIndex = targetRoleIndex - 1;
        const newRole = roleHierarchy[newRoleIndex];
        users[targetUsername].role = newRole;
        return true;
    } else {
        return false;
    }
}

// Demote a user to a lower role
function demoteUser(currentRole, targetUsername) {
    const currentRoleIndex = roleHierarchy.indexOf(currentRole);
    const targetRoleIndex = roleHierarchy.indexOf(users[targetUsername].role);

    if (currentRoleIndex > targetRoleIndex && targetRoleIndex !== -1) {
        // Perform demotion (decrease the target user's role)
        const newRoleIndex = targetRoleIndex + 1;
        const newRole = roleHierarchy[newRoleIndex];
        users[targetUsername].role = newRole;
        return true;
    } else {
        return false;
    }
}

app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.send(`
        <html>
        <head>
            <title>Response Admin Panel</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: #121212;
                    color: #fff;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    flex-direction: column;
                }
                .login-box {
                    background: #1f1f1f;
                    padding: 40px;
                    border-radius: 8px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    text-align: center;
                    width: 100%;
                    max-width: 450px;
                }
                .login-box input {
                    width: 80%;
                    padding: 12px;
                    margin: 12px 0;
                    border: none;
                    border-radius: 5px;
                    font-size: 18px;
                    background-color: #333;
                    color: #fff;
                }
                .login-box button {
                    width: 80%;
                    padding: 12px;
                    background: #444;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    font-size: 18px;
                    cursor: pointer;
                }
                .login-box button:hover {
                    background: #555;
                }
                .logo {
                    margin-bottom: 30px;
                    font-size: 28px;
                    color: #999;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="login-box">
                    <div class="logo">Response Admin Panel</div>
                    <form action="/login" method="POST">
                        <input type="text" name="username" placeholder="Username" required>
                        <input type="password" name="password" placeholder="Password" required>
                        <button type="submit">Login</button>
                    </form>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!users[username]) return res.send('Invalid username');

    bcrypt.compare(password, users[username].password, (err, result) => {
        if (err) return res.send('Error comparing password');
        if (result) {
            req.session.user = users[username];
            res.redirect('/dashboard');
        } else {
            res.send('Invalid password');
        }
    });
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/');

    const userRole = req.session.user.role;

    let rolesHtml = '';
    let userRoles = [];

    // Generate user role list
    for (const [key, value] of Object.entries(users)) {
        rolesHtml += `<div class="role" id="role-${value.username}">
            <span class="role-name">${value.username}</span> 
            <select class="role-select" onchange="updateRole('${value.username}', this.value)">
                <option value="${value.role}">${value.role}</option>
                <option value="Authority" ${value.role === 'Authority' ? 'disabled' : ''}>Authority</option>
                <option value="Right hand man" ${value.role === 'Right hand man' ? 'disabled' : ''}>Right hand man</option>
                <option value="Director" ${value.role === 'Director' ? 'disabled' : ''}>Director</option>
                <option value="Management" ${value.role === 'Management' ? 'disabled' : ''}>Management</option>
                <option value="Support" ${value.role === 'Support' ? 'disabled' : ''}>Support</option>
            </select>
        </div>`;        
    }

    res.send(`
        <html>
        <head>
            <title>Admin Panel</title>
            <style>
                body {
                    background: #121212;
                    font-family: 'Arial', sans-serif;
                    color: #fff;
                    margin: 0;
                }
                header {
                    background: #1f1f1f;
                    padding: 20px;
                    text-align: center;
                    color: #ccc;
                }
                .panel {
                    display: flex;
                    justify-content: space-between;
                    padding: 20px;
                    gap: 30px;
                }
                .role-container {
                    width: 65%;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    font-size: 14px;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                .role {
                    background: #333;
                    padding: 15px;
                    border-radius: 8px;
                    width: 100%;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                }
                .role select {
                    background-color: #444;
                    color: white;
                    padding: 10px;
                    width: 100%;
                    border-radius: 5px;
                    cursor: pointer;
                    border: none;
                }
                .right-panel {
                    width: 30%;
                    background: #333;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                }
                .right-panel h3 {
                    color: #ccc;
                }
                .right-panel p {
                    margin-top: 20px;
                    color: #999;
                }
                button {
                    background: #444;
                    color: white;
                    padding: 12px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }
                button:hover {
                    background: #555;
                }
                .divider {
                    width: 1px;
                    background-color: #444;
                    height: 100%;
                }
            </style>
            <script>
                function updateRole(username, newRole) {
                    fetch('/updateRole', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ username, newRole })
                    })
                    .then(response => response.json())
                    .then(data => {
                        alert(data.message);
                        location.reload();
                    });
                }
            </script>
        </head>
        <body>
            <header>
                <h1>Response Admin Panel</h1>
                <p>Your role: ${userRole}</p>
            </header>
            <div class="panel">
                <div class="role-container">
                    <h2>Users & Roles</h2>
                    ${rolesHtml}
                </div>
                <div class="divider"></div>
                <div class="right-panel">
                    <h3>Actions</h3>
                    <button onclick="window.location.href='/logout'">Logout</button>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
