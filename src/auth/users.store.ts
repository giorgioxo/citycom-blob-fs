type User = {
  id: string;
  username: string;
  passwordHash: string;
};

const users = new Map<string, user>();

export function createUser(id: string, username: string, passwordHash: string): user {
  const user: User = {
    id,
    username,
    passwordHash,
  };
  users.set(username, user);
  return user;
}

export function findUserByUsername(username: string): User | undefined {
  return users.get(username);
}
