//@ts-check

import Joi from "joi";
import mongoose from "mongoose";
import ObjectId from "../utils/ObjectIdJoiSchemaFactory.js";
import readEnv, { ENVKEY } from "../utils/readEnv.js";
import joiValidators from "../utils/validators/joiValidators.js";

const maxQueryBatchSize = Number(readEnv(ENVKEY.data_maxQueryBatchSize));

/** @typedef {string} */
const SchemaType = {
	string: "string",
	number: "number"
};

/**
 * @param {string} name
 * @param {Object[]} schema
 * @param {string} schema.name
 * @param {string} schema.type
 * @param {import("mongoose").Validator} [schema.mongoCheck]
 * @param {string[]} keys
 * @param {{[k:string]:(-1|1)}[]} keySets
 */
function genMongoModel(name, schema, keys, keySets) {
	let ans = {};

	let buffer;
	let type;
	let ref;
	for (let item of schema) {
		switch (item.type) {
			case SchemaType.string: type = String; break;
			case SchemaType.number: type = Number; break;
			default: type = mongoose.Types.ObjectId; ref = item.type;
		}
		if (item.mongoCheck != undefined) {
			buffer = {
				name: item.name,
				type: type,
				required: true,
				validate: item.mongoCheck
			};
		} else {
			buffer = {
				name: item.name,
				type: type,
				required: true
			};
		}

		if (ref != undefined) {
			//WARN magic assignment
			// @ts-ignore
			buffer["ref"] = ref;
			ref = undefined;
		}
		if (item.mongoCheck != undefined) {
			//WARN magic assignment
			// @ts-ignore
			buffer["validate"] = item.mongoCheck;
		}

		//WARN magic assignment
		// @ts-ignore
		ans[item.name] = buffer;
	}
	let mongooseSchema = new mongoose.Schema(ans);
	for (let item of keySets) {
		for (let k of Object.keys(item)) {
			if (!keys.includes(k)) throw new Error("invalid keyset");
		}
		mongooseSchema.index(item);
	}

	return mongoose.model(name, mongooseSchema, name);
};

/**
* @param {Object[]} param
* @param {string} param.name
* @param {number | Date} [param.floor]
* @param {number | Date} [param.roof]
* @param {string} [param.value]
*/
function parseFilter(param) {
	let criteria = [];
	{
		let name;
		for (let item of param) {
			name = item.name;
			if (item.floor != undefined) criteria.push({ [name]: { $gt: item.floor } });
			if (item.roof != undefined) criteria.push({ [name]: { $lt: item.roof } });
			if (item.value != undefined) criteria.push({ [name]: { $eq: item.value } });
		}
	}

	if (criteria.length > 1) {
		return { $and: criteria };
	} else if (criteria.length > 0) {
		return criteria[0];
	}
	//else
	return {};
}

/**
 * @param {any[]} documents
 */
function removeVersionUID(documents) {
	for (let i = 0, length = documents.length; i < length; i++) {
		documents[i]["_doc"]["__v"] = undefined;
	}
	return documents;
}

/**
 * @param {Object[]} schema
 * @param {string} schema.name
 * @param {string} schema.type
 * @param {boolean} [schema.unique]
 * @param {number|Date} [schema.min]
 * @param {number|Date} [schema.max]
 * @param {import("joi").CustomValidator} [schema.joiCheck]
 * @param {string[]} keys
 */
function genGetSchema(schema, keys) {
	let keySchema = Joi.string().valid(...keys);

	let criteria = [];
	let valueSchema;
	for (let item of schema) {
		if (item.type == SchemaType.number) {
			valueSchema = Joi.number();
			if (item.min != undefined && typeof item.min == 'number') valueSchema = valueSchema.min(item.min);
			if (item.max != undefined && typeof item.max == 'number') {
				if (item.min != undefined && typeof item.min == 'number' && item.max < item.min) throw new Error("min gt max");
				valueSchema = valueSchema.max(item.max);
			}

			criteria.push(Joi.object({
				name: keySchema.required(),
				floor: valueSchema,
				roof: valueSchema.when(Joi.ref("floor"), {
					is: valueSchema.required(),
					then: valueSchema.min(Joi.ref("floor")),
				})
			}));
		} else if (item.type == SchemaType.string) {
			criteria.push(Joi.object({
				name: keySchema.required(),
				value: Joi.string()
			}));
		} else {
			criteria.push(Joi.object({
				name: keySchema.required(),
				value: ObjectId()
			}));
		}
	}

	let ans = Joi.object({
		selector: Joi.array().items(keySchema).unique(),
		where: Joi.array().items(Joi.alternatives().try(...criteria)).unique((a, b) => a.name == b.name),
		skip: Joi.number().min(1),
		amount: Joi.number().min(1).max(maxQueryBatchSize).required()
	}).required();

	return ans;
}

/**
 * @param {Object[]} schema
 * @param {string} schema.name
 * @param {string} schema.type
 * @param {number} [schema.min]
 * @param {number} [schema.max]
 * @param {number[]|string[]} [schema.oneof]
 * @param {{[k:string]:(-1|1)}[]} [keySets]
 */
