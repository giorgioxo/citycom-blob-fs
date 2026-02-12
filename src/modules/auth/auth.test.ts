import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app";

describe("auth flow", () => {
  it("register -> login -> refresh -> logout", async () => {
    const app = createApp();

    const username = `u_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const password = "password123";

    const reg = await request(app).post("/auth/register").send({ username, password });

    if (reg.status !== 201) {
      console.log("REGISTER STATUS:", reg.status);

      console.log("REGISTER BODY:", reg.body);
    }

    expect(reg.status).toBe(201);
    expect(reg.body.id).toBeTruthy();
    expect(reg.body.username).toBe(username);

    const login = await request(app).post("/auth/login").send({ username, password });

    if (login.status !== 200) {
      console.log("LOGIN STATUS:", login.status);

      console.log("LOGIN BODY:", login.body);
    }

    expect(login.status).toBe(200);
    expect(login.body.accessToken).toBeTruthy();
    expect(login.body.tokenType).toBe("Bearer");
    expect(typeof login.body.expiresIn).toBe("number");

    const accessToken: string = login.body.accessToken;

    const agent = request.agent(app);

    const login2 = await agent.post("/auth/login").send({ username, password });
    expect(login2.status).toBe(200);

    const refresh = await agent.post("/auth/refresh").send({});

    if (refresh.status !== 200) {
      console.log("REFRESH STATUS:", refresh.status);

      console.log("REFRESH BODY:", refresh.body);
    }

    expect(refresh.status).toBe(200);
    expect(refresh.body.accessToken).toBeTruthy();
    expect(refresh.body.tokenType).toBe("Bearer");

    const logoutAll = await request(app).post("/auth/logout-all").set("authorization", `Bearer ${accessToken}`).send({});

    if (logoutAll.status !== 200) {
      console.log("LOGOUT-ALL STATUS:", logoutAll.status);
      console.log("LOGOUT-ALL BODY:", logoutAll.body);
    }

    expect(logoutAll.status).toBe(200);
    expect(logoutAll.body.ok).toBe(true);

    const logout = await agent.post("/auth/logout").send({});

    if (logout.status !== 200) {
      console.log("LOGOUT STATUS:", logout.status);

      console.log("LOGOUT BODY:", logout.body);
    }

    expect(logout.status).toBe(200);
    expect(logout.body.ok).toBe(true);
  });
});
