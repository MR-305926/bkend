//@ts-check

import mongoose from "mongoose";
import Book from "../entities/Book.js";
import Credential from "../entities/Credential.js";
import Pagemarker from "../entities/Pagemarker.js";
import stripVersion from "../utils/stripVersion.js";
import { parseFilter } from "./Entity.js";

//TODO recommend book

/**
 * @param {string} username
 * @param {string} id_book
 * @param {() => void} on_bookFail
 * @param {() => void} on_credentialFail
 */
function pagemarkerAdd(username, id_book, on_bookFail, on_credentialFail) {
	return Credential.findOne({ username }, ["_id"]).exec().then((credential) => {
		if (credential != null) {
			return Book.customQuery.findOne({ _id: id_book }, ["_id", "pageCount"]).exec().then((book) => {
				if (book != null) {
					let credential_id = credential.id;
					let book_id = book.id;
					//WARN assumes Book.pageCount exists
					// @ts-ignore
					let bookPageCount = book.pageCount;
					return solve_pagemarkerAdd(book_id, credential_id, bookPageCount);
				} else {
					on_bookFail();
				}
			})
		} else {
			on_credentialFail();
		}
	});
}

/**
 * @param {string} username
 * @param {string} id_book
 * @param {number} max
 * @param {() => void} on_overMax 
 * @param {() => void} on_bookFail
 * @param {() => void} on_credentialFail
 */
function pagemarkerAddRestricted(username, id_book, max, on_overMax, on_bookFail, on_credentialFail) {
	return Credential.findOne({ username }, ["_id"]).exec().then((credential) => {
		if (credential != null) {
			let credential_id = credential.id;
			return Pagemarker.customQuery.countDocuments({ "reader": credential_id }, { limit: max + 1 }).exec().then((amount) => {
				if (amount < max) {
					return Book.customQuery.findOne({ _id: id_book }, ["_id", "pageCount"]).exec().then((book) => {
						if (book != null) {
							let book_id = book.id;
							//WARN assumes Book.pageCount exists
							// @ts-ignore
							let bookPageCount = book.pageCount;
							return solve_pagemarkerAdd(book_id, credential_id, bookPageCount);
						} else {
							on_bookFail();
						}
					});
				} else {
					on_overMax();
				}
			});
		} else {
			on_credentialFail();
		}
	});
}

/**
 * @param {string} book_id
 * @param {string} id_credential
 * @param {number} bookPageCount
 */
function solve_pagemarkerAdd(book_id, id_credential, bookPageCount) {
	return Pagemarker.customQuery.insertOne({ keys: { book: book_id, reader: id_credential }, marker: 0, pageCount: bookPageCount });
}

/**
 * @param {Object} param
 * @param {string[]} param.selector
 * @param {Object[]} param.where
 * @param {string} param.where.name
 * @param {number | Date} [param.where.floor]
 * @param {number | Date} [param.where.roof]
 * @param {string} [param.where.value]
 * @param {number} [param.skip]
 * @param {number} [param.amount]
 * @param {string} credential_id
 */
function pagemarkerGet(param, credential_id) {
	let filter = param.where != undefined ? (() => {
		param.where.push({ name: "reader", "value": credential_id });
		return parseFilter(param.where)
	})() : { "reader": credential_id };

	let q = Pagemarker.customQuery.find(filter);
	if (param.selector != undefined) {
		if (param.selector.length > 0) {
			q = q.select(param.selector);
		} else {
			q = q.select(["book", "marker", "pageCount"]);
		}
	}

	if (param.skip != undefined) q = q.skip(param.skip);
	if (param.amount != undefined) q = q.limit(param.amount);
	return new Promise((resolve, reject) => {
		q.exec().then(
			(value) => resolve(value.map(stripVersion))
		)
	});
}

/**
 * reject? marker > max : !pagemarker.exists
 * @param {import("mongoose").Types.ObjectId} id
 * @param {number} marker
 * @returns {Promise<Object>}
 */
function pagemarkerUpdate(id, marker) {
	return new Promise(async (resolve, reject) => {
		let pagemarker = await Pagemarker.customQuery.findOne({ "book": new mongoose.Types.ObjectId(id) }).exec();
		if (pagemarker != null) {
			//WARN assert Pagemarker.pageCount exists
			// @ts-ignore
			if (!(marker > pagemarker.pageCount)) {
				// @ts-ignore
				pagemarker.marker = marker;
				pagemarker.save();
				resolve(stripVersion(pagemarker));
				return;
			} else {
				reject(true);
			}
		} else {
			reject(false);
		}
	});
}

/**
 * @param {Object} param
 * @param {Object[]} param.where
 * @param {string} param.where.name
 * @param {number | Date} [param.where.floor]
 * @param {number | Date} [param.where.roof]
 * @param {string} [param.where.value]
 * @param {number} [param.skip]
 * @param {number} [param.amount]
 * @param {string} credential_id
 */
function pagemarkerRemove(param, credential_id) {
	let filter = param.where != undefined ? (() => {
		param.where.push({ name: "reader", "value": credential_id });
		return parseFilter(param.where)
	})() : { "reader": credential_id };

	let q = Pagemarker.customQuery.deleteMany(filter);

	if (param.skip != undefined) q = q.skip(param.skip);
	if (param.amount != undefined) q = q.limit(param.amount);

	return q.exec();
}

/**
 * @param {Object} param
 * @param {Object[]} param.where
 * @param {string} param.where.name
 * @param {number | Date} [param.where.floor]
 * @param {number | Date} [param.where.roof]
 * @param {string} [param.where.value]
 * @param {number} [param.skip]
 * @param {number} [param.amount]
 */
function bookRemove(param) {
	let filter = (param.where != undefined) ?
		parseFilter(param.where) :
		undefined;

	let q = Book.customQuery.find(filter, ["_id"]);

	if (param.skip != undefined) q = q.skip(param.skip);
	if (param.amount != undefined) q = q.limit(param.amount);

	return new Promise((resolve, reject) => {
		q.exec().then((books) => {
			/** @type {string[]} */
			let bookIds;
			{
				bookIds = books.map((value) => {
					let ans = value._id; if (typeof ans != 'string') return String(ans); return ans;
				});
			}
			//clear useless book data
			books = [];
			Book.customQuery.deleteMany({ "_id": { $in: bookIds } }).exec().then(
				(bookReport) => Pagemarker.customQuery.deleteMany({ "book": { $in: bookIds } }).exec().then(
					(pagemarkerReport) => resolve({ book: bookReport, pagemarker: pagemarkerReport }),
					reject
				),
				reject
			),
				reject
		},
			reject
		);
	});
}

export {
	bookRemove,
	pagemarkerAdd, pagemarkerAddRestricted, pagemarkerGet, pagemarkerRemove, pagemarkerUpdate
};

