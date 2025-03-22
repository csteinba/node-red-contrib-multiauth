# node-red-contrib-multiauth  

🚀 **Secure multi-user authentication for Node-RED with Basic Auth, password hashing, and route-based access control (ACL).**  

## 📖 Features  

✅ **Basic Authentication** (multiple users)  
✅ **Hashed Passwords** (`argon2`)  
✅ **Access Control (ACL)** based on JSON rules  
✅ **Wildcard Route Support** (e.g., `api/myroute/*`)  
✅ **Optimized for Performance** 

---

## 🛠 Installation  

### 1️⃣ Install via npm  

```sh
cd ~/.node-red
npm install node-red-contrib-multiauth
```

### 2️⃣ Add Middleware to Node-RED

Edit your settings.js file:

```js

const { basicAuthInit, basicAuthMiddleware } = require("node-red-contrib-multiauth");

basicAuthInit({
    usersFile: "./users.json"
});

module.exports = {
    // ....
    // register auth middleware
    httpMiddleware: basicAuthMiddleware
    // ...
};
```

**Optional: Enable Password Caching**

This function is disabled by default. When enabled, the user password is temporarily stored in the memory to enable faster confirmation of the correct password. This exactly replicates the function of the original Node-RED Authentication Middleware.

```js
basicAuthInit({
    usersFile: "./users.json",
    passwordCaching: true
});
```
As the password requests then only have to be checked by `argon2.verify` the first time, this results in better performance of the requests. However, the compromise is that the passwords are stored in plain text in the memory, which does not meet the highest security standards. If you do not need the performance, we recommend leaving this feature disabled. It is better to use a higher parallelization or a lower number of rounds with the argon2 hashes (check out `has-pw.js`). The performance differences are then only minimal. 

## ⚙️ Add User
Create a users.json file:

```json
{
  "myuser1": {
    "password": "$2b$10$hashedpassword...",
    "acl": ["*"]
  },
  "myuser 2": {
    "password": "$2b$10$hashedpassword...",
    "acl": ["/api/data/*"]
  }
}
```

🔑 Passwords are stored as argon2 hashes
```sh
node -e "require('node-red-contrib-multiauth').hashPassword('your-password-here');"
```

## ⬆️ Upgrade

This package moved from bcrypt hashes in v1.0.0 to argon2 hashes in v1.1.0. Early adopters of v1.0.0 have to hash their passwords with the method above to upgrade and use the more secure argon2 authentication. Read more about this decision below.

## 🔐 Why Argon2 and not bcrypt?

Argon2 is generally better than bcrypt for password hashing due to its stronger security features and resistance to modern attacks. 
It is recommended by OWASP to use this algorithm instead of bcrypt, [read here](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

Here’s a breakdown why:

(1) Memory-Hardness: Argon2 is designed to be memory-intensive, making it much harder for attackers to use parallel GPU/ASIC-based attacks. Bcrypt lacks this feature.

(2) Customization & Security: Argon2 has adjustable parameters for memory usage, execution time, and parallelism, providing more fine-tuned security compared to bcrypt.

(3) Winner of Password Hashing Competition (PHC): Argon2 was selected as the best password hashing algorithm in the 2015 PHC, meaning it was vetted by experts.

(4) Resistance to Side-Channel Attacks: Argon2 is built to resist cache-timing attacks, while bcrypt is more vulnerable to such exploits.

(5) Faster and More Secure: Bcrypt is over 20 years old and optimized for older hardware. Argon2 is built for modern computing power and remains secure against evolving attacks.

## 🔬 Testing
Run Jest tests:

```sh
npm test
```

## 📜 License

MIT License - Free to use and modify.
