<p align="center">
  <picture><source media="(prefers-color-scheme: light)" srcset="https://shieldcn.dev/header/glow.svg?title=Cloud&amp;subtitle=Learn+how+to+get+cloud+data+with+Linkdirecte.&amp;logo=lu%3ACloud&amp;mode=light&amp;theme=blue&amp;align=left" /><img alt="Cloud | Learn how to get cloud data with Linkdirecte." src="https://shieldcn.dev/header/glow.svg?title=Cloud&amp;subtitle=Learn+how+to+get+cloud+data+with+Linkdirecte.&amp;logo=lu%3ACloud&amp;mode=dark&amp;theme=blue&amp;align=left" /></picture>
</p>

The Cloud module gives you full access to EcoleDirecte's "Porte-documents" (document holder / personal cloud storage). This allows students to retrieve personal files, organize their workspaces into folders, and clean up unwanted documents.

---

## 🚀 Getting Started

Let's fetch the contents of the student's personal cloud and traverse the folder structure.

```typescript
import { getCloud } from "linkdirecte";

// Retrieve the files and folders up to a depth of 3 folders deep
const cloudItems = await getCloud({ depth: 3 });

console.log(`You have ${cloudItems.length} top-level files or folders.`);

cloudItems.forEach(item => {
  if (item.type === "folder") {
    console.log(`📁 Folder: ${item.label} (contains ${item.children?.length ?? 0} items)`);
  } else {
    console.log(`📄 File: ${item.label} (${(item.size / 1024).toFixed(1)} KB)`);
  }
});
```

---

## 📖 API Reference

### `getCloud`

Fetches all files and folders available in the student's personal space.

```typescript
function getCloud(options?: GetCloudOptions): Promise<CloudEntry[]>
```

#### Parameters

- `options` *(optional)*:
  - `depth` *(number)*: How many folders deep the SDK should scan and build children arrays for. Defaults to `3`.
  - `explain` *(boolean)*: Includes request dumps, logs, and caching details in `_debug`.

---

### `createFolder`

Creates a new folder under a parent directory.

```typescript
function createFolder(
  name: string,
  parentNode: CloudNode,
  options?: { explain?: boolean }
): Promise<CloudNode>
```

#### Parameters

- `name` *(string)*: The name for your new folder.
- `parentNode` *(CloudNode)*: The folder node where your new folder should be created.
- `options` *(optional)*: `{, explain?: boolean }`.

#### Example

```typescript
import { getCloud, createFolder } from "linkdirecte";

const tree = await getCloud();
const myParentFolder = tree.find(node => node.type === "folder" && node.label === "My Documents");

if (myParentFolder) {
  const newFolder = await createFolder("Math Homework", myParentFolder);
  console.log(`Successfully created folder: ${newFolder.label}`);
}
```

---

### `deleteNodes`

Moves files or folders to the Recycle Bin / Trash.

```typescript
function deleteNodes(
  nodes: CloudNode[],
  options?: { explain?: boolean }
): Promise<{ success: boolean }>
```

#### Parameters

- `nodes` *(CloudNode[])*: An array of file or folder nodes to delete.
- `options` *(optional)*: `{, explain?: boolean }`.

#### Example

```typescript
import { getCloud, deleteNodes } from "linkdirecte";

const tree = await getCloud();
const oldFile = tree.find(node => node.type === "file" && node.label === "temporary_draft.txt");

if (oldFile) {
  const result = await deleteNodes([oldFile]);
  if (result.success) {
    console.log("File successfully moved to trash!");
  }
}
```

---

## 🗂️ Type Definitions

### `CloudNode`

Represents either a folder or a file inside the EcoleDirecte cloud:

```typescript
interface CloudNode {
  id: string;               // Unique string ID of the file or folder
  type: "file" | "folder";  // Node type
  label: string;            // Name of the file or folder
  date: string;             // Date string when created or updated
  size: number;             // File size in bytes
  isReadOnly: boolean;      // True if the node is write-protected
  isHidden: boolean;        // True if the item is hidden
  isTrash: boolean;         // True if the item is currently in the trash
  isLoaded?: boolean;       // Indicates if subfolders have been loaded
  quota?: number;           // Space limit in bytes (usually present on top folder)
  displayText?: string;     // Friendly display string
  children?: CloudNode[];   // Child nodes (if a folder)
  owner?: {
    id: number;
    type: string;
    nom: string;
    prenom: string;
    particule: string;
  };
}
```

### `CloudEntry`

A simple union representing the entries returned:

```typescript
type CloudEntry = CloudFolderNode | CloudFileNode;

interface CloudFolderNode extends CloudNode {
  type: "folder";
  children: CloudNode[];
}

interface CloudFileNode extends CloudNode {
  type: "file";
}
```
