//@ts-check

import Entity from "../services/Entity.js";

//DEPRECATE OLD
/*
const OLD_Pagemarker = mongoose.model(
	"Pagemarker",
	new mongoose.Schema({
		keys: {
			type: new mongoose.Schema({
				book: { type: mongoose.Types.ObjectId, ref: Book.customQuery.baseModelName ?? "", required: true },
				reader: { type: mongoose.Types.ObjectId, ref: Book.customQuery.baseModelName ?? "", required: true }
			}, { _id: false }),
			unique: true,
			required: true
		},
		marker: { type: Number, required: true },
		pageCount: { type: Number, required: true }
	}),
	"Pagemarker"
);
*/

const Pagemarker = new Entity(
	"Pagemarker",
	[
		{ name: "book", type: "Book" },
		{ name: "reader", type: "Credential" },
		{ name: "marker", type: "number" },
		{ name: "pageCount", type: "number" }
	],
	[{ book: -1, reader: -1 }]
);

export default Pagemarker;