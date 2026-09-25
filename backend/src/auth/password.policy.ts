import * as argon2 from 'argon2';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

// OWASP's Argon2id baseline: 19 MiB memory, two iterations, one lane.
// This is a balanced policy for an interactive API without excessive latency.
export const PASSWORD_HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
} satisfies argon2.HashOptions;

// Generated once with PASSWORD_HASH_OPTIONS from arbitrary throwaway input.
// It is not a user credential or secret; only this encoded digest is retained.
export const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=19456,p=1,t=2$FTuCHgUKVBL7dyevp+00Lw$t4bjvTfYWZvsO5ODymQ0c0f/uhJ2Wf242cnIaFnBVgM';
