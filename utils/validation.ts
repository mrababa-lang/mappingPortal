import { z } from 'zod';

export const ID_PATTERNS = {
  MAKE: /^[A-Z0-9-]{2,10}$/,
  NUMERIC: /^[0-9]+$/,
};

export const ARABIC_PATTERN = /^[\u0600-\u06FF\u0750-\u077F\s0-9\-\.]+$/;

export const commonValidators = {
  makeId: z.string().trim().regex(ID_PATTERNS.MAKE, "ID must be 2-10 uppercase alphanumeric characters (hyphens allowed)."),
  numericId: z.string().trim().regex(ID_PATTERNS.NUMERIC, "ID must be a positive integer."),
  requiredString: z.string().trim().min(1, "This field is required."),
  arabicText: z.string().regex(ARABIC_PATTERN, "Text must be in Arabic.").optional().or(z.literal('')),
  email: z.string().trim().email("Invalid email address."),
};
