//@ts-check

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import dateIsLesser from "../utils/dateIsLesser.js";

class SecretSource {
	/** @type {Promise<string>} */
	// @ts-ignore WARN init on first call to this.get()
	#promise;
	#rounds;
	/** @type {Date | null} */
	#expiresAt;

	/**
	 * @param {number} rounds
	 */
	constructor(rounds) {
		this.#rounds = rounds;
		this.#expiresAt = null;
		this.#refresh();
	}

	#refresh() {
		this.#promise = bcrypt.genSalt(this.#rounds);
		let expiryDate = new Date();
		expiryDate.setHours(expiryDate.getHours() + 1);
		this.#expiresAt = expiryDate;
	}

	get() {
		if (this.#expiresAt != null && dateIsLesser(this.#expiresAt, new Date())) {
			this.#expiresAt = null;
			this.#refresh();
		}
		return this.#promise;
	}
}
const secretSource = new SecretSource(20);

/**
 * @param {string} token
 * @returns {Promise<string | import("jsonwebtoken").JwtPayload | null>}
 */
function decode(token) {
	return new Promise((resolve, reject) => {
		secretSource.get().then((secret) => {
			try {
				resolve(jwt.verify(token, secret));
			} catch (whatever) {
				resolve(null);
			}
		});
	});
}

/**
 * @param {any} obj
 */
async function sign(obj) {
	if (obj) {
		let secret = await secretSource.get();
		try {
			if (secret) {
				return jwt.sign(obj, secret);
			}
		} catch (/** @type {any} */whatev) {
			if (whatev & whatev.message) {
				console.error(whatev.message);
			}
		}
	}
	return null;
}

export {
	decode,
	sign
};

