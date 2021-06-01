const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

const dataToUpdate = {
	data1: "data1",
	data2: "data2",
	data3: "data3",
};

//intentionally leaving out data3 to test that
//it defaults to data3 if no alternative is supplied
const jsToSql = {
	data1: "data_1",
	data2: "data_2",
};

const badData = {};

testGoodData = describe("sqlForPartialUpdate", () => {
	test("Good data w/ a default operation", () => {
		const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);
		expect(setCols).toEqual('"data_1"=$1, "data_2"=$2, "data3"=$3');
		expect(values).toEqual(["data1", "data2", "data3"]);
	});

	test("sending no data to the function", () => {
		expect(() => {
			sqlForPartialUpdate(badData, jsToSql);
		}).toThrow("No data");
	});
});
