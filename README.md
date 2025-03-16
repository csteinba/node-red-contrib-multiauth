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

### ⚙️ Add User
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

### 🔬 Testing
Run Jest tests:

```sh
npm test
```

#### 📜 License

MIT License - Free to use and modify.
