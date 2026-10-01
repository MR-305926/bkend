//@ts-check

/**
 * 
 * @param {import("express").Response} res 
 * @param {import("../consts/HttpStatus").default} status
 * @param {string} text 
 */
function sendText(res, status, text) {
	res.status(status).setHeader('content-type', 'text/plain').send(text);
}


export default sendText;