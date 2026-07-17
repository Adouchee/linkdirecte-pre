# Class Life

The Class Life module retrieves details about the student's class (such as classmates, teachers, class delegates, and schedules) from the EcoleDirecte API.

## Functions

### `getClassLife`

Fetches Class Life details for the currently active student account.

```typescript
function getClassLife(options?: { raw?: boolean; explain?: boolean }): Promise<ClassLifeResult>
```

#### Parameters

- `options`: Optional query/display configurations:
  - `raw`: If `true`, returns the raw API response instead of the camelCase transformed keys.
  - `explain`: If `true`, includes a `_debug` property containing request, response, and trace metadata.

#### Returns

A `Promise<ClassLifeResult>` representing classmates, teachers, and other details.

#### Throws

- `EdApiError` with code `NO_CLASS_ASSIGNED` if the active account does not have an assigned class in their profile.

#### Example

```typescript
import { getClassLife } from "linkdirecte";

try {
  const classLife = await getClassLife();
  console.log("Classmates:", classLife.students);
  console.log("Teachers:", classLife.teachers);
} catch (error) {
  console.error("Failed to fetch class life:", error);
}
```
