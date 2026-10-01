//@ts-check

const joiValidators = {
	/** 
	 * @param {number[] | string[]} allowedValues
	 * @returns {import("joi").CustomValidator} 
	 */
	oneof: (allowedValues) => ((value, helpers) => {
		let type = typeof value;
		//WARN value is checked to not be either number or string
		// @ts-ignore
		if ((type == "number" || type == "string") && allowedValues.includes(value)) {
			return value;
		}
		//else
		return helpers.error("array.includes");
	})
}

export default joiValidators;