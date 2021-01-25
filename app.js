const express 		= require("express");
const cors 			= require("cors");
const app 			= express();
const helmet 		= require("helmet");
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const articleRoutes = require("./controller");
/*****************************************/
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/fd", articleRoutes);
app.use(awsServerlessExpressMiddleware.eventContext());
app.use((req, res) => {
	const responseObj = {
		errors: [
			{
				status: 404,
				title: "not found",
				detail: "nothing found"
			}
		]
	};
	res.status(404).json(responseObj);
});

module.exports = app;