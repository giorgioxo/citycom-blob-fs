type User = {
  id: string;
  username: string;
  passwordHash: string;
};

const users = new Map<string, User>();
const userById = new Map<string, User>();

export function createUser(id: string, username: string, passwordHash: string): User {
  const user: User = {
    id,
    username,
    passwordHash,
  };
  users.set(username, user);
  userById.set(id, user);
  return user;
}

export function findUserByUsername(username: string): User | undefined {
  return users.get(username);
}

export function findUserById(id: string): User | undefined {
  return userById.get(id);
}
