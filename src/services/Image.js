//@ts-check

import Cloudinary from "cloudinary";
import mongoose from "mongoose";
import readEnv, { ENVKEY } from "../utils/readEnv.js";

const Image = (() => {
	let schema = new mongoose.Schema({
		uid: { type: String, required: true, unique: true }
	});

	return mongoose.model(
		"IMG",
		schema,
		"IMG"
	)
})();

const cloudinary = Cloudinary.v2;
cloudinary.config({
	cloud_name: readEnv(ENVKEY.cloudinary_name),
	api_key: readEnv(ENVKEY.cloudinary_token),
	api_secret: readEnv(ENVKEY.cloudinary_secret)
});

/**
 * @param {import("cloudinary").UploadResponseCallback} callback
 */
function uploadImageStream(callback) {
	return cloudinary.uploader.upload_stream((error, uploadResult) => {
		if (error == undefined && uploadResult != undefined) {
			Image.insertOne({ uid: uploadResult.asset_id }).
				then(
					() => callback(error, uploadResult),
					(reason) => {
						if (reason != undefined && reason.code != undefined && reason.code == 11000) {
							callback(error, uploadResult);
						}
					}
				);
		} else {
			callback(error, uploadResult);
		}
	});
}

export { uploadImageStream };

