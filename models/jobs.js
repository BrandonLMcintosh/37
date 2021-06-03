"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs */

class Job {
	/** Create a job (from data), update db, return new job data.
	 *
	 * data should be {id, title, salary, equity, companyHandle }
	 *
	 * returns {id, title, salary, equity, companyHandle }
	 *
	 * throws BadRequestError if job already in DB
	 */
	static async create({ id, title, salary, equity, companyHandle }) {
		const duplicateCheck = await db.query(
			`SELECT id
            FROM jobs
            WHERE id = $1`,
			[id]
		);
		if (duplicateCheck.rows[0]) throw new BadRequestError(`Duplicate job: ${id}`);
		if (typeof title !== "string") throw new BadRequestError(`Invalid title: ${title}`);
		if (typeof salary !== "number" || salary < 0) throw new BadRequestError(`Invalid salary: ${salary}`);
		if (typeof equity !== "number" || equity < 0.0 || equity > 1.0) throw new BadRequestError(`Invalid equity: ${equity}`);
		const companyRes = await db.query(
			`SELECT handle
			FROM companies
			WHERE handle = $1`,
			[companyHandle]
		);
		if (!companyRes.rows[0]) throw new BadRequestError(`Invalid company handle: ${companyHandle}`);

		const result = await db.query(
			`INSERT INTO jobs
            (id, title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
			[id, title, salary, equity, companyHandle]
		);

		const job = result.rows[0];

		return job;
	}

	/** Find all jobs
	 *
	 * Returns [{id, title, salary, equity, companyHandle}, ...]
	 *
	 * if a query is passed in:
	 *      -Test the query string for three values: title, minSalary, hasEquity
	 *      -If no query found, returns all jobs with all information
	 *      -If title but no equity / minSalary, return all jobs with that string in the title
	 *      -If hasEquity, return all jobs with a non-zero amount of equity
	 *      -If minSalary, return all jobs with a salary at-or-above the salary limit
	 */
	static async findAll(query = null) {
		let jobsRes;
		if (query && (query.title || query.minSalary || query.hasEquity)) {
			//Test the query passed in for available values. Set them equal to their corresponding SQL clause
			if (query.hasEquity === "true") {
				query.hasEquity = true;
			} else {
				query.hasEquity = false;
			}

			try {
				query.minSalary = Number(query.minSalary);
			} catch (err) {
				next(err);
			}
			const titleQuery = query.title ? `title LIKE '%${query.title}%'` : null;
			const minSalaryQuery = query.minSalary ? `salary >= ${query.minSalary}` : null;
			const hasEquityQuery = query.hasEquity ? `equity > 0.0` : null;
			const jobsResQuery = `SELECT id, title, salary, equity, company_handle AS "companyHandle"
				FROM jobs
				WHERE ${titleQuery ? titleQuery : ""}
				${titleQuery && (minSalaryQuery || hasEquityQuery) ? "AND" : ""} ${minSalaryQuery ? minSalaryQuery : ""}
				${minSalaryQuery && hasEquityQuery ? "AND" : ""}  ${hasEquityQuery ? hasEquityQuery : ""}
				ORDER BY salary`;
			jobsRes = await db.query(jobsResQuery);
		} else {
			jobsRes = await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            ORDER BY salary`);
		}
		return jobsRes.rows;
	}

	/** Given a job id, return data about job.
	 *
	 * Returns { id, title, salary, equity, companyHandle }
	 *
	 * Throws NotFoundError if not found
	 */

	static async get(id) {
		const jobRes = await db.query(
			`SELECT id, title, salary, equity, company_handle AS "companyHandle"
			FROM jobs
			WHERE id = $1`,
			[id]
		);

		const job = jobRes.rows[0];

		if (!job) throw new NotFoundError(`No job: ${id}`);

		return job;
	}

	/** Update the job data with 'data'.
	 *
	 * This is a 'partial update' --- it's fine if the data doesn't contain all the fields; this only changes provided ones.
	 *
	 * data can include: { title, salary, equity }
	 *
	 * returns { id, title, salary, equity, companyHandle }
	 *
	 * throws NotFoundError if not found
	 *
	 * throws BadRequestError if fields are invalid / not the correct data type
	 */

	static async update(id, data) {
		const { setCols, values } = sqlForPartialUpdate(data, {});
		const idVarIdx = "$" + (values.length + 1);
		const querySql = `UPDATE jobs SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING id,
                  title,
                  salary, 
                  equity, 
                  company_handle AS "companyHandle"`;
		const result = await db.query(querySql, [...values, id]);
		const job = result.rows[0];

		if (!job) throw new NotFoundError(`No job: ${id}`);

		return job;
	}

	/** Delete given job from database; returns undefined
	 *
	 * throws NotFoundError if company not found.
	 */

	static async remove(id) {
		const result = await db.query(
			`DELETE FROM jobs
            WHERE id = $1
            RETURNING id`,
			[id]
		);
		const job = result.rows[0];

		if (!job) throw new NotFoundError(`No job: ${id}`);
	}
}

module.exports = Job;
