//@ts-check

import HttpStatus from "../consts/HttpStatus.js";
import Book from "../entities/Book.js";
import validateBody from "../middleware/validateBody.middleware.js";
import { bookRemove as bookRemoveService } from "../services/book.service.js";
import { normalizeAnswer } from "../services/requestMeta.service.js";
import send from "../utils/send.js";

const removeBookValidator = validateBody(Book.getSchema);
/**
 * @type {import("express").RequestHandler}
 * @returns {void}
 */
function removeBook(req, res) {
	removeBookValidator(req, res, () => {
		bookRemoveService(req.body).then(
			(value) => send(res, HttpStatus.OK, normalizeAnswer(req, value)),
			() => send(res, HttpStatus.INTERNAL_SERVER_ERROR)
		);
	});
}


export { removeBook };

