<p align="center">
    <picture><source media="(prefers-color-scheme: light)" srcset="https://shieldcn.dev/header/glow.svg?title=Linkdirecte&subtitle=Your+first-rate+SDK+for+working+with+EcoleDirecte+data.&logo=data%3Aimage%2Fsvg%2Bxml%2C%3Csvg+xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27+fill%3D%27none%27+viewBox%3D%270+0+24+25%27%3E%3Cpath+fill%3D%27%2523000%27+d%3D%27M21+11.5c-.3-3.2-4.5-5.6-9.4-5.2s-8.8+4-8.6+7.3c0+0+1.8-5.6+8-6.1+4-.3+7.4+1.5+7.6+4.2.2+2.1-2+4.1-5+5q-.6+0-.4-.3+0-.3-.2-.3l-1.8.1H9.7l-.3-.3.3-1.8.2-1.3.3-1.6c1-2.3-1.5-2.2-1.6-1.6v.8L8+13c-.4+2.1-.8+4.4-.6+4.5q2.5.9+5+.6c5-.4+8.9-3.3+8.6-6.6%27%2F%3E%3C%2Fsvg%3E&mode=light&theme=blue&align=left" /><img alt="Linkdirecte, your first-rate SDK for working with EcoleDirecte data." src="https://shieldcn.dev/header/glow.svg?title=Linkdirecte&subtitle=Your+first-rate+SDK+for+working+with+EcoleDirecte+data.&logo=data%3Aimage%2Fsvg%2Bxml%2C%3Csvg+xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27+fill%3D%27none%27+viewBox%3D%270+0+24+25%27%3E%3Cpath+fill%3D%27%2523000%27+d%3D%27M21+11.5c-.3-3.2-4.5-5.6-9.4-5.2s-8.8+4-8.6+7.3c0+0+1.8-5.6+8-6.1+4-.3+7.4+1.5+7.6+4.2.2+2.1-2+4.1-5+5q-.6+0-.4-.3+0-.3-.2-.3l-1.8.1H9.7l-.3-.3.3-1.8.2-1.3.3-1.6c1-2.3-1.5-2.2-1.6-1.6v.8L8+13c-.4+2.1-.8+4.4-.6+4.5q2.5.9+5+.6c5-.4+8.9-3.3+8.6-6.6%27%2F%3E%3C%2Fsvg%3E&mode=dark&theme=blue&align=left" /></picture>
</p>

<p align="center">
  <picture><source media="(prefers-color-scheme: light)" srcset="https://shieldcn.dev/group/npm/linkdirecte+github/Scolup/Linkdirecte/stars+github/Scolup/Linkdirecte/license+badge/Actively-maintained-22c55e.svg?variant=secondary&amp;theme=blue&amp;mode=light" /><img alt="badge group" src="https://shieldcn.dev/group/npm/linkdirecte+github/Scolup/Linkdirecte/stars+github/Scolup/Linkdirecte/license+badge/Actively-maintained-22c55e.svg?variant=secondary&amp;theme=blue" /></picture>
</p>

## ⭐️ Features

* 🌳 Tree-shakeable
* 🚪 Login fully handled (2FA, GTK, cn/cv, session refresh…)
* 🛣️ Built-in proxy support (for web usage)
* 🧠 Simple and type-safe data manipulation
* 💡 Output simplified
* 🛜 Offline handled
* 🎓 Support for most student features _(parent accounts soon!)_
* 🌐 Compatible with Node.js 18+, Bun, Deno, browsers, browser extensions (MV3), Cloudflare Workers, Vercel Edge, React Native / Expo (Hermes), Capacitor / Cordova, Electron, and more
* 🔒 No password stored
* 🔐 Encryption helpers work everywhere (auto-polyfilled via msrcrypto on runtimes without native Web Crypto)

## 🚀 Quick start

Linkdirecte is available as an **npm package**.

```bash
npm install linkdirecte
```

```bash
bun install linkdirecte
```

Easily log in _(Linkdirecte will handle the rest!)_ :

```typescript
import { login } from "linkdirecte"

const result = await login("youridentifiant", "yourpassword", {
  on2faRequired: (question, choices) => {
    // Handle 2FA challenge
    console.log("Security question:", question)
    console.log("Choices:", choices)
    // Return the index of the selected choice
    return 0 // Example: select first choice
  }
})
// Linkdirecte saves the token silently and will automatically use it for subsequent requests. You never need to handle login again!
```

Now you can call the API methods you need without worrying about authentication.

```typescript
import { getGrades } from "linkdirecte"

const gradesResult = await getGrades()

console.log("Grades:", gradesResult.grades)
console.log("Subjects:", gradesResult.subjects)
```

Full docs are available in [the `docs` directory](docs/).

## ⚖️ Legal

Linkdirecte is licensed under the **Affero General Public License 3** (AGPL 3). No warranty. This means if you use Linkdirecte in your project and make it publicly available by any way (executable, website, server...), you _must_ make it open-source under the same license.

This project is **not affiliated** in any way with Aplim.

> [!IMPORTANT]
> This software was built in the goal of making data handling easier for anyone working with EcoleDirecte’s data. **Please don’t use this for malicious purposes.**
