//@ts-check

/**
 * @param {ENVKEY} key 
 */
function readEnv(key) {
	let ans = process.env[key];
	if (!ans) throw new Error(`process variable ${key} is not defined`);
	return ans;
}

/**
 * @enum {string}
 */
const ENVKEY = {
	port: "port",
	jwtsecret: "jwtsecret",
	cors_origin: "cors_origin",
	connectionString: "connectionString",
	data_maxQueryBatchSize: "data_maxQueryBatchSize",
	maxPagemarkerForNotPremium: "maxPagemarkerForNotPremium",
	cloudinary_name: "cloudinary_name",
	cloudinary_token: "cloudinary_token",
	cloudinary_secret: "cloudinary_secret",
	cloudinary_maxImageSizeBytes: "cloudinary_maxImageSizeBytes"
};

export default readEnv;
export { ENVKEY };

