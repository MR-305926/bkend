//@ts-check

import Joi from "joi";
import HttpStatus from "../consts/HttpStatus.js";
import Credential from "../entities/Credential.js";
import validateBody from "../middleware/validateBody.middleware.js";
import {
	pagemarkerAddRestricted as myPagemarkerAddRestrictedService,
	pagemarkerAdd as myPagemarkerAddService,
	pagemarkerGet as myPagemarkerGetService,
	pagemarkerRemove as myPagemarkerRemoveService,
	pagemarkerUpdate as myPagemarkerUpdateService
} from "../services/book.service.js";
import { normalizeAnswer, requestMetaGet, RequestMetaKey } from "../services/requestMeta.service.js";
import ObjectId from "../utils/ObjectIdJoiSchemaFactory.js";
import readEnv, { ENVKEY } from "../utils/readEnv.js";
import send from "../utils/send.js";
import stripVersion from "../utils/stripVersion.js";

const maxQueryBatchSize = Number(readEnv(ENVKEY.data_maxQueryBatchSize));

//TODO implement recommend book

const nameofBookEntity = "Book";

const myPagemarkerAddValidator = validateBody(Joi.object({
	book: ObjectId().required()
}).required());
/**
 * @type {import("express").RequestHandler}
 * @returns {void}
 */
function addMyPagemarker(req, res) {
	myPagemarkerAddValidator(req, res, () => {
		let username = requestMetaGet(req, RequestMetaKey.session_username);
		let id_book = req.body.book;
		if (username == undefined) {
			send(res, HttpStatus.UNAUTHORIZED);
		} else {
			myPagemarkerAddService(
				username, id_book,
				() => send(res, HttpStatus.BAD_REQUEST, normalizeAnswer(req, nameofBookEntity)),
				() => send(res, HttpStatus.UNAUTHORIZED)
			).then(
				(value) => { if (value != undefined) send(res, HttpStatus.OK, normalizeAnswer(req, stripVersion(value))); },
				(reason) => { reason; send(res, HttpStatus.CONFLICT); }
			);

		}
	});
}

const maxPagemarkerForNotPremium = Number(readEnv(ENVKEY.maxPagemarkerForNotPremium));
/**
 * @type {import("express").RequestHandler}
 * @returns {void}
 */
function addMyPagemarkerRestricted(req, res) {
	myPagemarkerAddValidator(req, res, () => {
		let username = requestMetaGet(req, RequestMetaKey.session_username);
		let id_book = req.body.book;
		if (username == undefined) {
			send(res, HttpStatus.UNAUTHORIZED);
		} else {
			myPagemarkerAddRestrictedService(
				username, id_book, maxPagemarkerForNotPremium,
				() => send(res, HttpStatus.FORBIDDEN),
				() => send(res, HttpStatus.BAD_REQUEST, normalizeAnswer(req, nameofBookEntity)),
				() => send(res, HttpStatus.UNAUTHORIZED)
			).then(
				(value) => { if (value != undefined) send(res, HttpStatus.OK, normalizeAnswer(req, stripVersion(value))); },
				(reason) => { reason; send(res, HttpStatus.CONFLICT); }
			);

		}
	});
}

const myPagemarkerGetValidator_where = (() => {
	let criteria = [
		Joi.object({
			name: Joi.string().valid("book").required(),
			value: ObjectId().required()
		}),
		Joi.object({
			name: Joi.string().valid("marker").required(),
			floor: Joi.number().min(0),
			roof: Joi.alternatives().conditional(Joi.ref("floor"), {
				is: Joi.number().required(),
				then: Joi.number().min(Joi.ref("floor")),
				otherwise: Joi.number().min(0)
			})
		}),
		Joi.object({
			name: Joi.string().valid("pageCount").required(),
			floor: Joi.number().min(1),
			roof: Joi.alternatives().conditional(Joi.ref("floor"), {
				is: Joi.number().required(),
				then: Joi.number().min(Joi.ref("floor")),
				otherwise: Joi.number().min(1)
			})
		})
	];
	let ans = Joi.array().items(Joi.alternatives().try(...criteria)).unique((a, b) => a.name == b.name);
	return ans;
})();
const myPagemarkerGetValidator = (() => {
	let keys = ["book", "marker", "pageCount"];
	let keySchema = Joi.string().valid(...keys);

	return validateBody(Joi.object({
		selector: Joi.array().items(keySchema).unique(),
		where: myPagemarkerGetValidator_where,
		skip: Joi.number().min(1),
		amount: Joi.number().min(1).max(maxQueryBatchSize).required()
	}).required());
})();
/**
 * @type {import("express").RequestHandler}
 * @returns {void}
 */
function getMyPagemarker(req, res) {
	myPagemarkerGetValidator(req, res, () => {
		Credential.findOne({ username: requestMetaGet(req, RequestMetaKey.session_username) }, ["_id"]).exec().
			then(
				(credential) => {
					if (credential != null) {
						let credential_id = (typeof credential._id == 'string') ? credential._id : String(credential._id);
						req.body.where
						myPagemarkerGetService(req.body, credential_id).then(
							(value) => send(res, HttpStatus.OK, normalizeAnswer(req, value))
						)
					} else {
						send(res, HttpStatus.UNAUTHORIZED);
					}
				},
				() => send(res, HttpStatus.UNAUTHORIZED)
			);
	});
}

const myPagemarkerUpdateValidator = validateBody(Joi.object({
	id: ObjectId().required(),
	marker: Joi.number().min(1).required()
}).required());
/**
 * @type {import("express").RequestHandler}
 * @returns {void}
 */
function updateMyPagemarker(req, res) {
	myPagemarkerUpdateValidator(req, res, () => {
		let { id, marker } = req.body;
		myPagemarkerUpdateService(id, marker).then(
			(value) => send(res, HttpStatus.OK, normalizeAnswer(req, value)),
			(markerTooBig) => {
				if (markerTooBig) {
					send(res, HttpStatus.BAD_REQUEST, normalizeAnswer(req, "marker too big"));
				} else {
					send(res, HttpStatus.BAD_REQUEST, normalizeAnswer(req, nameofBookEntity));
				}
			}
		)
	});
}

const myPagemarkerRemoveValidator = validateBody(Joi.object({
	where: myPagemarkerGetValidator_where,
	skip: Joi.number().min(1),
	amount: Joi.number().valid(1)
}));
/**
 * @type {import("express").RequestHandler}
 * @returns {void}
 */
function removeMyPagemarker(req, res) {
	myPagemarkerRemoveValidator(req, res, () => {
		Credential.findOne({ username: requestMetaGet(req, RequestMetaKey.session_username) }, ["_id"]).exec().
			then(
				(credential) => {
					if (credential != null) {
						let credential_id = (typeof credential._id == 'string') ? credential._id : String(credential._id);
						myPagemarkerRemoveService(req.body, credential_id).then(
							(report) => send(res, HttpStatus.OK, normalizeAnswer(req, report))
						)
					} else {
						send(res, HttpStatus.UNAUTHORIZED);
					}
				},
				() => send(res, HttpStatus.UNAUTHORIZED)
			);
	});
}

export {
	addMyPagemarker,
	addMyPagemarkerRestricted,
	getMyPagemarker,
	removeMyPagemarker,
	updateMyPagemarker
};

