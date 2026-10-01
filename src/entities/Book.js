//@ts-check

import Entity from "../services/Entity.js";
import asISBN13 from "../utils/validators/asISBN13.js";

//TODO genre

const Book = new Entity("Book", [
	{ name: "isbn", type: "string", joiCheck: asISBN13 },
	{ name: "title", type: "string" },
	{ name: "pageCount", type: "number", min: 1 },
], [{ "isbn": -1 }]);



export default Book;



