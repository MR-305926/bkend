//@ts-check

import mongoose from "mongoose";

import { oneof } from "../utils/validators/mongoValidators.js";

//TODO password encryption
//TODO premium account

/**
 * @enum {string}
 */
const UserRole = Object.freeze({
	"READER": "READER",
	"PREMIUM": "PREMIUM",
	"DEFAULT": "DEFAULT",
	"ADMIN": "ADMIN",
});
const roles = Object.freeze(Object.keys(UserRole));

const Credential = mongoose.model(
	"Credential",
	new mongoose.Schema({
		username: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		role: { type: String, default: roles[0], validate: oneof(roles) }
	}),
	"Credential"
);

export default Credential;
export { UserRole, roles as UserRoles };

