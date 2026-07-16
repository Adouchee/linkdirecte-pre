# Authentication

The authentication module handles connection to the EcoleDirecte API, including support for two-factor authentication (2FA) and token refreshing.

## Functions

### `login`

Authenticates a user with their credentials. Supports both positional arguments and a unified options-object format.

```typescript
// Positional style
function login(identifiant: string, motdepasse: string, options?: LoginOptions): Promise<LoginResult>

// Unified object style
function login(params: LoginUnifiedOptions): Promise<LoginResult>
```

#### Parameters

- `identifiant` / `username` / `identifier`: The user's username (used in positional style, or as properties of the unified options object).
- `motdepasse` / `password`: The user's password (used in positional style, or as properties of the unified options object).
- `options` / `params`: Configuration for the login process.
  - `rememberMe`: If true, attempts to store an access token, UUID and 2FA tokens (`cn`/`cv`) for future refreshes.
    - `on2faRequired`: (Optional) A callback function to handle 2FA automatically. It receives the question and choices, and can return either the index of the chosen answer (e.g. `0`) or the text of the chosen option itself (e.g. `"Red"`).

> **Note**: The UUID is automatically generated and managed by the SDK. When `rememberMe: true`, it is persisted in storage along with the access token and reused for session renewal.

#### Returns

Returns a `Promise<LoginResult>`. Since EcoleDirecte may require 2FA, the result can be either a success or a challenge.

- **`LoginSuccess`**: If authentication is successful without 2FA.
  - `user`: The `Account` object.
  - `token`: The session token.
  - `sessionId`: The unique session identifier.
- **`LoginChallenge`**: If 2FA is required.
  - `type`: Always `"securityQuestion"`.
  - `question`: The security question (decoded from Base64).
  - `choices`: An array of possible answers (decoded from Base64).
  - `answer(choiceIndexOrText)`: A function to submit the chosen answer. Accepts either a numeric index or the string value of the selected choice (case-insensitive). Returns a `Promise` of the next step (usually `LoginSuccess`).

#### Example

```typescript
import { login } from "linkdirecte";

// Simple login using positional arguments
const result = await login("username", "password");

// Simple login using unified options-object format with camelCase keys
const resultUnified = await login({
  username: "username",
  password: "password",
  on2faRequired: (question, choices) => "Red" // Return string option directly!
});

if (result.type === "securityQuestion") {
  // Can answer with index or the option string directly
  const session = await result.answer("Red");
}

// Login with automatic 2FA handling
const session = await login("username", "password", {
  on2faRequired: async (question, choices) => {
    // Show UI modal or CLI prompt
    return 0; // Return index of choice
  }
});
```

---

### `logout`

Clears the current session token.

```typescript
function logout(): Promise<void>
```

---

### `refreshToken`

Refreshes the current session token using a stored access token. Requires a storage adapter to be configured and `rememberMe: true` to have been used during a previous `login`.

```typescript
function refreshToken(): Promise<string>
```

After a successful refresh, the token keepalive is restarted automatically.

#### Returns

A `Promise<string>` containing the new session token.

#### Throws

- `EdAuthError`: If no account is active, no access token is found in storage, or the refresh fails and no `onCredentialsRequired` callback is configured.

#### Example

```typescript
import { refreshToken } from "linkdirecte";

try {
  const newToken = await refreshToken();
  console.log("New token:", newToken);
} catch (e) {
  console.error("Failed to refresh token", e);
}
```

## Related Types

### `LoginOptions`
```typescript
interface LoginOptions {
  rememberMe?: boolean;
  on2faRequired?: (
    question: string,
    choices: string[],
  ) => number | string | Promise<number | string>;
}

interface LoginUnifiedOptions extends LoginOptions {
  identifiant?: string;
  username?: string;
  identifier?: string;
  motdepasse?: string;
  password?: string;
}
```

### `Account`
The user account information returned upon successful login.
```typescript
interface Account {
  loginId: number;
  id: number;
  uid: string;
  identifiant: string;
  accountType: AccountType;
  firstName: string;
  lastName: string;
  email: string;
  schoolName: string;
  main: boolean;
  accessToken?: string;
  profile: {
    sexe: "M" | "F";
    photoUrl: string;
    classe?: {
      id: number;
      code: string;
      label: string;
    };
  };
  modules: Array<{
    code: string;
    enable: boolean;
    badge: number;
    params: Record<string, any>;
  }>;
}
```
