import { Prisma } from '@prisma/client';
import { ApiError } from './api-error.js';

function invalid(fieldName, message) {
  throw new ApiError(400, `${fieldName} ${message}`);
}

export function parseId(value, fieldName = 'id') {
  const parsed = Number.parseInt(String(value), 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    invalid(fieldName, 'must be a positive integer');
  }

  return parsed;
}

export function stringField(value, fieldName, options = {}) {
  const { required = false, allowNull = false, trim = true } = options;

  if (value === undefined) {
    if (required) {
      invalid(fieldName, 'is required');
    }

    return undefined;
  }

  if (value === null) {
    if (allowNull) {
      return null;
    }

    invalid(fieldName, 'cannot be null');
  }

  if (typeof value !== 'string') {
    invalid(fieldName, 'must be a string');
  }

  const normalized = trim ? value.trim() : value;

  if (normalized.length === 0) {
    invalid(fieldName, 'cannot be empty');
  }

  return normalized;
}

export function integerField(value, fieldName, options = {}) {
  const { required = false, allowNull = false, min, max } = options;

  if (value === undefined) {
    if (required) {
      invalid(fieldName, 'is required');
    }

    return undefined;
  }

  if (value === null) {
    if (allowNull) {
      return null;
    }

    invalid(fieldName, 'cannot be null');
  }

  let parsed;

  if (typeof value === 'number') {
    parsed = value;
  } else if (typeof value === 'string' && value.trim().length > 0) {
    parsed = Number.parseInt(value.trim(), 10);
  } else {
    invalid(fieldName, 'must be an integer');
  }

  if (!Number.isInteger(parsed)) {
    invalid(fieldName, 'must be an integer');
  }

  if (min !== undefined && parsed < min) {
    invalid(fieldName, `must be greater than or equal to ${min}`);
  }

  if (max !== undefined && parsed > max) {
    invalid(fieldName, `must be less than or equal to ${max}`);
  }

  return parsed;
}

export function booleanField(value, fieldName, options = {}) {
  const { required = false, allowNull = false } = options;

  if (value === undefined) {
    if (required) {
      invalid(fieldName, 'is required');
    }

    return undefined;
  }

  if (value === null) {
    if (allowNull) {
      return null;
    }

    invalid(fieldName, 'cannot be null');
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['true', '1', 'yes'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'no'].includes(normalized)) {
      return false;
    }
  }

  invalid(fieldName, 'must be a boolean');
}

export function dateField(value, fieldName, options = {}) {
  const { required = false, allowNull = false } = options;

  if (value === undefined) {
    if (required) {
      invalid(fieldName, 'is required');
    }

    return undefined;
  }

  if (value === null) {
    if (allowNull) {
      return null;
    }

    invalid(fieldName, 'cannot be null');
  }

  const parsed =
    value instanceof Date
      ? value
      : typeof value === 'number' || typeof value === 'string'
        ? new Date(value)
        : null;

  if (!(parsed instanceof Date) || Number.isNaN(parsed.getTime())) {
    invalid(fieldName, 'must be a valid date');
  }

  return parsed;
}

export function decimalField(value, fieldName, options = {}) {
  const { required = false, allowNull = false } = options;

  if (value === undefined) {
    if (required) {
      invalid(fieldName, 'is required');
    }

    return undefined;
  }

  if (value === null) {
    if (allowNull) {
      return null;
    }

    invalid(fieldName, 'cannot be null');
  }

  const normalized =
    typeof value === 'number'
      ? String(value)
      : typeof value === 'string'
        ? value.trim()
        : '';

  if (normalized.length === 0) {
    invalid(fieldName, 'must be a decimal number');
  }

  if (!/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) {
    invalid(fieldName, 'must be a decimal number');
  }

  return new Prisma.Decimal(normalized);
}
