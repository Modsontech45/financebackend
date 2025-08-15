import Joi from 'joi';

export const validateSchema = (schema: Joi.ObjectSchema, data: object) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
    allowUnknown: false,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
      code: detail.type.toUpperCase().replace(/\./g, '_'),
    }));

    return {
      isValid: false,
      errors,
      value: null,
    };
  }

  return {
    isValid: true,
    errors: null,
    value,
  };
};
