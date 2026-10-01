//@ts-check

/**
 * @param {Object} mongoError
 * @param {number} mongoError.code
 */
function isKeyConflict(mongoError) {
	if (mongoError.code == 11000) {
		return true;
	} else {
		return false;
	}
}

export default isKeyConflict;