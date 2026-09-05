export type User = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type LoginResponse = {
  user: User;
  accessToken: string;
};