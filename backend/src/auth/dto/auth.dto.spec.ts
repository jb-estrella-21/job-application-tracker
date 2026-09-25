import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../password.policy.js';
import { LoginDto } from './login.dto.js';
import { RegisterDto } from './register.dto.js';

async function validatePassword(
  Dto: typeof LoginDto | typeof RegisterDto,
  password: string,
) {
  return validate(Object.assign(new Dto(), {
    email: 'user@example.com',
    password,
  }));
}

describe('authentication password DTOs', () => {
  it.each([LoginDto, RegisterDto])(
    'rejects passwords shorter than the minimum for %p',
    async (Dto) => {
      const errors = await validatePassword(
        Dto,
        'a'.repeat(PASSWORD_MIN_LENGTH - 1),
      );

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('minLength');
    },
  );

  it.each([LoginDto, RegisterDto])(
    'accepts passwords at the supported boundaries for %p',
    async (Dto) => {
      await expect(
        validatePassword(Dto, 'a'.repeat(PASSWORD_MIN_LENGTH)),
      ).resolves.toHaveLength(0);
      await expect(
        validatePassword(Dto, 'a'.repeat(PASSWORD_MAX_LENGTH)),
      ).resolves.toHaveLength(0);
    },
  );

  it.each([LoginDto, RegisterDto])(
    'rejects passwords above the maximum for %p',
    async (Dto) => {
      const errors = await validatePassword(
        Dto,
        'a'.repeat(PASSWORD_MAX_LENGTH + 1),
      );

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('maxLength');
    },
  );
});
