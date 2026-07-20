<p align="center">
  <picture><source media="(prefers-color-scheme: light)" srcset="https://shieldcn.dev/header/glow.svg?title=Settings&amp;subtitle=Learn+how+to+get+and+change+settings+with+Linkdirecte.&amp;logo=lu%3ASettings&amp;mode=light&amp;theme=blue&amp;align=left" /><img alt="Settings | Learn how to get and change settings with Linkdirecte." src="https://shieldcn.dev/header/glow.svg?title=Settings&amp;subtitle=Learn+how+to+get+and+change+settings+with+Linkdirecte.&amp;logo=lu%3ASettings&amp;mode=dark&amp;theme=blue&amp;align=left" /></picture>
</p>

The Settings module allows you to view and adjust account properties, update user emails or phone numbers, change security answers, and configure accessibility settings (such as high-contrast themes) for the student.

---

## 🚀 Getting Started

Let's read the current user preferences and check out their registered details:

```typescript
import { getSettings, updateSettings } from "linkdirecte";

// Retrieve active settings
const preferences = await getSettings();

console.log(`Identifier: ${preferences.identifiant}`);
console.log(`Registered Email: ${preferences.email}`);
console.log(`Mobile Phone: ${preferences.portable || "None specified"}`);

// Update user details (for example, setting a new email)
const updated = await updateSettings({
  email: "new.student@email.com",
});

console.log(`Email updated to: ${updated.email}`);
```

---

## 📖 API Reference

### `getSettings`

Fetches user login attributes and profile settings.

```typescript
function getSettings(options?: {
  explain?: boolean;
}): Promise<AccountSettings>
```

---

### `updateSettings`

Saves updated contact details, credentials, or security questions.

```typescript
function updateSettings(
  data: {
    email?: string;
    portable?: string;              // French alias for mobile phone (mapped under the hood)
    questionSecrete?: string;       // French alias for secret question
    reponse?: string;               // French alias for reponse
    nouveauMotDePasse?: string;     // French alias for new password
    identifiant?: string;           // Username identifier
  },
  options?: { explain?: boolean }
): Promise<AccountSettings>
```

> **Note**: If you provide `nouveauMotDePasse` (new password) to change the account password, Linkdirecte handles the required password confirmation payload parameters internally for you.

---

### `updateAccessibility`

Enables or disables visual accessibility enhancements (e.g. high contrast or enlarged typography settings) inside EcoleDirecte.

```typescript
function updateAccessibility(
  enabled: boolean,
  options?: { explain?: boolean }
): Promise<{ success: boolean }>
```

#### Example

```typescript
import { updateAccessibility } from "linkdirecte";

// Turn on visual accessibility features!
const result = await updateAccessibility(true);

if (result.success) {
  console.log("Visual accessibility preferences saved.");
}
```

---

## 🗂️ Type Definitions

### `AccountSettings`

The properties of `AccountSettings` are mapped to clean English keys by the Linkdirecte transform engine:

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `number` | Unique ID of the login profile. |
| `identifiant` | `string` | Account username. |
| `email` | `string` | Registered contact email address. |
| `portable` | `string` | Registered mobile telephone number. |
| `questionSecrete` | `string` | The active security challenge question. |
| `reponse` | `string` | Decoded reponse for the security question. |
| `accessToken` | `string` | Secure session access token. |
| `possibleQuestions` | `string[]` | Pre-defined questions available to choose from for your security question. |
