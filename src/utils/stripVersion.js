//@ts-check

/**
 * @param {import("mongoose").Document<any,any,any,any,any>} mongoDocument
 */
function stripVersion(mongoDocument) {
	//WARN magic assignment
	//@ts-ignore
	let ans = mongoDocument._doc;
	ans.__v = undefined;
	return ans;
}

export default stripVersion;
