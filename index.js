//@ts-check

console.log("WAIT UNTIL PROCESS SIGNALS ARE ALLOWED BEFORE SENDING THEM");
console.log("IF THE BOOT UP GETS HUNG, IT WILL AUTOMATICALLY TERMINATE!");

import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import HttpStatus from "./src/consts/HttpStatus.js";
import handleError from "./src/middleware/handleError.middleware.js";
import mainRouter from "./src/router/v1.router.js";
import readEnv, { ENVKEY } from "./src/utils/readEnv.js";
import send from "./src/utils/send.js";

startServer(mainRouter);

/**
 * @param {string} message 
 */
function log(message) {
	console.log(`[${readEnv(ENVKEY.cors_origin) ?? "SERVER"}]: ${message}`);
}

/**
 * @param {express.Router[]} routers
 */
async function startServer(...routers) {
	try {
		log("initializing system");

		let _mongoose = await startMongoose(getConnectionString());
		let _express = startExpress(getCorsConfig(), routers);

		let serverIsDying = false;
		function killServer() {
			if (serverIsDying) return;
			serverIsDying = true;
			log("gracefully shutting down");

			//express
			_express.closeAllConnections();

			//mongoose
			_mongoose.connections.forEach((connection) => connection.close());

			//node.js
			let exitCode = process.exitCode;
			if (exitCode == undefined || exitCode == null) exitCode = 0;
			log(`finished with exit code ${exitCode}`);
			process.exit(exitCode);
		}

		/**
		 * @param {Error} error
		 * @param {NodeJS.UncaughtExceptionOrigin} origin
		 */
		function catchException(error, origin) {
			log(`server failure detected from ${origin ?? "an unknown source"}`);
			/** @type {any} */
			let cause = error;
			while (cause != undefined) {
				if (cause.name != undefined) console.log(`name: ${cause.name}`);
				if (cause.message != undefined) console.log(`cause: ${cause.message}`);
				if (cause.stack != undefined) console.log(cause.stack);
				cause = cause.cause;
			}
			killServer();
		}

		//Node.js exit
		process.on("exit", killServer);
		//Node.js error
		process.on("uncaughtException", catchException)
		//Terminal kill signal
		process.on("SIGBREAK", killServer);
		//Terminal kill signal (cmd)
		process.on("SIGINT", killServer);
		//Terminal closed (cmd)
		process.on("SIGHUP", killServer);

		debuggingScriptExecutionHook();

		log("process signals are now allowed");
	} catch (e) {
		serverInitFail(e);
	};
}

function getConnectionString() {
	return readEnv(ENVKEY.connectionString);
}

/**
 * @param {string} connectionString
 */
async function startMongoose(connectionString) {
	return mongoose.
		connect(connectionString).
		then((value) => {
			log("DB connection established");
			return value;
		});
}

function getCorsConfig() {
	let origin = readEnv(ENVKEY.cors_origin);
	/**@type {cors.CorsOptions}*/
	let corsConfig = {
		origin
	};
	return corsConfig;
}

/**
 * @param {cors.CorsOptions} corsConfig
 * @param {import("express").Router[]} routers
 */
function startExpress(corsConfig, routers) {
	let port = Number(readEnv(ENVKEY.port));
	let app = express().
		use(cors(corsConfig)).
		use(express.json()).
		use(handleMiddlewareException);
	for (let router of routers) {
		app = app.use(router);
	}
	app = app.use(handleError);
	let server = app.listen(port);
	log("HTTP listener established");
	return server;
}

/**
 * @param {any} reason
 */
function serverInitFail(reason) {
	log(`init failed, the reason was: \n${reason ?? "no reason ¯\\_(ツ)_/¯"}`);
	process.exit(-1);
}

/**
 * @param {any} error
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
function handleMiddlewareException(error, req, res, next) {
	send(res, HttpStatus.BAD_REQUEST);
}

async function debuggingScriptExecutionHook() {
}
