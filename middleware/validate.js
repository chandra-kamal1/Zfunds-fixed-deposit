const { validationResult } = require("express-validator/check");
/*************************************************************/
const validate = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		let errorsArray = errors.array();
		errorsArray = errorsArray
			.filter(error => {
				return (
					!error.msg.startsWith("invalid") || !error.msg.startsWith("Invalid")
				);
			})
			.map(error => {
				return {
					status: 422,
					title: "unprocessable entity",
					detail: error.msg
				};
			});
		return res.status(422).json({ success: false, errors: errorsArray });
	}
	next();
};
/******************************************************************/
module.exports = validate;