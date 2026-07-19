<p align="center">
    <picture><source media="(prefers-color-scheme: light)" srcset="https://shieldcn.dev/header/glow.svg?title=Linkdirecte&subtitle=Your+first-rate+SDK+for+working+with+EcoleDirecte+data.&logo=data%3Aimage%2Fsvg%2Bxml%2C%3Csvg+xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27+fill%3D%27none%27+viewBox%3D%270+0+24+25%27%3E%3Cpath+fill%3D%27%2523000%27+d%3D%27M21+11.5c-.3-3.2-4.5-5.6-9.4-5.2s-8.8+4-8.6+7.3c0+0+1.8-5.6+8-6.1+4-.3+7.4+1.5+7.6+4.2.2+2.1-2+4.1-5+5q-.6+0-.4-.3+0-.3-.2-.3l-1.8.1H9.7l-.3-.3.3-1.8.2-1.3.3-1.6c1-2.3-1.5-2.2-1.6-1.6v.8L8+13c-.4+2.1-.8+4.4-.6+4.5q2.5.9+5+.6c5-.4+8.9-3.3+8.6-6.6%27%2F%3E%3C%2Fsvg%3E&mode=light&theme=blue&align=left" /><img alt="Linkdirecte, your first-rate SDK for working with EcoleDirecte data." src="https://shieldcn.dev/header/glow.svg?title=Linkdirecte&subtitle=Your+first-rate+SDK+for+working+with+EcoleDirecte+data.&logo=data%3Aimage%2Fsvg%2Bxml%2C%3Csvg+xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27+fill%3D%27none%27+viewBox%3D%270+0+24+25%27%3E%3Cpath+fill%3D%27%2523000%27+d%3D%27M21+11.5c-.3-3.2-4.5-5.6-9.4-5.2s-8.8+4-8.6+7.3c0+0+1.8-5.6+8-6.1+4-.3+7.4+1.5+7.6+4.2.2+2.1-2+4.1-5+5q-.6+0-.4-.3+0-.3-.2-.3l-1.8.1H9.7l-.3-.3.3-1.8.2-1.3.3-1.6c1-2.3-1.5-2.2-1.6-1.6v.8L8+13c-.4+2.1-.8+4.4-.6+4.5q2.5.9+5+.6c5-.4+8.9-3.3+8.6-6.6%27%2F%3E%3C%2Fsvg%3E&mode=dark&theme=blue&align=left" /></picture>
</p>

<p align="center">
  <picture><source media="(prefers-color-scheme: light)" srcset="https://shieldcn.dev/group/npm/linkdirecte+github/Scolup/Linkdirecte/stars+github/Scolup/Linkdirecte/license+badge/Actively-maintained-22c55e.svg?variant=secondary&amp;theme=blue&amp;mode=light" /><img alt="badge group" src="https://shieldcn.dev/group/npm/linkdirecte+github/Scolup/Linkdirecte/stars+github/Scolup/Linkdirecte/license+badge/Actively-maintained-22c55e.svg?variant=secondary&amp;theme=blue" /></picture>
</p>

**Linkdirecte** is a ultra-modern, blazing fast, resilient, and fully tree-shakable TypeScript/JavaScript SDK for interacting with the private **EcoleDirecte API**.

Whether you are building custom widgets, native mobile apps, desktop clients, or automation dashboards, Linkdirecte handles all the messy protocol details so you can focus on building what matters.

---

## ⭐️ Key Features

- 🌳 **Tree-Shakeable & Lightweight** — Import only what you use, maintaining minimal bundle size.
- 🚪 **Hands-Free Authentication** — Session cookies, tokens, Two-Factor Challenges (2FA), double auth states, and token refreshes are fully automated silently.
- 🛣️ **Built-in Proxy Support** — Perfect for running directly in client web-browsers with standard CORS gateways.
- 🧠 **Type-Safe Mappings** — Dynamic French-to-English translation of API keys, timestamp normalization into JS `Date` objects, and automated Base64 HTML decoding.
- 🛜 **Offline Resilience** — Local caches and built-in offline action queues for marking homework as done.
- 🎓 **Rich Feature Set** — Supports Grades, Timetables, Homework calendars, Messages, Attendance records, Cloud folder management, and more.
- 🌐 **Ubiquitous Compatibility** — Works flawlessly on Node.js 18+, Bun, Deno, modern Web Browsers, Cloudflare Workers, React Native, Capacitor, Electron, etc.
- 🔒 **Secure by Design** — Absolutely zero credentials or passwords stored; supports transparent local AES-GCM data encryption.

---

## 🚀 Quick Start

Get Linkdirecte up and running in under a minute!

### 1. Install the SDK

Using **npm**:
```bash
npm install linkdirecte
```

Using **Bun**:
```bash
bun add linkdirecte
```

### 2. Log In Easily

Let Linkdirecte log you in, handle token storage, and coordinate security questions:

```typescript
import { login } from "linkdirecte";

const result = await login("your_username", "your_password", {
  rememberMe: true, // Auto-saves session for seamless subsequent loads
  on2faRequired: async (question, choices) => {
    console.log("EcoleDirecte Security Question:", question);
    console.log("Choices:", choices);

    // Choose your answer: return either the choice index (number) or text (string)
    return 0; // Selects the first choice
  }
});

console.log(`Success! Logged in as ${result.user.firstName} ${result.user.lastName}`);
```

### 3. Fetch Student Data

Once authenticated, call any of Linkdirecte's modular methods. You never need to handle authorization tokens manually again:

```typescript
import { getGrades } from "linkdirecte";

const gradesResult = await getGrades();

console.log(`Loaded ${gradesResult.grades.length} grades!`);
console.log(`Your average is: ${gradesResult.subjects[0]?.average ?? "N/A"}`);
```

---

## 📖 Comprehensive Documentation

Our documentation is designed to be highly readable and beginner-friendly. For full instructions, configuration guides, and references, explore the **[docs directory](docs/)**:

* [🔑 Authentication & 2FA Setup](docs/auth.md)
* [⚙️ Core SDK Configuration & Encryption](docs/core.md)
* [🎓 Grades & Performance Stats](docs/grades.md)
* [📅 Class Schedules & Timetables](docs/timetable.md)
* [📚 Homework Cahier de Texte](docs/homework.md)
* [✉️ Messaging & Email Inbox](docs/messages.md)
* [🎒 Absences & Lateness Records](docs/attendance.md)
* [☁️ Cloud File Storage & Porte-documents](docs/cloud.md)
* [📄 Official Reports & Documents](docs/documents.md)
* [📝 Online Forms & Quizzes (QCM)](docs/forms.md)
* [🔔 Event Hooks & Polling Systems](docs/listen.md)
* [🗂️ Complete Type Reference](docs/types.md)

---

## ⚖️ License & Legal

Linkdirecte is licensed under the **Affero General Public License v3** (AGPL 3.0).

This means if you utilize Linkdirecte inside a project and make it publicly available (such as an executable download, mobile application, or web/server service), you **must** make your project open-source under the same license terms.

> [!TIP]
> For projects under GPL 3.0, **you don't have to change your license!** GPL and AGPL are fully compatible. You are however required to use AGPL if you host Linkdirecte on a server.

*This project is an independent third-party development and is **not affiliated or sponsored** in any way with Aplim or EcoleDirecte.*

---

<p align="center">
  Made with ❤️ by typeof (Scolup)
</p>
