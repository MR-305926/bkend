//@ts-check

import { requestMetaGet, RequestMetaKey } from "../services/requestMeta.service.js";

/**
 * @param {import("../entities/Credential.js").UserRole[]} allowedRoles
 */
function allowRouteFor(allowedRoles) {
	/** 
	 * @type {import("express").RequestHandler} 
	 * @returns {void}
	 */
	return function (req, res, next) {
		let role = requestMetaGet(req, RequestMetaKey.session_role);
		if ((role != undefined) && (allowedRoles.includes(role))) {
			next();
			return;
		}
		next('router');
	}
}

export default allowRouteFor;
