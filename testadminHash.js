const bcrypt = require('bcrypt');

async function test() {
    const plain = 'admin123';
    const hash = '$2b$10$r4KQVPzGFVS0XykwPdgFUu.SpCG/jxm6bx/8HHh.ji1SeJJ9QBHv2'; // paste your admin hash exactly
    const match = await bcrypt.compare(plain, hash);
    console.log(match); // should print true
}

test();
