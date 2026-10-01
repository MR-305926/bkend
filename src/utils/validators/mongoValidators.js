//@ts-check

/**
 * 
 * @param {readonly string[]} allowedValues 
 * @returns {{validator:((value:string) => boolean),message:(props:{value:any}) => string}}
 */
function oneof(allowedValues) {
	return Object.freeze({
		validator: (value) => allowedValues.includes(value),
		message: (props) => `${props.value} is not any of ${JSON.stringify(allowedValues)}`
	});
}

export { oneof };

