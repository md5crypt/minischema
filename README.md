# TinySchema - a simple json based data validator

Created mainly to verify configuration files
* small
* simple
* no dependencies
* informative error messages
* does exactly what it supposed to do and nothing more
* typescript!

## Schema structure

### Example

Here is a random example to showcase the schema structure before getting into details:

```javascript
const schema = {
	events: [{
		name: "string",
		id: "integer",
		"metadata?": "string",
	}, "+"],
	listeners: [{
		function: "string",
		type: ["enum", "implicit", "explicit"]
		"metadata?": "string",
		events: ["string", "*"],
	}, "+"],
	prefix: "string",
	offset: "number"
}
```

### Basic types

The following basic types are supported:

* `any`
* `number`
* `integer`
* `boolean`
* `array`
* `object`

a simplest schema is simply a string with a basic type name

### Arrays

If an array of types is given only an array with the exact amount of elements matching the given types will match the schema.

For example `["string", "number"]` will match `["a", 2]`.

The last type in the array can be repeated using two different repeat operators:
* `"*"` - repeated any amount of times
* `"+"` - repeated at least once

For example `["number", "+"]` will match `[1, 2, 3]` but not `[]`

Types inside arrays don't have to be basic types, for example:

`["string", ["number, "number"], "*"]`

Will match `["a", [1, 2], [3, 4]]`

### Objects

If an object is given then an object is expected with matching keys and values of the given type.

Example: `{"a": "number", "b": string}` will match` {"a": 2, "b": "x"}` as well as `{"a": 2}`


#### Strict / not strict modes

There are two modes of matching objects: strict and not strict. The default mode is strict.

In strict mode all keys in the schema object must be in the matched object and there can be no extra keys in the matched object.

In not strict mode the matched object can have keys not defined in the schema object.

Example: `{"a": "number"}` will match `{"a": 2, "b": 2}` in not strict mode by will fail in strict mode.

#### Optional keys

A key can be marked to be optional by adding a `"?"` to it's name. The keys then is allowed to me missing in the matched object.

Example: `{"a": "number", "b?": string}` will match` {"a": 2}`

#### `_any` key

A schema object can have a special `_any` key. This key's type will be used to match keys that are present in the matched object but not in the schema object (even in strict mode).

Examples:
* `{"a": "number", "_any": string}` will match `{"a": 2, "b": "x", "c": "y"}`
* `{"a": "number", "_any": string}` will not match `{"a": 2, "b": 2}` even in not strict mode

#### `_strict` key

The special `_strict` key can be used to override the strict setting for the current object. Strict setting is not inherited by child objects.

Example (strict mode): `{"a": number, "b": {"x": "boolean"}, "_strict": false}`
* will match `{"a": 2, "b": {"x": true}, "c": "y"}`
* will not match `{"a": 2, "b": {"x": true, "y": false}, "c": "y"}` as strict setting is not inherited

### Enumerations

Enumerations define a type that matches only the values from the given list. Enumerations are defined using arrays starting with the special type `"enum"`.

Example: `["enum", "dog", "cat", 42]` will only match `"dog"`, `"cat"` or `42` 

> Note: the `"enum"` type name can not be used outside enum definitions

### Unions

Union types allow to define a list of types that can match the given value. Union types are defined using arrays starting with the special type `"or"`.

Example: `["or", "number", {"x": number", "y": "number"}]` will match `42` as well as `{"x": 0, "y": 1}`

> Note: the `"or"` type name can not be used outside enum definitions

## Error messages

Error thrown form the verify method have one of the following formats:

* `'${path}': expected type '${typeExpected}', got '${typeGot}'`
* `'${path}': missing required key`
* `'${path}': unrecognized key`
* `'${path}': expected empty array`
* `'${path}': array has too few elements`
* `'${path}': array has an invalid number of elements`

Path is updated when entering objects (with keys) and arrays (with indexes). The root path is passed to the verify function as an user argument.

Example: verifying `{a: ["x", "y"]}` against `{a: ["string", "number"]}` will throw

`'a[1]': expected type 'number' got 'string'`

## Api

A single function is exported from the module:

```typescript
function verify(data: any, schema: TinySchemaType, path?: string, strict = true)
```

* `data` - data to be verified
* `schema` - schema to be used
* `path` - root path to be added to error messages
* `strict` - strict mode enable / disable

The function does not return a value, it throws an error on a schema mismatch with an error message described above.

For typescript three types are exported from the module:

* `TinySchemaObject` - type for object schemas
* `TinySchemaArray` - type for array, enumeration and union schemas
* `TinySchemaType` - type for any schema (basic type string, object or array)
