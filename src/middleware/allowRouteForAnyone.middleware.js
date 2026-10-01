//@ts-check

import HttpStatus from "../consts/HttpStatus.js";

import send from "../utils/send.js";

import { requestMetaGet, RequestMetaKey } from "../services/requestMeta.service.js";

/**@param {import("express").Response} res */
function transparentRejectUnauthorized(res) { return send(res, HttpStatus.UNAUTHORIZED); }

/**@param {import("express").Response} res */
function transparentRejectForbidden(res) { return send(res, HttpStatus.FORBIDDEN); }

/**@param {import("express").Response} res */
function obscureReject(res) { return send(res, HttpStatus.NOT_FOUND); }

/**
 * @param {boolean} hide
 */
function allowRouteFor(hide = true) {
	//WARN assumes router will hide all "path not found" response body
	/** @type {(res:import("express").Response) => void} */
	let rejectUnauthorized;
	/** @type {(res:import("express").Response) => void} */
	let rejectForbidden;
	if (hide) {
		rejectUnauthorized = obscureReject;
		rejectForbidden = obscureReject;
	} else {
		rejectUnauthorized = transparentRejectUnauthorized;
		rejectForbidden = transparentRejectForbidden;
	}

	//TODO conditionally only require that the user is authenticated depending on the length of allowedRoles

	/** 
	 * @type {import("express").RequestHandler} 
	 * @returns {void}
	 */
	return function (req, res, next) {
		let role = requestMetaGet(req, RequestMetaKey.session_role);
		if (role != undefined) {
			next();
			return;
		}
		rejectUnauthorized(res);
	}
}

export default allowRouteFor;