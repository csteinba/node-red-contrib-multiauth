const fs = require("fs");
const argon2 = require("argon2");

/** Global variables */
let users = new Map();

/**
 * Initializes basic authentication with a user file and optional password caching.
 *
 * @param {Object} options - The authentication options.
 * @param {string} options.usersFile - The path to the file containing user credentials.
 * @param {boolean} [options.passwordCaching=false] - Whether to enable password caching (default: false).
 * @returns {void} Returns nothing.
 */
function basicAuthInit({ usersFile, passwordCaching }) {
    try {
        const data = fs.readFileSync(usersFile, "utf-8");
        for (const [username, value] of Object.entries(JSON.parse(data))) {
            users.set(username, {
                digest: value.password,
                pwd: passwordCaching ? null : undefined,
                acl: value.acl,
            });
        }
    } catch (err) {
        console.error("Error loading users.json:", err);
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
    return userAcl.some((pattern) => {
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
        credentials = Buffer.from(base64Credentials, "base64").toString(
            "utf-8"
        );
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
        return res.status(400).send("Invalid credentials");
    }

    // Get user profile
    const user = users.get(username);
    if (user === undefined) {
        return res.status(401).send("Invalid credentials");
    }

    // Check user profile is valid configured
    if (typeof user !== "object" || !user.digest || !Array.isArray(user.acl)) {
        return res.status(500).send("Invalid user profile");
    }

    // password comparison
    const isValid =
        (typeof user.pwd === "string" && user.pwd === password) ||
        (await argon2.verify(user.digest, password));
    if (!isValid) {
        return res.status(401).send("Invalid credentials");
    }

    // if password caching enabled store password in memory
    // this enables better performance after first successfull login
    if(user.pwd === null) {
        user.pwd = password;
        users.set(username, user);
    }

    // Check ACL for route access
    if (!isAccessAllowed(user.acl, req.path)) {
        return res.status(403).send("Access denied");
    }

    req.user = { username };
    next();
}

async function hashPassword(password) {
    console.time("hash-pw");
    const digest = await argon2.hash(password);
    console.timeEnd("hash-pw");
    console.log(digest);
}

module.exports = { basicAuthMiddleware, basicAuthInit, hashPassword };
