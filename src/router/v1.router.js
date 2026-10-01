//@ts-check

import express from "express";
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

const router = express.Router();
const root = "/1";

/**
 * @param {UserRole[]} [allowedRoles]
 */
function routesFor(allowedRoles) {
	if (allowedRoles == undefined || allowedRoles.length < 1) {
		allowedRoles = [...UserRoles];
	}
	return express.Router().use(authorize, allowRouterFor(allowedRoles));
}

const publicRoutes = routesFor([]);
const adminRoutes = routesFor([UserRole.ADMIN]);
const readerRoutes = routesFor([UserRole.READER, UserRole.PREMIUM]);
const nonpremiumRoutes = routesFor([UserRole.READER]);
const premiumRoutes = routesFor([UserRole.PREMIUM]);

//WARN should be in a protected route
//TODO move to protected route
router.route(root + "/imageUpload").post(uploadImage);

router.route(root).all((req, res) => send(res, HttpStatus.OK));
router.route(root + "/signUp").post(validateBody(signUpSchema), signUp);
router.route(root + "/login").post(validateBody(loginSchema), login);

publicRoutes.route(root + "/changeMyPassword").post(changeMyPassword);
publicRoutes.route(root + "/deleteMyAccount").post(deleteMyAccount);
publicRoutes.route(root + "/upgradeMyAccount").post(upgradeMyAccount);
publicRoutes.route(root + "/bookGet").post(get(Book));
router.use(publicRoutes);

readerRoutes.route(root + "/pagemarkerGet").post(getMyPagemarker);
readerRoutes.route(root + "/pagemarkerUpdate").post(updateMyPagemarker);
readerRoutes.route(root + "/pagemarkerRemove").post(removeMyPagemarker);
router.use(readerRoutes);

nonpremiumRoutes.route(root + "/pagemarkerAdd").post(addMyPagemarkerRestricted);
router.use(nonpremiumRoutes);

premiumRoutes.route(root + "/pagemarkerAdd").post(addMyPagemarker);
router.use(premiumRoutes);

adminRoutes.route(root + "/bookAdd").post(add(Book));
adminRoutes.route(root + "/bookRemove").post(remove(Book));
adminRoutes.route(root + "/bookgenreAdd").post(add(Bookgenre));
adminRoutes.route(root + "/bookgenreRemove").post(remove(Bookgenre));
router.use(adminRoutes);

router.route("/*plsignore").all((req, res) => send(res, HttpStatus.NOT_FOUND));

export default router;