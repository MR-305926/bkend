//@ts-check

import { decode as jwtDecode } from "../services/jwt.service.js";
import { requestMetaAdd, RequestMetaKey } from "../services/requestMeta.service.js";

/**
 * @param {string} authorization
 */
function parseAuthorization(authorization) {
	let authorizationParts = authorization.split(" ");
	return authorizationParts.length > 0 ? authorizationParts[authorizationParts.length - 1] : undefined;
}

//TODO implement
/**
 * TODO implement
 * @type {import("express").RequestHandler}
 * @returns {Promise<void>} 
 */
async function authorize(req, res, next) {
	let authorization = req.headers.authorization;

	if (authorization != undefined) {
		let token = parseAuthorization(authorization);
		if (token != undefined) {
			let payload = await jwtDecode(token);
			if (payload != null && typeof payload != 'string') {
				requestMetaAdd(req, RequestMetaKey.session_username, payload.username);
				requestMetaAdd(req, RequestMetaKey.session_role, payload.role);
			}
		}
	}
	next();
}

export default authorize;