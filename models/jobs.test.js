"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const { findAll } = require("./company.js");
const Job = require("./jobs");
const { commonAfterAll, commonAfterEach, commonBeforeAll, commonBeforeEach } = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/***********************************create */
describe("create", () => {
	const newJob = {
		id: 4,
		title: "JT4",
		salary: 40,
		equity: 0.2,
		companyHandle: "c1",
	};

	const badJob = {
		id: 5,
		title: "JT5",
		salary: 0,
		equity: 40.0,
		companyHandle: "c2",
	};

	test("succeeds: valid data, no duplication", async () => {
		let job = await Job.create(newJob);
		expect(job).toEqual({
			id: 4,
			title: "JT4",
			salary: 40,
			equity: "0.2",
			companyHandle: "c1",
		});

		const result = await db.query(
			`SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE id = 4`
		);

		expect(result.rows).toEqual([
			{
				id: 4,
				title: "JT4",
				salary: 40,
				equity: "0.2",
				companyHandle: "c1",
			},
		]);
	});

	test("fails: invalid data", async () => {
		try {
			await Job.create(badJob);
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});

	test("fails: duplicate data", async () => {
		try {
			await Job.create(newJob);
			await Job.create(newJob);
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});
/***********************************findAll */
describe("findAll", () => {
	test("succeeds: no filter", async () => {
		let jobs = await Job.findAll();
		expect(jobs).toEqual([
			{
				id: 1,
				title: "JT1",
				salary: 10,
				equity: "0.0",
				companyHandle: "c1",
			},
			{
				id: 2,
				title: "JT2",
				salary: 20,
				equity: "0.1",
				companyHandle: "c2",
			},
			{
				id: 3,
				title: "JT3",
				salary: 30,
				equity: "0.2",
				companyHandle: "c3",
			},
		]);
	});

	test("succeeds: by title", async () => {
		let jobs = await Job.findAll({
			title: "JT2",
		});
		expect(jobs).toEqual([
			{
				id: 2,
				title: "JT2",
				salary: 20,
				equity: "0.1",
				companyHandle: "c2",
			},
		]);
	});

	test("succeeds: by minSalary", async () => {
		let jobs = await Job.findAll({
			minSalary: "30",
		});
		expect(jobs).toEqual([
			{
				id: 3,
				title: "JT3",
				salary: 30,
				equity: "0.2",
				companyHandle: "c3",
			},
		]);
	});

	test("succeeds: by hasEquity", async () => {
		let jobs = await Job.findAll({
			hasEquity: "true",
		});

		expect(jobs).toEqual([
			{ id: 2, title: "JT2", salary: 20, equity: "0.1", companyHandle: "c2" },
			{ id: 3, title: "JT3", salary: 30, equity: "0.2", companyHandle: "c3" },
		]);
	});
});
/***********************************get */
describe("get", () => {
	test("succeeds: exists", async () => {
		let job = await Job.get(1);
		expect(job).toEqual({
			id: 1,
			title: "JT1",
			salary: 10,
			equity: "0.0",
			companyHandle: "c1",
		});
	});

	test("fails: doesn't exist", async () => {
		try {
			await Job.get(600);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});
/***********************************update */
describe("udpate", () => {
	const updateJobFull = {
		title: "new title",
		salary: 100,
		equity: 0.9,
	};

	const updateJobPartial = {
		title: "new title",
	};
	test("succeeds: completed fields", async () => {
		const job = await Job.update(1, updateJobFull);
		expect(job).toEqual({
			id: 1,
			title: "new title",
			salary: 100,
			equity: "0.9",
			companyHandle: "c1",
		});

		const result = await db.query(
			`SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE id = 1`
		);
		expect(result.rows).toEqual([
			{
				id: 1,
				title: "new title",
				salary: 100,
				equity: "0.9",
				companyHandle: "c1",
			},
		]);
	});

	test("succeeds: incomplete fields", async () => {
		const job = await Job.update(1, updateJobPartial);
		expect(job).toEqual({
			id: 1,
			title: "new title",
			salary: 10,
			equity: "0.0",
			companyHandle: "c1",
		});

		const result = await db.query(
			`SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE id = 1`
		);
		expect(result.rows).toEqual([
			{
				id: 1,
				title: "new title",
				salary: 10,
				equity: "0.0",
				companyHandle: "c1",
			},
		]);
	});

	test("fails: no data", async () => {
		try {
			await Job.update(1, {});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});

	test("fails: doesn't exist", async () => {});
});
/***********************************remove */
describe("remove", () => {
	test("succeeds: exists", async () => {
		await Job.remove(1);
		const res = await db.query(`SELECT title FROM jobs WHERE id = 1`);
		expect(res.rows.length).toEqual(0);
	});

	test("fails: doesn't exist", async () => {
		try {
			await Job.remove("1000");
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});
