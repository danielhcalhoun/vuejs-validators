'use strict';

const Factory = require('./factory');

const validator = (
	data = {},
	rules = {},
	messages = {},
	translator = {},
) => (new Factory(data, rules, messages, translator));

const { MessageBag, MessageBagFactory }= require('./messageBag.js');

module.exports = validator;
module.exports.Validator = Factory;
module.exports.default = validator;
module.exports.validator = validator;
module.exports.makeErrorBag = makeErrorBag;
