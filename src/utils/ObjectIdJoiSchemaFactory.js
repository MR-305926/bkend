//@ts-check

import Joi from "joi";
import joiObjectid from "joi-objectid";

/** 
 * @template T
 * @type {() => import("joi").AlternativesSchema<T>}
 */
const ObjectIdSchemaFactory = joiObjectid(Joi);

export default ObjectIdSchemaFactory;