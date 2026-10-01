//@ts-check

import HttpStatus from "../consts/HttpStatus.js";

const empty = "";

/**
 * assert value? ^ error?
 * @param {import("express").Response} res
 * @param {HttpStatus} status
 * @param {Object} [body]
 * @param {Object} [body.value]
 * @param {Object} [body.error]
 * @param {Object} [body.warning]
 */
function send(res, status, body) {
	if (body != undefined) {
		let ans = {};
		if (body.value != undefined) ans["value"] = body.value;
		if (body.error != undefined) ans["error"] = body.error;
		if (body.warning != undefined) ans["warning"] = body.warning;
		res.status(status).send(ans).end();
	} else {
		res.status(status).send(empty).end();
	}
}

export default send;