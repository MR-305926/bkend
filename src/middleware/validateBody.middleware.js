//@ts-check

import HttpStatus from "../consts/HttpStatus.js";

import { requestMetaAdd, RequestMetaKey } from "../services/requestMeta.service.js";
import send from "../utils/send.js";

/**
 * @param {import("joi").AnySchema} joiSchema
 */
function validateBody(joiSchema) {
	/** 
	 * @type {import("express").RequestHandler} 
	 * @returns {void}
	 */
	return function (req, res, next) {
		let state = joiSchema.validate(req.body);
		if (state.error == undefined) {
			requestMetaAdd(req, RequestMetaKey.state, state);
			next();
		} else {
			send(res, HttpStatus.BAD_REQUEST, state);
		}
	}
}

export default validateBody;

