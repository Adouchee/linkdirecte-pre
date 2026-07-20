<p align="center">
  <picture><source media="(prefers-color-scheme: light)" srcset="https://shieldcn.dev/header/glow.svg?title=Documents&amp;subtitle=Learn+how+to+get+documents+with+Linkdirecte.&amp;logo=lu%3AFileText&amp;mode=light&amp;theme=blue&amp;align=left" /><img alt="Documents | Learn how to get documents with Linkdirecte." src="https://shieldcn.dev/header/glow.svg?title=Documents&amp;subtitle=Learn+how+to+get+documents+with+Linkdirecte.&amp;logo=lu%3AFileText&amp;mode=dark&amp;theme=blue&amp;align=left" /></picture>
</p>

The Documents module provides straightforward access to official school paperwork, such as school invoices, quarterly report cards, or administrative PDF documents.

---

## 🚀 Getting Started

Let's retrieve the list of available school documents and see what's ready to download.

```typescript
import { getDocuments, download } from "linkdirecte";
import { writeFile } from "node:fs/promises";

// Fetch lists of invoices, report cards, etc.
const result = await getDocuments();

// Check if any report cards (bulletins) are available under the "grades" document array
const latestReportCard = result.grades?.[0];

if (latestReportCard && latestReportCard.url) {
  console.log(`Downloading report card: ${latestReportCard.label}...`);

  // Download the file as an ArrayBuffer (default)
  const fileData = await download(latestReportCard.url);

  // Save it locally!
  await writeFile(`./${latestReportCard.label}.pdf`, Buffer.from(fileData));
  console.log("Download complete!");
} else {
  console.log("No report cards available to download.");
}
```

---

## 📖 API Reference

### `getDocuments`

Fetches categorized folders of files made available to the student.

```typescript
function getDocuments(options?: {
  explain?: boolean;
}): Promise<DocumentsResult>
```

#### Parameters

- `options` *(optional)*:
  - `explain` *(boolean)*: Includes debugging parameters under `_debug`.

#### Returns

A promise that resolves to a `DocumentsResult` object containing document lists grouped by categories.

---

## 🗂️ Type Definitions

### `DocumentsResult`

EcoleDirecte categorizes documents into distinct buckets. This object maps each bucket:

```typescript
interface DocumentsResult {
  factures: DocumentEntry[];           // Invoices & financial documents
  grades?: DocumentEntry[];            // Quarterly report cards / transcripts
  viescolaire?: DocumentEntry[];       // Absences, behavior, and school life reports
  administratives?: DocumentEntry[];   // Registration files, forms, etc.
  toUploadList?: DocumentEntry[];      // List of documents the school expects you to upload
}
```

### `DocumentEntry`

Provides all the metadata you need to describe and download a specific document:

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `number` | Unique ID of the document. |
| `label` | `string` | The title/label of the document (e.g., `"Bulletin du 1er Trimestre"`). |
| `date` | `Date` | The official publication date of this document. |
| `libelleMatiere` | `string` *(optional)* | Subject label if related to a specific class. |
| `nomProf` | `string` *(optional)* | Teacher related to the document. |
| `size` | `number` *(optional)* | Size of the document file in bytes. |
| `url` | `string` *(optional)* | The secure download URL. Pass this URL to `download()` to fetch the file! |
| `studentId` | `string` *(optional)* | The ID of the student associated with the document. |
| `signatureDemandee` | `boolean` *(optional)* | Whether parents or students are required to electronically sign this document. |
| `type` | `string` *(optional)* | Category code. |
