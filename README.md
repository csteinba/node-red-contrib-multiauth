# node-red-contrib-multiauth  

🚀 **Secure multi-user authentication for Node-RED with Basic Auth, password hashing, and route-based access control (ACL).**  

## 📖 Features  

✅ **Basic Authentication** (multiple users)  
✅ **Hashed Passwords** (`argon2`)  
✅ **Access Control (ACL)** based on JSON rules  
✅ **Wildcard Route Support** (e.g., `api/myroute/*`)  
✅ **Optimized for Performance** (users loaded once)  

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

const { basicAuthMiddleware, loadUsers } = require("node-red-contrib-multiauth");

// load users once at startup
loadUsers("./users.json");

module.exports = {
    // ....
    // register auth middleware
    httpMiddleware: basicAuthMiddleware
    // ...
};
```

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

### 🛡 Security

✅ Safe password comparison with argon2.verify().

#### 📜 License

MIT License - Free to use and modify.
