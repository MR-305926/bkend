//@ts-check

/**
 * @enum {string}
 */
const RequestMetaKey = {
	"state": "state",
	"session_username": "session_username",
	"session_role": "session_role"
}

/**
 * @param {import("express").Request} req
 * @param {RequestMetaKey} key
 * @param {any} value
 */
function requestMetaAdd(req, key, value) {
	if (value) {
		//WARN magic assignment
		//@ts-ignore
		if (!req.meta) req.meta = {};
		//WARN magic assignment
		//@ts-ignore
		req.meta[key] = value;
	}
}

/**
 * @param {import("express").Request} req
 * @param {RequestMetaKey} key
 */
function requestMetaGet(req, key) {
	//WARN magic read
	//@ts-ignore
	if (req.meta) {
		//WARN magic read
		//@ts-ignore
		let value = req.meta[key];
		if (value != undefined) {
			return structuredClone(value);
		}
	}
	return undefined;
}

/**
 * @param {import("express").Request} req
 * @param {string | string[] | Object | Object[]} ans
 */
function normalizeAnswer(req, ans) {
	let body = requestMetaGet(req, RequestMetaKey.state);
	if (body == undefined) {
		body = { value: ans };
	} else {
		body.value = ans;
	}
	return body;
}

export { normalizeAnswer, requestMetaAdd, requestMetaGet, RequestMetaKey };

