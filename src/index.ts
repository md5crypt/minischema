export type TinySchemaObject = {[key: string]: TinySchemaType}
export interface TinySchemaArray extends Array<TinySchemaType> { }
export type TinySchemaType = string | TinySchemaObject | TinySchemaArray

function verifyObject(data: {[key:string]:any}, schema: TinySchemaObject, path: string, strict: boolean) {
	const prefix = path ? (path + ".") : ""
	for (let key in schema) {
		if (!(["_strict", "_any"].includes(key)) && schema.hasOwnProperty(key) && (key[key.length - 1] != "?")) {
			if (!data.hasOwnProperty(key)) {
				throw new Error(`'${prefix}${key}': missing required key`)
			}
		}
	}
	for (let key in data) {
		if (data.hasOwnProperty(key)) {
			if (schema.hasOwnProperty(key)) {
				verify(data[key], schema[key], `${prefix}${key}`, strict)
			} else if (schema.hasOwnProperty(key+"?")) {
				verify(data[key], schema[key+"?"], `${prefix}${key}`, strict)
			} else if (schema._any) {
				verify(data[key], schema._any, `${prefix}${key}`, strict)
			} else if (schema._strict === undefined ? strict : schema._strict) {
				throw new Error(`'${prefix}${key}': unrecognized key`)
			}
		}
	}
}

function verifyArray(data: any[], schema: TinySchemaArray, path: string, strict: boolean) {
	if (schema.length == 0) {
		if (data.length != 0) {
			throw new Error(`'${path}': expected empty array`)
		}
	} else if (schema.length == 1) {
		verify(data[0], schema[0], `${path}[0]`, strict)
	} else {
		let offset = 0
		if (schema.length > 2) {
			offset = schema.length - 2
			if (data.length < offset) {
				throw new Error(`'${path}': array has too few elements`)
			}
			for (let i = 0; i < offset; i++) {
				verify(data[i], schema[i], `${path}[${i}]`, strict)
			}
		}
		if ((schema[offset + 1] == "+") || (schema[offset + 1] == "*")) {
			if ((offset > data.length) || ((schema[offset + 1] == "+") && offset == data.length)) {
				throw new Error(`'${path}': array has too few elements`)
			}
			for (let i = offset; i < data.length; i++) {
				verify(data[i], schema[offset], `${path}[${i}]`, strict)
			}
		} else {
			if (schema.length != data.length) {
				throw new Error(`'${path}': array has an invalid number of elements`)
			}
			verify(data[offset], schema[offset], `${path}[${offset}]`, strict)
			verify(data[offset + 1], schema[offset + 1], `${path}[${offset + 1}]`, strict)
		}
	}
}

function typeName(schema: TinySchemaType): string {
	if (Array.isArray(schema)) {
		switch (schema[0]) {
			case "enum":
				return "enum(" + schema.slice(1).join(", ") + ")"
			case "or":
				return schema.slice(1).map(typeName).join(" | ")
			default:
				return "array"
		}
	} else if (typeof schema == "object") {
		return "object"
	} else {
		return schema
	}
}

function verify(data: any, schema: TinySchemaType, path?: string, strict = true) {
	path = path || ""
	if (Array.isArray(schema)) {
		switch (schema[0]) {
			case "enum":
				if (!(schema.slice(1).includes(data))) {
					throw new Error(`'${path}': expected type '${typeName(schema)}', got '${data}'`)
				}
				break
			case "or":
				for (let i = 1; i < schema.length; i++) {
					try {
						verify(data, schema[i], path, strict)
						return
					} catch(_) {
						// ignore
					}
				}
				throw new Error(`'${path}': expected type '${typeName(schema)}', got '${typeof data}'`)
			default:
				if (!Array.isArray(data)) {
					throw new Error(`'${path}': expected type 'array', got '${typeof data}'`)
				}
				verifyArray(data, schema, path, strict)
		}
	} else if (typeof schema == "object") {
		if (Array.isArray(data)) {
			throw new Error(`'${path}': expected type 'object', got 'array'`)
		}
		if (typeof data != "object") {
			throw new Error(`'${path}': expected type 'object', got '${typeof data}'`)
		}
		verifyObject(data, schema, path, strict)
	} else if ((schema == "string") || (schema == "boolean") || (schema == "number") || (schema == "object")) {
		if (typeof data != schema) {
			throw new Error(`'${path}': expected type '${schema}', got '${typeof data}'`)
		}
	} else if (schema == "integer") {
		if ((typeof data != "number") || !Number.isInteger(data)) {
			throw new Error(`'${path}': expected type 'integer', got '${typeof data}'`)
		}
	} else if (schema == "array") {
		if (!Array.isArray(data)) {
			throw new Error(`'${path}': expected type 'array', got '${typeof data}'`)
		}
	} else if (schema != "any") {
		throw new Error(`'${path}': invalid schema type: '${schema}'`)
	}
}

export { verify as schemaVerify }
