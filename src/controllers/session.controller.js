//@ts-check

import HttpStatus from "../consts/HttpStatus.js";

import send from "../utils/send.js";

import Joi from "joi";
import { UserRole } from "../entities/Credential.js";
import validateBody from "../middleware/validateBody.middleware.js";
import {
	changeAccountRole,
	changePassword,
	deleteAccount,
	loginSchema,
	login as loginService,
	passwordSchema,
	signUpSchema,
	signUp as signUpService
} from "../services/credential.service.js";
import { normalizeAnswer, requestMetaGet, RequestMetaKey } from "../services/requestMeta.service.js";

/** 
 * @type {import("express").RequestHandler} 
 * @returns {void}
 */
function login(req, res) {
	loginService(req.body).then(
		(token) => {
			let ans = requestMetaGet(req, RequestMetaKey.state);
			ans.value = token;
			send(res, HttpStatus.OK, normalizeAnswer(req, token));
		},
		() => {
			send(res, HttpStatus.UNAUTHORIZED)
		}
	);
}

/** 
 * @type {import("express").RequestHandler} 
 * @returns {void}
 */
function signUp(req, res) {
	signUpService(req.body).then(
		(token) => {
			let ans = requestMetaGet(req, RequestMetaKey.state);
			ans.value = token;
			send(res, HttpStatus.CREATED, ans);
		},
		() => send(res, HttpStatus.CONFLICT)
	);
}

const changeMyPasswordValidator = validateBody(Joi.object({ password: passwordSchema }).required());
/** 
 * @type {import("express").RequestHandler} 
 * @returns {void}
 */
function changeMyPassword(req, res) {
	changeMyPasswordValidator(req, res, () => {
		let username = requestMetaGet(req, RequestMetaKey.session_username);
		if (username == undefined) {
			send(res, HttpStatus.UNAUTHORIZED);
		} else {
			changePassword(username, req.body.password).then(
				(value) => send(res, HttpStatus.NO_CONTENT),
				(reason) => send(res, HttpStatus.NOT_FOUND)
			);
		}
	});
}

/** 
 * @type {import("express").RequestHandler} 
 * @returns {void}
 */
function upgradeMyAccount(req, res) {
	if (requestMetaGet(req, RequestMetaKey.session_role) == UserRole.PREMIUM) {
		send(res, HttpStatus.NO_CONTENT);
	} else {
		let username = requestMetaGet(req, RequestMetaKey.session_username);
		if (username != undefined) {
			changeAccountRole(username, UserRole.PREMIUM).then(
				(value) => {
					if (value != null) {
						send(res, HttpStatus.OK, normalizeAnswer(req, value));
					} else {
						send(res, HttpStatus.FORBIDDEN)
					}
				},
				() => send(res, HttpStatus.UNAUTHORIZED)
			);
		} else {
			send(res, HttpStatus.UNAUTHORIZED);
		}
	}
}

/** 
 * @type {import("express").RequestHandler} 
 * @returns {void}
 */
function deleteMyAccount(req, res) {
	let username = requestMetaGet(req, RequestMetaKey.session_username);
	if (username == undefined) {
		send(res, HttpStatus.UNAUTHORIZED);
	} else {
		deleteAccount(username).then(
			() => send(res, HttpStatus.NO_CONTENT),
			() => send(res, HttpStatus.NOT_FOUND)
		);
	}
}

export {
	changeMyPassword,
	deleteMyAccount,
	login,
	loginSchema,
	signUp,
	signUpSchema,
	upgradeMyAccount
};

