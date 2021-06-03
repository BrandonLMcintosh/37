"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll, u1Token, admin1Token, u2Token } = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users */

describe("POST /users", function () {
	test("fails: non-admin", async function () {
		const resp = await request(app)
			.post("/users")
			.send({
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				password: "password-new",
				email: "new@email.com",
				isAdmin: false,
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("succeeds: admin", async function () {
		const resp = await request(app)
			.post("/users")
			.send({
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				password: "password-new",
				email: "new@email.com",
				isAdmin: true,
			})
			.set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			user: {
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				email: "new@email.com",
				isAdmin: true,
			},
			token: expect.any(String),
		});
	});

	test("fails: anon", async function () {
		const resp = await request(app).post("/users").send({
			username: "u-new",
			firstName: "First-new",
			lastName: "Last-newL",
			password: "password-new",
			email: "new@email.com",
			isAdmin: true,
		});
		expect(resp.statusCode).toEqual(401);
	});

	test("bad request if missing data", async function () {
		const resp = await request(app)
			.post("/users")
			.send({
				username: "u-new",
			})
			.set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request if invalid data", async function () {
		const resp = await request(app)
			.post("/users")
			.send({
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				password: "password-new",
				email: "not-an-email",
				isAdmin: true,
			})
			.set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** POST /user/:username/jobs/:id */
describe("POST /user/:username/jobs/:id", () => {
	test("succeeds: is user", async () => {
		const resp = await request(app).post("/users/u1/jobs/1").set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toBe(201);
		expect(resp.body).toEqual({
			applied: "1",
		});
	});

	test("succeeds: is admin", async () => {
		const resp = await request(app).post("/users/u1/jobs/1").set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toBe(201);
		expect(resp.body).toEqual({
			applied: "1",
		});
	});

	test("fails: not user", async () => {
		const resp = await request(app).post("/users/u1/jobs/1").set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toBe(401);
	});

	test("fails: anon", async () => {
		const resp = await request(app).post("/users/u1/jobs/1");
		expect(resp.statusCode).toBe(401);
	});

	test("fails: job does not exist", async () => {
		const resp = await request(app).post("/users/u1/jobs/600").set("authorization", `Bearer ${u1Token}`);
		console.log(resp.body);
		expect(resp.statusCode).toBe(404);
	});

	test("fails: user does not exist", async () => {
		const resp = await request(app).post("/users/badusername/jobs/1").set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toBe(404);
	});

	test("fails: user already applied", async () => {
		await request(app).post("/users/u1/jobs/1").set("authorization", `Bearer ${u1Token}`);
		const resp = await request(app).post("/users/u1/jobs/1").set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toBe(400);
	});
});

/************************************** GET /users */

describe("GET /users", function () {
	test("fails: non-admins", async function () {
		const resp = await request(app).get("/users").set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toBe(401);
	});

	test("succeeds: admins", async () => {
		const resp = await request(app).get("/users").set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toBe(200);
		expect(resp.body).toEqual({
			users: [
				{
					username: "admin1",
					firstName: "A1F",
					lastName: "A1L",
					isAdmin: true,
					email: "admin1@user.com",
				},
				{
					username: "u1",
					firstName: "U1F",
					lastName: "U1L",
					email: "user1@user.com",
					isAdmin: false,
				},
				{
					username: "u2",
					firstName: "U2F",
					lastName: "U2L",
					email: "user2@user.com",
					isAdmin: false,
				},
				{
					username: "u3",
					firstName: "U3F",
					lastName: "U3L",
					email: "user3@user.com",
					isAdmin: false,
				},
			],
		});
	});

	test("unauth for anon", async function () {
		const resp = await request(app).get("/users");
		expect(resp.statusCode).toEqual(401);
	});

	test("fails: test next() handler", async function () {
		// there's no normal failure event which will cause this route to fail ---
		// thus making it hard to test that the error-handler works with it. This
		// should cause an error, all right :)
		await db.query("DROP TABLE users CASCADE");
		const resp = await request(app).get("/users").set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toEqual(500);
	});
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
	test("fails: non-mutual", async function () {
		const resp = await request(app).get(`/users/u2`).set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("fails: anon", async function () {
		const resp = await request(app).get(`/users/u1`);
		expect(resp.statusCode).toEqual(401);
	});

	test("succeeds: mutual", async () => {
		const resp = await request(app).get("/users/u1").set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toBe(200);
		expect(resp.body).toEqual({
			user: {
				username: "u1",
				firstName: "U1F",
				lastName: "U1L",
				email: "user1@user.com",
				isAdmin: false,
				jobs: [],
			},
		});
	});

	test("succeeds: admin", async () => {
		const resp = await request(app).get("/users/u2").set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			user: {
				username: "u2",
				firstName: "U2F",
				lastName: "U2L",
				email: "user2@user.com",
				isAdmin: false,
				jobs: [],
			},
		});
	});

	test("fails: user not found", async function () {
		const resp = await request(app).get(`/users/nope`).set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toEqual(404);
	});
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
	test("succeeds: mutual", async function () {
		const resp = await request(app)
			.patch(`/users/u1`)
			.send({
				firstName: "New",
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.body).toEqual({
			user: {
				username: "u1",
				firstName: "New",
				lastName: "U1L",
				email: "user1@user.com",
				isAdmin: false,
			},
		});
	});

	test("succeeds: admin", async () => {
		const resp = await request(app)
			.patch("/users/u2")
			.send({
				firstName: "admin-new",
			})
			.set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toBe(200);
		expect(resp.body).toEqual({
			user: {
				username: "u2",
				firstName: "admin-new",
				lastName: "U2L",
				email: "user2@user.com",
				isAdmin: false,
			},
		});
	});

	test("fails: anon", async function () {
		const resp = await request(app).patch(`/users/u1`).send({
			firstName: "New",
		});
		expect(resp.statusCode).toEqual(401);
	});

	test("not found if no such user", async function () {
		const resp = await request(app)
			.patch(`/users/nope`)
			.send({
				firstName: "Nope",
			})
			.set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toEqual(404);
	});

	test("bad request if invalid data", async function () {
		const resp = await request(app)
			.patch(`/users/u1`)
			.send({
				firstName: 42,
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("works: set new password", async function () {
		const resp = await request(app)
			.patch(`/users/u1`)
			.send({
				password: "new-password",
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.body).toEqual({
			user: {
				username: "u1",
				firstName: "U1F",
				lastName: "U1L",
				email: "user1@user.com",
				isAdmin: false,
			},
		});
		const isSuccessful = await User.authenticate("u1", "new-password");
		expect(isSuccessful).toBeTruthy();
	});
});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
	test("succeeds: mutual", async function () {
		const resp = await request(app).delete(`/users/u1`).set("authorization", `Bearer ${u1Token}`);
		expect(resp.body).toEqual({ deleted: "u1" });
	});

	test("succeeds: admin", async () => {
		const resp = await request(app).delete("/users/u1").set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toBe(200);
		expect(resp.body).toEqual({ deleted: "u1" });
	});

	test("fails: anon", async function () {
		const resp = await request(app).delete(`/users/u1`);
		expect(resp.statusCode).toEqual(401);
	});

	test("fails: non-mutual", async () => {
		const resp = await request(app).delete("/users/u2").set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("not found if user missing", async function () {
		const resp = await request(app).delete(`/users/nope`).set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toEqual(404);
	});
});
