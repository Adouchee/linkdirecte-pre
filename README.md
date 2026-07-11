<p align="center">
  <picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/header/gradient.svg?title=Linkdirecte&amp;subtitle=Your+first-rate+SDK+for+the+EcoleDirecte+API.&amp;logo=ri%3AFiBook&amp;mode=dark" /><img alt="header" src="https://shieldcn.dev/header/gradient.svg?title=Linkdirecte&amp;subtitle=Your+first-rate+SDK+for+the+EcoleDirecte+API.&amp;logo=ri%3AFiBook&amp;mode=light" /></picture>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/linkdirecte"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/npm/linkdirecte.svg?size=xs" /><img alt="badge" src="https://shieldcn.dev/npm/linkdirecte.svg?size=xs&amp;mode=light" /></picture></a>
  <a href="https://github.com/Scolup/Linkdirecte"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/github/Scolup/Linkdirecte/stars.svg?size=xs" /><img alt="badge" src="https://shieldcn.dev/github/Scolup/Linkdirecte/stars.svg?size=xs&amp;mode=light" /></picture></a>
</p>

---

**Linkdirecte** is a type-safe, developer-friendly SDK for the **EcoleDirecte API**. It handles the complete login flow, manages Two-Factor Authentication (2FA), auto-decodes Base64-encoded payloads, and normalizes messy raw endpoints into cleanly typed objects.

Perfect for both advanced developers and **vibe-coders** wanting a seamless way to interact with EcoleDirecte.

- **Compatibility**: Works seamlessly on **Bun**, **Node.js**, and in the **Browser**.
- **Student Accounts**: Fully supports most Student (`E`) account features. *(Parent account support planned for a future release!)*

---

### Installation

```bash
# Using bun
bun add linkdirecte
# Using npm
npm install linkdirecte
```

---

### Complete Example

A robust, single-file example showing how to configure persistent encrypted storage, log in with 2FA support, retrieve grades/homework, and start real-time polling:

```typescript
import {
  configure,
  login,
  getGrades,
  getHomework,
  fileStorage,
  startPolling,
  on
} from "linkdirecte";

// 1. Configure persistent storage and 2FA prompt
configure({
  storage: fileStorage("./my_session.json", "ENCRYPTION_SECRET_KEY"),
  on2faRequired: async (question, choices) => {
    console.log(`🔒 2FA Needed: ${question}`);
    choices.forEach((choice, i) => console.log(`[${i}] ${choice}`));
    // Return the index of your choice
    return 0;
  }
});

async function main() {
  try {
    // 2. Perform Login (remembers session across restarts)
    const loginResult = await login("my_username", "my_password", {
      rememberMe: true,
    });

    const user = "user" in loginResult ? loginResult.user : loginResult;
    console.log(`👋 Welcome, ${user.firstName} ${user.lastName}!`);

    // 3. Retrieve Grades
    const gradesData = await getGrades();
    console.log(`📈 GPA (Moyenne): ${gradesData.averages?.[0]?.average ?? "N/A"}`);

    // 4. Retrieve Homework (with contents auto-decoded from Base64)
    const homework = await getHomework({ withContent: true });
    console.log("📅 Upcoming homework days:", Object.keys(homework).slice(0, 3));

    // 5. Start real-time polling for new events
    startPolling({ interval: 60000 });

    on("newGrade", (grade) => {
      console.log(`🔔 New Grade: [${grade.subjectLabel}] ${grade.value}/${grade.outOf}`);
    });

    on("newMessage", (message) => {
      console.log(`✉️ New Message from ${message.fromName}: ${message.subject}`);
    });

  } catch (error) {
    console.error("❌ Linkdirecte Error:", error);
  }
}

main();
```

---

### API Modules Summary

Linkdirecte wraps all parts of EcoleDirecte into simple, intuitive asynchronous functions:

* **Authentication**: `login()`, `logout()`, `refreshToken()`, `loadSession()`
* **Homework**: `getHomework()`, `getHomeworkForDate()`, `markAsDone()`
* **Grades**: `getGrades()`
* **Timetable**: `getTimetable()`, `getTimetableIcalUrl()`
* **Messages**: `getMessages()`, `getMessage()`, `sendMessage()`
* **Cloud Files**: `getCloud()`, `createFolder()`, `deleteNodes()`
* **Administrative Docs**: `getDocuments()`
* **Quizzes & Forms**: `getQcms()`, `getQcmDetail()`, `submitQcmAnswer()`, `updateQcmStatus()`
* **School Life**: `getAttendance()` (Absences, delays, punitives points)
* **Timeline Feed**: `getTimeline()`, `getCommonTimeline()`
* **Real-time Listening**: `startPolling()`, `on("newGrade")`, `on("newMessage")`, `on("newTimelineEntry")`
* **Prefetch & Cache**: `prefetchAll()`, `startAutoPrefetch()`, `stopAutoPrefetch()`

---

<p align="center">
  <a href="https://github.com/Scolup/Linkdirecte/graphs/contributors"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/contributors/Scolup/Linkdirecte.svg?preset=gradient&amp;names=true&amp;mode=dark" /><img alt="contributors" src="https://shieldcn.dev/contributors/Scolup/Linkdirecte.svg?preset=gradient&amp;names=true&amp;mode=light" /></picture></a>
</p>

<p align="center">
  <picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/chart/npm/linkdirecte.svg?logo=false&amp;title=npm+downloads+%28365+days%29" /><img alt="chart" src="https://shieldcn.dev/chart/npm/linkdirecte.svg?mode=light&amp;logo=false&amp;title=npm+downloads+%28365+days%29" /></picture>
</p>
