const request = require("supertest");
const express = require("express");
const { basicAuthMiddleware, loadUsers } = require("./multiauth");
loadUsers("./users.json")

// Express-App für Tests mit Middleware
const app = express();
app.use(basicAuthMiddleware);
app.get("/route1", (req, res) => res.send("route 1 success"));
app.get("/route2/data1", (req, res) => res.send("route 2 / data 1 success"));
app.get("/route2/data2", (req, res) => res.send("route 2 / data 2 success"));

describe("Auth Middleware Tests", () => {
    test("Correct credentials allow access", async () => {
        const response = await request(app)
            .get("/route1")
            .auth("userRoute1", "userRoute1Pw");

        expect(response.status).toBe(200);
        expect(response.text).toBe("route 1 success");
    });

    test("Unknown user is rejected", async () => {
        const response = await request(app)
            .get("/route1")
            .auth("eviluser", "pw1");

        expect(response.status).toBe(401);
    });

    test("Incorrect password is rejected", async () => {
        const response = await request(app)
            .get("/route1")
            .auth("userRoute1", "wrongpassword");

        expect(response.status).toBe(401);
    });

    test("Invalid user profile in configuration", async () => {
        // user profile has no password
        const response1 = await request(app)
            .get("/route1")
            .auth("userNoPassword", "somepw");

        expect(response1.status).toBe(500);

        // user profile has no ACL
        const response2 = await request(app)
            .get("/route1")
            .auth("userNoACL", "userNoACLPw");

        expect(response2.status).toBe(500);
    })

    test("Access denied for unauthorized route", async () => {
        const response = await request(app)
            .get("/route2/data1")
            .auth("userRoute1", "userRoute1Pw");

        expect(response.status).toBe(403);
    });

    test("Wildcard ACL grants access to sub-routes", async () => {
        const response1 = await request(app)
            .get("/route2/data1")
            .auth("userRoute2", "userRoute2Pw");

        expect(response1.status).toBe(200);
        expect(response1.text).toBe("route 2 / data 1 success");

        const response2 = await request(app)
            .get("/route1")
            .auth("userAllRoutes", "userAllRoutesPw");

        expect(response2.status).toBe(200);
        expect(response2.text).toBe("route 1 success");
    });

    test("No credentials results in 401", async () => {
        const response = await request(app).get("/route1");
        expect(response.status).toBe(401);
    });
});
