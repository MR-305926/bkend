//@ts-check

import express, { Router } from "express";
import HttpStatus from "../consts/HttpStatus.js";
import { add, get, remove } from "../controllers/entity.controller.js";
import {
	uploadImage
} from "../controllers/image.controller.js";
import {
	addMyPagemarker,
	addMyPagemarkerRestricted,
	getMyPagemarker,
	removeMyPagemarker,
	updateMyPagemarker
} from "../controllers/pagemarker.controller.js";
import {
	changeMyPassword,
	deleteMyAccount,
	login, loginSchema,
	signUp, signUpSchema,
	upgradeMyAccount
} from "../controllers/session.controller.js";
import Book from "../entities/Book.js";
import Bookgenre from "../entities/BookGenre.js";
import { UserRole, UserRoles } from "../entities/Credential.js";
import allowRouterFor from "../middleware/allowRouterFor.middleware.js";
import authorize from "../middleware/authorize.middleware.js";
import validateBody from "../middleware/validateBody.middleware.js";
import send from "../utils/send.js";
import readEnv, { ENVKEY } from "../utils/readEnv.js";
import { requestMetaGet, RequestMetaKey } from "../services/requestMeta.service.js";

const router = express.Router();
const root = "/1";

/**@typedef {{(allowedRoles:readonly UserRole[],paths:SmartRoutes):SmartRouter}} SmartRouter */
/**@typedef {{[label:string]:SmartRoute}} SmartRoutes */
/**@typedef {{path:string,handlers:import("express").RequestHandler[]}} SmartRoute */
/**
 * @param {import("express").Router} router
 * @param {string} rootPath
 * @param {SmartRoutes} nonAuthPaths
 */
function routing(router, rootPath, nonAuthPaths) {
	let cors_origin = readEnv(ENVKEY.cors_origin);

	router.route(root).all((req, res) => send(res, HttpStatus.OK));

	{
		/** @type {{label:string,path:string}[]} */
		let nonAuthActualPaths = [];
		let entriesNonAuthPaths = Object.entries(nonAuthPaths);
		let pathBuffer;
		for (let [k, v] of entriesNonAuthPaths) {
			pathBuffer = rootPath + v.path;
			nonAuthActualPaths.push({ label: k, path: pathBuffer });
			router.route(pathBuffer).post(v.handlers);
		}
		router.route(root).all((req, res) => res.status(HttpStatus.OK).send(nonAuthActualPaths));
	}

	/** @type {{[k:UserRole]:{label:string,path:string}[]}} */
	let roleRoutesMap = Object();

	{
		/**
		 * @type {import("express").RequestHandler}
		 * @returns {void}
		 */
		function indexRequestHandler(req, res) {
			let role = requestMetaGet(req, RequestMetaKey.session_role);
			let pathIndex = (role == undefined) ? [] : roleRoutesMap[role];
			res.status(HttpStatus.OK).send(pathIndex);
		}
		router.route(rootPath + "/index").post(authorize, indexRequestHandler);
		router.route("/health").all((req, res) => res.status(200).send().end())
	}

	/** @type {SmartRouter} */
	function SmartRouterInstance(allowedRoles, paths) {
		let branchRouter = express.Router().use(authorize, allowRouterFor(allowedRoles));
		{
			/** @type {{label:string,path:string}[]} */
			let actualPaths = [];
			{
				let pathBuffer;
				for (let [k, v] of Object.entries(paths)) {
					pathBuffer = rootPath + v.path;
					branchRouter.route(pathBuffer).post(v.handlers);
					actualPaths.push({ label: k, path: (cors_origin + pathBuffer) });
				}
			}
			{
				//TODO check if by ref of buffer holds up
				/** @type {{label:string,path:string}[]} */
				let buffer;
				for (let item of allowedRoles) {
					buffer = roleRoutesMap[item];
					if (buffer == undefined) {
						buffer = [];
						roleRoutesMap[item] = buffer;
					}
					for (let x of actualPaths) {
						buffer.push(x);
					}
				}
			}
			router.use(branchRouter);
		}
		return SmartRouterInstance;
	}
	return SmartRouterInstance;
}

/**
 * @param {string} path
 * @param {import("express").RequestHandler[]} handlers
 */
function route(path, ...handlers) {
	return { path, handlers }
}

//WARN should be in a protected route
//TODO move to protected route
//TODO enable again, code is in place
//router.route(root + "/imageUpload").post(uploadImage);


routing(router, root,
	{
		"Registrarse": route("/signUp", validateBody(signUpSchema), signUp),
		"Ingresar": route("/login", validateBody(loginSchema), login)
	}
)(
	UserRoles, {
	"Cambiar mi contraseña": route("/changeMyPassword", changeMyPassword),
	"Eliminar mi cuenta": route("/deleteMyAccount", deleteMyAccount),
	"Mejorar mi plan": route("/upgradeMyAccount", upgradeMyAccount),
	"Buscar libro": route("/bookGet", get(Book))
}
)([UserRole.READER, UserRole.PREMIUM],
	{
		"Buscar marcador de pagina": route("/pagemarkerGet", getMyPagemarker),
		"Actualizar marcador de pagina": route("/pagemarkerUpdate", updateMyPagemarker),
		"Eliminar marcador de pagina": route("/pagemarkerRemove", removeMyPagemarker)
	}
)([UserRole.READER],
	{
		"Añadir marcador de pagina": route("/pagemarkerAdd", addMyPagemarkerRestricted)
	}
)([UserRole.PREMIUM],
	{
		"Añadir marcador de pagina": route("/pagemarkerAdd", addMyPagemarker)
	}
)([UserRole.ADMIN],
	{
		"Añadir libro": route("/bookAdd", add(Book)),
		"Eliminar libro": route("/bookRemove", remove(Book)),
		"Añadir genero libro": route("/bookgenreAdd", add(Bookgenre)),
		"Eliminar genero libro": route("/bookgenreRemove", remove(Bookgenre)),
	}
);

router.all(root + "/:a", (req, res) => send(res, HttpStatus.NOT_FOUND));

export default router;