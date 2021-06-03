"use strict";
const request = require("supertest");
const db = require("../db.js");
const app = require("../app");
const Job = require("../models/jobs");

const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll, u1Token, admin1Token } = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/*****************************************POST /jobs */
describe("POST /jobs", () => {
	const newJob = {
		id: 4,
		title: "JT4",
		salary: 40,
		equity: 0.4,
		companyHandle: "c2",
	};

	const badJobMissingData = {
		id: 5,
		salary: 50,
		equity: 0.3,
		companyHandle: "c2",
	};

	const badJobIncorrectData = {
		id: 6,
		salary: "wrong",
		equity: 0.4,
		companyHandle: "c3",
	};
	test("succeeds: admin", async () => {
		const resp = await request(app).post("/jobs").send(newJob).set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toBe(201);
	});

	test("fails: non-admins", async () => {
		const resp = await request(app).post("/jobs").send(newJob).set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toBe(401);
	});

	test("fails: anon", async () => {
		const resp = await request(app).post("/jobs").send(newJob);
		expect(resp.statusCode).toBe(401);
	});

	test("fails: missing data", async () => {
		const resp = await request(app).post("/jobs").send(badJobMissingData).set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toBe(400);
	});

	test("fails: invalid data", async () => {
		const resp = await request(app).post("/jobs").send(badJobIncorrectData).set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toBe(400);
	});
});
/*****************************************GET /jobs */
describe("GET /jobs", () => {
	test("succeeds: admin", async () => {
		const resp = await request(app).get("/jobs").set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toBe(200);
		expect(resp.body).toEqual({
			jobs: [
				{ id: 1, title: "JT1", salary: 10, equity: "0", companyHandle: "c1" },
				{ id: 2, title: "JT2", salary: 20, equity: "0.1", companyHandle: "c2" },
				{ id: 3, title: "JT3", salary: 30, equity: "0.2", companyHandle: "c3" },
			],
		});
	});
	test("succeeds: non-admin", async () => {
		const resp = await request(app).get("/jobs").set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toBe(200);
		expect(resp.body).toEqual({
			jobs: [
				{ id: 1, title: "JT1", salary: 10, equity: "0", companyHandle: "c1" },
				{ id: 2, title: "JT2", salary: 20, equity: "0.1", companyHandle: "c2" },
				{ id: 3, title: "JT3", salary: 30, equity: "0.2", companyHandle: "c3" },
			],
		});
	});
	test("succeeds: anon", async () => {
		const resp = await request(app).get("/jobs");
		expect(resp.statusCode).toBe(200);
		expect(resp.body).toEqual({
			jobs: [
				{ id: 1, title: "JT1", salary: 10, equity: "0", companyHandle: "c1" },
				{ id: 2, title: "JT2", salary: 20, equity: "0.1", companyHandle: "c2" },
				{ id: 3, title: "JT3", salary: 30, equity: "0.2", companyHandle: "c3" },
			],
		});
	});

	test("succeeds: search by title", async () => {
		const resp = await request(app).get("/jobs?title=JT2");
		expect(resp.statusCode).toBe(200);
		expect(resp.body).toEqual({
			jobs: [{ id: 2, title: "JT2", salary: 20, equity: "0.1", companyHandle: "c2" }],
		});
	});

	test("succeeds: search by hasEquity", async () => {
		const resp = await request(app).get("/jobs?hasEquity=true");
		expect(resp.statusCode).toBe(200);
		expect(resp.body).toEqual({
			jobs: [
				{ id: 2, title: "JT2", salary: 20, equity: "0.1", companyHandle: "c2" },
				{ id: 3, title: "JT3", salary: 30, equity: "0.2", companyHandle: "c3" },
			],
		});
	});

	test("succeeds: search by salary", async () => {
		const resp = await request(app).get("/jobs?minSalary=30");
		expect(resp.statusCode).toBe(200);
		expect(resp.body).toEqual({
			jobs: [{ id: 3, title: "JT3", salary: 30, equity: "0.2", companyHandle: "c3" }],
		});
	});
});
/*****************************************GET /jobs/:id */
describe("GET /jobs/:id", () => {
	test("succeeds: admin", async () => {
		const resp = await request(app).get("/jobs/2").set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toBe(200);
		expect(resp.body).toEqual({
			job: {
				id: 2,
				title: "JT2",
				salary: 20,
				equity: "0.1",
				companyHandle: "c2",
			},
		});
	});
	test("succeeds: non-admin", async () => {
		const resp = await request(app).get("/jobs/2").set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toBe(200);
		expect(resp.body).toEqual({
			job: {
				id: 2,
				title: "JT2",
				salary: 20,
				equity: "0.1",
				companyHandle: "c2",
			},
		});
	});
	test("succeeds: anon", async () => {
		const resp = await request(app).get("/jobs/2");
		expect(resp.statusCode).toBe(200);
		expect(resp.body).toEqual({
			job: {
				id: 2,
				title: "JT2",
				salary: 20,
				equity: "0.1",
				companyHandle: "c2",
			},
		});
	});
	test("fails: invalid ID", async () => {
		const resp = await request(app).get("/jobs/10").set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toBe(404);
	});
});
/*****************************************PATCH /jobs/:id */
describe("PATCH /jobs/:id", () => {
	const updateJobFull = {
		title: "new title",
		salary: 4000,
		equity: 0.4,
	};

	const updateJobPartial = {
		title: "new title 2",
	};

	const badJobUpdate = {
		salary: "bad salary",
	};

	test("succeeds: admin", async () => {
		const resp = await request(app).patch("/jobs/1").send(updateJobFull).set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toBe(200);
		expect(resp.body).toEqual({
			job: {
				id: 1,
				title: "new title",
				salary: 4000,
				equity: "0.4",
				companyHandle: "c1",
			},
		});
	});
	test("fails: non-admin", async () => {
		const resp = await request(app).patch("/jobs/1").send(updateJobFull).set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toBe(401);
	});
	test("fails: anon", async () => {
		const resp = await request(app).patch("/jobs/1").send(updateJobFull);
		expect(resp.statusCode).toBe(401);
	});
	test("succeeds: partial data", async () => {
		const resp = await request(app).patch("/jobs/1").send(updateJobPartial).set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toBe(200);
		expect(resp.body).toEqual({
			job: {
				id: 1,
				title: "new title 2",
				salary: 10,
				equity: "0",
				companyHandle: "c1",
			},
		});
	});
	test("fails: invalid data", async () => {
		const resp = await request(app).patch("/jobs/1").send(badJobUpdate).set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toBe(400);
	});
});
/*****************************************DELTE /jobs/:id */
describe("DELETE /jobs/:id", () => {
	test("succeeds: admin", async () => {
		const resp = await request(app).delete("/jobs/1").set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toBe(200);
		expect(resp.body).toEqual({
			deleted: "1",
		});
	});
	test("fails: non-admin", async () => {
		const resp = await request(app).delete("/jobs/1").set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toBe(401);
	});
	test("fails: anon", async () => {
		const resp = await request(app).delete("/jobs/1");
		expect(resp.statusCode).toBe(401);
	});
	test("fails: invalid ID", async () => {
		const resp = await request(app).delete("/jobs/600").set("authorization", `Bearer ${admin1Token}`);
		expect(resp.statusCode).toBe(404);
	});
});
