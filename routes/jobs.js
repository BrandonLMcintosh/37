"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin, ensureLoggedIn } = require("../middleware/auth");
const Job = require("../models/jobs");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / { job } => { job }
 *
 * job should be {id, title, salary, equity, companyHandle }
 *
 * returns same
 *
 * authorization required: admin
 */

router.post("/", ensureLoggedIn, ensureAdmin, async (req, res, next) => {
	try {
		const validator = jsonschema.validate(req.body, jobNewSchema);
		if (!validator.valid) {
			const errors = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errors);
		}
		const job = Job.create(req.body);
		return res.status(201).json({ job });
	} catch (err) {
		return next(err);
	}
});

/** GET / =>
 *
 *   { jobs: [{id, title, salary, equity, companyHandle }, ...]}
 *
 * Can filter on provided search filters:
 *  - title (will case-insensitive, partial matches)
 *  - minSalary (at or above the salary limit)
 *  - hasEquity (finds all non-zero equity jobs in the DB)
 *
 * authorization required: none;
 */

router.get("/", async (req, res, next) => {
	try {
		const jobs = await Job.findAll(req.query);
		return res.json({ jobs });
	} catch (err) {
		return next(err);
	}
});

/** GET /[id]  => {job}
 * Job is {id, title, salary, equity, companyHandle}
 *
 * authorization required: none;
 */

router.get("/:id", async (req, res, next) => {
	try {
		const job = await Job.get(req.params.id);
		return res.json({ job });
	} catch (err) {
		return next(err);
	}
});

/**PATCH /[id] { title, salary, equity } => { job }
 *
 * Patches job data
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.patch("/:id", ensureLoggedIn, ensureAdmin, async (req, res, next) => {
	try {
		const validator = jsonschema.validate(req.body, jobUpdateSchema);
		if (!validator.valid) {
			const errors = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errors);
		}

		const job = await Job.update(req.params.id, req.body);
		return res.json({ job });
	} catch (err) {
		return next(err);
	}
});
/** DELETE /[id]  => { deleted: id }
 *
 * Authorization: admin
 */
router.delete("/:id", ensureLoggedIn, ensureAdmin, async (req, res, next) => {
	try {
		await Job.remove(req.params.id);
		return res.json({ deleted: req.params.id });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
