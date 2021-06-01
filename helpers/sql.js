const { BadRequestError } = require("../expressError");

/* Generic function.
 * Creates a singular SQL query string from keys in a data object.
 *
 * Pass in a jsToSql object with pre-defined sql column names to use,
 * or default to the keys passed in from the data object.
 *
 * returns object containing the SQL query string and values to set for the query variables.
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
	const keys = Object.keys(dataToUpdate);
	if (keys.length === 0) throw new BadRequestError("No data");

	// {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
	const cols = keys.map((colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`);

	return {
		setCols: cols.join(", "),
		values: Object.values(dataToUpdate),
	};
}

module.exports = { sqlForPartialUpdate };
