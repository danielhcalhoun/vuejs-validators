const RULES = require('./rules');
const MESSAGES = require('./messages');
const ParseRule = require('./parseRule');
const variadic = require('./helpers/variadic');

const Validator = function () {
	this.translator = {};

	this.data = {};
	this.errors = {};
	this.rules = { ...RULES };
	this.messages = { ...MESSAGES };

	this.beforeValidationCallbacks = [];
	this.failedValidationCallbacks = [];
	this.passedValidationCallbacks = [];
};

Validator.prototype.parseData = require('./methods/parseData');

Validator.prototype.make = function (data = {}, rules = {}, messages = {}, translator = {}) {
	this.parseRules = rules;
	this.customMessages = messages;
	this.data = this.parseData(data);

	return this;
};

/**
 * Extend Validator With Custom Rules
 * @param parameters
 * @returns {Validator}
 */
Validator.prototype.extend = function (...parameters) {
	parameters = variadic(...parameters);

	if (typeof parameters[0] === 'string') {
		let [key, message, rule] = parameters;

		this.rules = { ...this.rules, [key]: rule };
		this.messages = { ...this.messages, [key]: message };
	} else if (typeof parameters === 'object') {
		Object.entries(parameters).forEach(([key, [message, rule]]) => {
			this.rules = { ...this.rules, [key]: rule };
			this.messages = { ...this.messages, [key]: message };
		})
	}

	return this;
};

/**
 * Add prepare for validation hook/callback
 *
 * @param callback
 * @returns {Validator}
 */
Validator.prototype.prepare = function (callback) {
	this.beforeValidationCallbacks.push(callback);

	return this;
};

/**
 * Add failed validation hook/callback
 *
 * @param callback
 * @returns {Validator}
 */
Validator.prototype.failed = function (callback) {
	this.failedValidationCallbacks.push(callback);

	return this;
};

/**
 * Add passed validation hook/callback
 *
 * @param callback
 * @returns {Validator}
 */
Validator.prototype.passed = function (callback) {
	this.passedValidationCallbacks.push(callback);

	return this;
};

/**
 * Prepare To Validate Hooks
 *
 * @returns {Validator}
 */
Validator.prototype.prepareToValidate = function () {

	this.checks = Object.entries(this.parseRules).reduce(
		(completed, [field, rules]) => [
			...completed,
			...ParseRule(this, field, rules)
		],
	[]);

	this.beforeValidationCallbacks.forEach(callback => callback(this));
};

/**
 * Validate Hook
 * ~~~~~~~~~~~~~~
 * Trigger prepareToValidate Hooks.
 * Trigger Validation Rules
 * Trigger AfterValidation Hooks
 */
Validator.prototype.validate = function () {
	this.prepareToValidate();

	this.errors = this.checks.reduce(
		(errors, check) => ({
			...errors,
			[check.attribute]: check.rule(check)
				? [...(errors[check.attribute] || [])]
				: [...(errors[check.attribute] || []), check.message()],
		}),
	{});

	this.afterValidation();

	return this;
};

/**
 * After validation hook
 *
 * @returns {Validator}
 */
Validator.prototype.afterValidation = function () {
	if (this.hasErrors()) {
		this.failedValidationCallbacks.forEach(callback => callback(this));

		this.failedValidationCallbacks = [];
	} else {
		this.passedValidationCallbacks.forEach(callback => callback(this));

		this.passedValidationCallbacks = [];
	}
};

/**
 * Determine if the validator currently has errors
 *
 * @returns {boolean}
 */
Validator.prototype.hasErrors = function () {
	return Object.keys(this.errors).length > 0;
};

/**
 * Object of error messages
 * {
 * 	   name: ['name must be less than 8 characters', 'name is required'],
 *     email: ['email is a required field', 'email must be of type email'],
 * }
 * @returns {}
 */
Validator.prototype.getErrors = function () {
	return this.errors;
};

/**
 * Flat array of error messages
 *
 * @returns {any[]}
 */
Validator.prototype.getErrorsList = function () {
	return Object.values(this.errors).flat();
};

module.exports = Validator;
