const fs = require("fs");
const bcrypt = require("bcrypt");
const path = require("path");

/** Global variable to store user data */
let users = Object.create(null);

/**
 * Loads user credentials and ACL from `users.json` once at startup.
 * Stores the result in memory for fast access.
 */
function loadUsers(filePath) {
    try {
        const data = fs.readFileSync(filePath, "utf-8");
        users = Object.assign(Object.create(null), JSON.parse(data)); // Prevent prototype pollution
    } catch (err) {
        console.error("Error loading users file:", err);
        users = Object.create(null); // Ensure users is always a safe object
    }
}

/**
 * Checks if a user has permission to access a given route based on ACL.
 * Supports wildcard patterns (`/*`).
 * 
 * @param {string[]} userAcl - The list of allowed routes for the user.
 * @param {string} route - The requested route.
 * @returns {boolean} True if access is allowed, otherwise false.
 */
function isAccessAllowed(userAcl, route) {
    return userAcl.some(pattern => {
        if (pattern === "*") return true; // Full access
        if (pattern.endsWith("/*")) {
            const basePattern = pattern.slice(0, -1); // Remove trailing wildcard
            return route.startsWith(basePattern);
        }
        return pattern === route;
    });
}

/**
 * Express middleware for Basic Authentication with ACL-based access control.
 * 
 * @param {import("express").Request} req - The request object.
 * @param {import("express").Response} res - The response object.
 * @param {import("express").NextFunction} next - The next middleware function.
 */
async function basicAuthMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Basic ")) {
        res.set("WWW-Authenticate", 'Basic realm="Node-RED"');
        return res.status(401).send("Authentication required");
    }

    // Extract and decode Base64 credentials
    const base64Credentials = authHeader.split(" ")[1];
    let credentials;
    try {
        credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
    } catch (error) {
        return res.status(400).send("Invalid authentication data");
    }
    const [username, password] = credentials.split(":");

    // Validate username format (alphanumeric, underscores, dashes, max 50 chars)
    if (
        !username ||
        !/^[a-zA-Z0-9_-]{1,50}$/.test(username) ||
        username === "__proto__" ||
        username === "constructor"
    ) {
        return res.status(400).send("Invalid username");
    }

    // Ensure safe property lookup
    if (!Object.prototype.hasOwnProperty.call(users, username)) {
        console.log("user not found", users, username)
        return res.status(401).send("Invalid credentials");
    }

    // Get user profile
    const user = users[username];
    if(typeof user !== "object" || !user.password || !Array.isArray(user.acl)) {
        return res.status(500).send("Invalid user profile");
    }

    // Secure password comparison
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        console.log("user password", password, user.password)
        return res.status(401).send("Invalid credentials");
    }

    // Check ACL for route access
    if (!isAccessAllowed(user.acl, req.path)) {
        return res.status(403).send("Access denied");
    }

    req.user = { username };
    next();
}

module.exports = { basicAuthMiddleware, loadUsers };