//@ts-check

import Entity from "../services/Entity.js";

/**
 * @enum {string}
 */
const Genre = {
	"NON-FICTION": "NON-FICTION",
	"HISTORICAL": "HISTORICAL",
	"BIOGRAPHY": "BIOGRAPHY",
	"ROMANCE": "ROMANCE",
	"THRILLER": "THRILLER",
	"HORROR": "HORROR",
	"MYSTERY": "MYSTERY",
	"FANTASY": "FANTASY",
	"FICTION": "FICTION",
	"SCIENCE_FICTION": "SCIENCE_FICTION",
};
const genres = Object.freeze(Object.keys(Genre));

const Bookgenre = new Entity("Bookgenre", [
	{ name: "book", type: "Book" },
	{ name: "genre", type: "string" }
], [{ book: -1, genre: -1 }]);

export default Bookgenre;
export { Genre, genres as Genres };

