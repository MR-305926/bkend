//@ts-check

import Joi from "joi";

//TODO obsolete old stuff
//TODO implement useful stuff
/*
	filter: Joi.array().items(

	)).unique((a, b) => a.name == b.name),
*/

/**
 * @param {import("joi").StringSchema} keySchema
 */
function genSelectorSchema(keySchema) {
	return Joi.array().items(keySchema).unique()
}

/**
 * @param {import("joi").StringSchema} keySchemaRequired
 */
function genStringFilterSchema(keySchemaRequired) {
	let ans = Joi.object({
		name: keySchemaRequired,
		value: Joi.string()
	});
	return ans;
}

/**
 * @param {import("joi").StringSchema} keySchemaRequired
 */
function genNumberFilterSchema(keySchemaRequired) {
	let ans = Joi.object({
		name: keySchemaRequired,
		floor: Joi.number(),
		roof: Joi.when("floor", {
			is: Joi.exist(),
			then: Joi.number().min(Joi.ref("floor")),
			otherwise: Joi.number()
		})
	});
	return ans;
}

/**
 * @param {import("joi").StringSchema} keySchemaRequired
 */
function genDateFilterSchema(keySchemaRequired) {
	let ans = Joi.object({
		name: keySchemaRequired,
		from: Joi.date(),
		to: Joi.when("floor", {
			is: Joi.exist(),
			then: Joi.date().min(Joi.ref("floor")),
			otherwise: Joi.date()
		})
	});
	return ans;
}

export { };

