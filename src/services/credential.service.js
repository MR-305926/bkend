//@ts-check

import Joi from "joi";

import { sign as jwtSign } from "./jwt.service.js";

import Credential, { UserRole } from "../entities/Credential.js";

//TODO password encryption. perchance.

const usernameSchema = Joi.string().min(1).required();
const passwordSchema = Joi.string().min(1).required();
const loginSchema = Joi.object({
	username: usernameSchema,
	password: passwordSchema
}).required();
const signUpSchema = loginSchema;

/**
 * login? token : ???
 * @param {Object} param
 * @param {string} param.username
 * @param {string} param.password
 */
function login({ username, password }) {
	return new Promise((resolve, reject) => {
		Credential.findOne({ username }).
			then(
				async (candidate) => {
					if (candidate && candidate.password == password) {
						let token = await jwtSign({
							username: candidate.username,
							role: candidate.role
						});
						if (token) resolve(token);
					} else {
						reject();
					}
				},
				reject
			);
	});
}

/**
 * signUp? token : ???
 * @param {Object} param
 * @param {string} param.username
 * @param {string} param.password
 * @param {import("../entities/Credential.js").UserRole} param.role
 */
function signUp({ username, password }) {
	let input = { username, password };
	return new Promise((resolve, reject) => {
		Credential.insertOne(input).
			then(
				() => login(input).then(resolve, reject),
				reject
			);
	});
}

/**
 * @param {string} username 
 * @param {string} newPassword 
 */
function changePassword(username, newPassword) {
	return new Promise((resolve, reject) => {
		Credential.findOneAndUpdate({ username }, { password: newPassword }).
			then(resolve, reject);
	});
}

/**
 * @param {string} username
 * @param {UserRole} newRole
 */
function changeAccountRole(username, newRole) {
	return new Promise((resolve, reject) => {
		Credential.findOneAndUpdate({ username, role: UserRole.READER }, { role: newRole }).select(["_id"]).exec().
			then(
				(credential) => {
					if (credential != null) {
						resolve(jwtSign({ username, role: newRole }));
					} else {
						reject();
					}
				},
				reject
			)
	});
}

/**
 * @param {string} username
 */
function deleteAccount(username) {
	return new Promise((resolve, reject) => {
		Credential.deleteOne({ username }).
			then(resolve, reject)
	});
}


export {
	changeAccountRole, changePassword, deleteAccount,
	login, loginSchema, passwordSchema, signUp, signUpSchema
};

