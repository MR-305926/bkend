//@ts-check

import Joi from "joi";

const auxSchema = Joi.number().required();

/**
 * @param {any} value
 */
function isNumber(value) {
	let report = auxSchema.validate(value);
	return report.error == undefined && report.warning == undefined;
}

/**
 * WARN: ignores hyphens
 * TODO: ISBN10 validation
 * @param {string} code
 * @param {Joi.CustomHelpers} [helpers]
 */
function asISBN13(code, helpers) {
	let value = new String(code).valueOf();
	//Normalizes ISBN and EAN codes
	value = value.replaceAll("-", "");
	//Stops it from parsing floating points
	value = value.replace("e", "q");
	if (isNumber(value)) {
		//ISBN13
		if (value.length == 13) {
			let countryCode = value.substring(0, 3);
			if (
				//Bookland
				countryCode == "978" ||
				//Musicland, but is not music
				(
					countryCode == "979" &&
					value.charAt(3) != '0'
				)
			) {
				let checkDigitExpected = `${getEAN13checkDigitFrom(value)}`;
				let checkDigit = value.charAt(12);
				if (checkDigit == checkDigitExpected) {
					return code;
				}
			}
		} else {
			//SBN to ISBN10
			//TODO optimize
			if (value.length == 9) {
				value = "0".concat(value);
			}
			//ISBN10
			if (value.length == 10) {
				throw new Error("ISBN10 NOT IMPLEMENTED YET, SORRY...");
			}
		}
	}
	throw new Error(`"${code}" is not a valid ISBN13 code`);
}

/**
 * WARN assert code is number
 * WARN assert code.length == 13
 * @param {string} code
 */
function getEAN13checkDigitFrom(code) {
	/** @type {string} */
	let string_item;
	/** @type {number} */
	let number_item;
	let acum = 0;
	for (let i = 0; i < 12; i += 2) {
		string_item = code.charAt(i);
		number_item = new Number(string_item).valueOf();
		acum += number_item;
	}
	for (let i = 1; i < 13; i += 2) {
		string_item = code.charAt(i);
		number_item = new Number(string_item).valueOf();
		number_item *= 3;
		acum += number_item;
	}
	let checkDigit = ((10 - (acum % 10)) % 10);
	return checkDigit;
}

export default asISBN13;