function genInsertSchema(schema, keySets) {
	let obj = {};
	let buffer;
	for (let item of schema) {
		if (item.type == SchemaType.number) {
			buffer = Joi.number();
			if (item.min != undefined && typeof item.min == "number") {
				buffer = buffer.min(item.min);
				if (item.max != undefined && typeof item.max == "number" && !(item.min > item.max)) {
					buffer = buffer.max(item.max);
				}
			} else if (item.max != undefined && typeof item.max == "number") {
				buffer = buffer.max(item.max);
			}
		} else if (item.type == SchemaType.string) {
			buffer = Joi.string();
		} else {
			buffer = ObjectId();
		}

		if (item.oneof != undefined) {
			if ((typeof item.oneof[0] != item.type)) throw new Error("wrong type in oneof clause");
			buffer = buffer.custom(joiValidators.oneof(item.oneof));
		}
		buffer = buffer.required();
		//WARN magic assignment
		// @ts-ignore
		obj[item.name] = buffer;
	}

	let objectSchema = Joi.object(obj);
	if (keySets != undefined) {
		/** @type {((a:any,b:any) => boolean)[]} */
		let uniqueConstraints = [];
		for (let item of keySets) {
			uniqueConstraints.push((a, b) => {
				for (let k of Object.keys(keySets)) {
					if (a[k] != b[k]) return false;
				}
				return true;
			});
		}
		return Joi.alternatives().try(
			Joi.array().items(objectSchema).unique((a, b) => {
				for (let item of uniqueConstraints) {
					if (item(a, b)) return true;
				}
				return false;
			}),
			objectSchema
		).required();
	}
	//else
	return objectSchema;
}

/**
 * @param {Object[]} schema
 * @param {string} schema.name
 * @param {string} schema.type
 * @param {boolean} [schema.unique]
 * @param {number|Date} [schema.min]
 * @param {number|Date} [schema.max]
 * @param {import("joi").CustomValidator} [schema.joiCheck]
 * @param {string[]} keys
 */
function genRemoveSchema(schema, keys) {
	let keySchema = Joi.string().valid(...keys);

	let criteria = [];
	let valueSchema;
	for (let item of schema) {
		if (item.type == SchemaType.number) {
			valueSchema = Joi.number();
			if (item.min != undefined && typeof item.min == 'number') valueSchema = valueSchema.min(item.min);
			if (item.max != undefined && typeof item.max == 'number') {
				if (item.min != undefined && typeof item.min == 'number' && item.max < item.min) throw new Error("min gt max");
				valueSchema = valueSchema.max(item.max);
			}

			criteria.push(Joi.object({
				name: keySchema.required(),
				floor: valueSchema,
				roof: valueSchema.when(Joi.ref("floor"), {
					is: valueSchema.required(),
					then: valueSchema.min(Joi.ref("floor")),
				})
			}));
		} else if (item.type == SchemaType.string) {
			criteria.push(Joi.object({
				name: keySchema.required(),
				value: Joi.string()
			}));
		} else {
			criteria.push(Joi.object({
				name: keySchema.required(),
				value: ObjectId()
			}));
		}
	}

	let ans = Joi.object({
		selector: Joi.array().items(keySchema).unique(),
		where: Joi.array().items(Joi.alternatives().try(...criteria)).unique((a, b) => a.name == b.name),
		skip: Joi.number().min(1),
		amount: Joi.number().valid(1)
	}).required();

	return ans;
}

class Entity {
	#model;
	#keys;
	#getSchema;
	#insertSchema;
	#removeSchema;

	/**
	 *  1 => ascending
	 * -1 => descending
	 * @param {string} name
	 * @param {Object[]} schema
	 * @param {string} schema.name
	 * @param {string} schema.type
	 * @param {number} [schema.min]
	 * @param {number} [schema.max]
	 * @param {number[]|string[]} [schema.oneof]
	 * @param {import("joi").CustomValidator} [schema.joiCheck]
	 * @param {import("mongoose").Validator} [schema.validator]
	 * @param {{[k:string]:(-1|1)}[]} [keySets]
	 */
	constructor(name, schema, keySets) {
		this.#keys = schema.map((item) => item.name);
		this.#model = genMongoModel(name, schema, this.#keys, keySets ?? []);
		this.#getSchema = genGetSchema(schema, this.#keys);
		this.#insertSchema = genInsertSchema(schema, keySets);
		this.#removeSchema = genRemoveSchema(schema, this.#keys);
	}

	get customQuery() { return this.#model; }

	get getSchema() { return this.#getSchema; }
	get insertSchema() { return this.#insertSchema; }
	get removeSchema() { return this.#removeSchema; }

	/**
	 * @param {Object} param
	 * @param {string[]} param.selector
	 * @param {Object[]} param.where
	 * @param {string} param.where.name
	 * @param {number } [param.where.floor]
	 * @param {number } [param.where.roof]
	 * @param {string} [param.where.value]
	 * @param {number} [param.skip]
	 * @param {number} [param.amount]
	 */
	get(param) {
		let filter = (param.where != undefined) ?
			parseFilter(param.where) :
			undefined;

		let q = this.#model.find(filter);

		if (param.skip != undefined) q = q.skip(param.skip);
		if (param.amount != undefined) q = q.limit(param.amount);
		if (param.selector != undefined) {
			q = q.select(param.selector);
		} else {
			q = q.select(this.#keys);
		}

		return q.exec();
	}

	/**
	 * @param {Object[]} param
	 */
	insert(param) {
		let ans = new Promise((resolve, reject) => {
			this.#model.insertMany(param).
				then(removeVersionUID, reject).
				then(resolve, reject);
		});
		return ans;
	}

	/**
	 * @param {Object} param
	 * @param {Object[]} param.where
	 * @param {string} param.where.name
	 * @param {number | Date} [param.where.floor]
	 * @param {number | Date} [param.where.roof]
	 * @param {string} [param.where.value]
	 * @param {number} [param.skip]
	 * @param {1} [param.amount]
	 */
	remove(param) {
		let filter = (param.where != undefined) ?
			parseFilter(param.where) :
			undefined;

		let q = (param.amount != undefined) ?
			this.#model.deleteOne(filter) :
			this.#model.deleteMany(filter);

		if (param.skip != undefined) q = q.skip(param.skip);

		return q.exec();
	}
}

export default Entity;
export { parseFilter };

