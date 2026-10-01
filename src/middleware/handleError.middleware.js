//@ts-check

import HttpStatus from "../consts/HttpStatus.js";

/**
 * @type {import("express").ErrorRequestHandler}
 * @returns {void}
 */
function handleError(err, req, res, next) {
	let today = new Date();
	console.error(err);
	res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR).end();

	let second = today.getUTCSeconds();
	let minute = today.getUTCMinutes();
	let hour = today.getUTCHours();
	let day = today.getUTCDate();
	let month = today.getUTCMonth() + 1;
	let year = today.getUTCFullYear();

	console.error({
		k: { second, minute, hour, day, month, year },
		v: err ? "???" : JSON.stringify({ err, req })
	});

	next(err);
}

export default handleError;