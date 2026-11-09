const bcrypt = require('bcrypt');

async function hashPassword() {
    const plainPassword = 'admin123'; // your desired admin password
    const hashed = await bcrypt.hash(plainPassword, 10);
    console.log('Hashed password:', hashed);
}

hashPassword();
