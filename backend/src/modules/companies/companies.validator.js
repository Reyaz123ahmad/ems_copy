import Joi from 'joi';

export const createCompanySchema = Joi.object({
  sessionId: Joi.string().optional().allow('', null),
  companyData: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    domain: Joi.string().min(2).max(50).optional().allow('', null),
    email: Joi.string().email().optional().allow('', null),
    phone: Joi.string().optional().allow('', null),
    address: Joi.string().optional().allow('', null),
    country: Joi.string().optional().allow('', null),
    timezone: Joi.string().optional().allow('', null),
    currency: Joi.string().optional().allow('', null),
    planId: Joi.string().optional().allow('', null)
  }).required(),
  adminData: Joi.object({
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().optional().allow('', null)
  }).required(),
  planId: Joi.string().optional().allow('', null)
});

export const updateCompanySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  domain: Joi.string().min(2).max(50).optional().allow('', null),
  email: Joi.string().email().optional().allow('', null),
  phone: Joi.string().optional().allow('', null),
  address: Joi.string().optional().allow('', null),
  status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED').optional()
});

export const updateCompanySettingsSchema = Joi.object({
  settingsType: Joi.string()
    .valid('attendance', 'security', 'leave', 'payroll', 'notifications', 'general')
    .required(),
  settingsData: Joi.object().required()
});

export default {
  createCompanySchema,
  updateCompanySchema,
  updateCompanySettingsSchema
};
