//@ts-check

import { extension } from "mime-types";

/**
 * @param {string} mimetype
 */
function isMimeType(mimetype) {
	return ((typeof extension(mimetype)) == 'string')
}

export default isMimeType;