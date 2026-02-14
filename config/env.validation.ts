import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  GATEWAY_PORT: Joi.number().default(3000),
  AUTH_TCP_HOST: Joi.string().default('127.0.0.1'),
  AUTH_TCP_PORT: Joi.number().default(4001),
  AUTH_PORT: Joi.number().default(4001),
  MONGO_URI: Joi.string().required(),
  CACHE_TTL_SECONDS: Joi.number().default(20),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('1h')
});
