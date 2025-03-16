const argon2 = require("argon2");

/**
 * Hash passwords example
 * Run "node hash-pw.js your-password-here"
 */
(async function hashPassword() {
    const password = process.argv[2];
    console.time("hash-pw");
    const digest = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 14, // memory consumption
        timeCost: 2, // number of iterations
        parallelism: 4 // enable multicore calculation
    });
    console.timeEnd("hash-pw");
    console.log(digest);
})();