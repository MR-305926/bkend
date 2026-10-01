//@ts-check

import HttpStatus from "../consts/HttpStatus.js";
import { uploadImageStream } from "../services/Image.js";
import { normalizeAnswer } from "../services/requestMeta.service.js";
import send from "../utils/send.js";
import sendText from "../utils/sendText.js";
import isMimeType from "../utils/validators/isMimeType.js";

//TODO

/**
 * @type {import("express").RequestHandler}
 * @returns {void}
 */
function uploadImage(req, res) {
	let rawType = req.headers["content-type"];
	if (rawType != undefined && isMimeType(rawType)) {
		let fileKind = rawType.split("/")[0];
		if (fileKind == "image") {
			req.pipe(uploadImageStream((err, callResult) => {
				if (err != undefined) {
					send(res, HttpStatus.BAD_GATEWAY);
				} else if (callResult != undefined) {
					send(res, HttpStatus.OK, normalizeAnswer(req, callResult));
				} else {
					send(res, HttpStatus.SERVICE_UNAVAILABLE);
				}
			}));
			return;
		}
	}
	send(res, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
}


export { uploadImage };

