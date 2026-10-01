//@ts-check

import HttpStatus from "../consts/HttpStatus.js";
import validateBody from "../middleware/validateBody.middleware.js";
import { normalizeAnswer, requestMetaGet, RequestMetaKey } from "../services/requestMeta.service.js";
import isKeyConflict from "../utils/isKeyConflict.js";
import send from "../utils/send.js";

/**
 * @param {import("../services/Entity.js").default} entity
 */
function add(entity) {
	let validator = validateBody(entity.insertSchema);
	/**
	 * @type {import("express").RequestHandler}
	 * @returns {void}
	 */
	return function (req, res) {
		let input = Array.isArray(req.body) ?
			req.body : [req.body];
		validator(req, res, () => entity.
			insert(input).
			then(
				(ans) => send(res, HttpStatus.OK, normalizeAnswer(req, ans)),
				(reason) => {
					if (isKeyConflict(reason)) {

						let conflicts = reason.writeErrors.
							map(
								/** @param {{err:{op:Object}}} value */
								(value) => {
									let k;
									let buffer = Object.
										fromEntries(
											Object.entries(value.err.op).
												filter((entry) => {
													k = entry[0];
													return k != "__v" && k != "_id";
												})
										);
									return buffer;
								}
							);
						let state = requestMetaGet(req, RequestMetaKey.state);
						state.value = undefined;
						state.error = conflicts;
						send(res, HttpStatus.CONFLICT, state);
					}
				}
			)
		);
	}
}

/**
 * @param {import("../services/Entity.js").default} entity
 */
function get(entity) {
	let validator = validateBody(entity.getSchema);
	/**
	 * @type {import("express").RequestHandler}
	 * @returns {void}
	 */
	return function (req, res) {
		validator(req, res, () => entity.
			get(req.body).
			then((ans) => send(res, HttpStatus.OK, normalizeAnswer(req, ans)))
		);
	}
}

/**
 * @param {import("../services/Entity.js").default} entity
 */
function remove(entity) {
	let validator = validateBody(entity.removeSchema);
	/**
	 * @type {import("express").RequestHandler}
	 * @returns {void}
	 */
	return function (req, res) {
		validator(req, res, () => entity.
			remove(req.body).
			then((ans) => send(res, HttpStatus.OK, normalizeAnswer(req, ans)))
		);
	}
}

export { add, get, remove };

