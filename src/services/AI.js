//@ts-check

import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";

const model = "gemini-2.5-flash-lite";

/**
 * @param {string} context 
 */
function loadInstance(context) {
	let api_key = process.env.GEMINI_API_KEY;
	if (api_key == undefined) throw new Error("GEMINI API KEY IS UNDEFINED");
	let ans = new GoogleGenerativeAI(api_key).
		getGenerativeModel({
			model: model,
			systemInstruction: context
		});
	return ans;
}

class AI {
	#context;
	/**@type {GenerativeModel | null} */
	#instance;

	/**
	 * @param {string} context
	 */
	constructor(context) {
		this.#context = context;
		this.#instance = null;
	}

	/**
	 * @param {string} prompt
	 */
	async ask(prompt) {
		this.#instance ?? (this.#instance = loadInstance(this.#context));
		return await this.#instance.generateContent(prompt);
	}
}

export default AI;