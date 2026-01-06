
# Loading the Office Add-In Locally  
*For Developers — Mac & Windows (Desktop and Web/Outlook)*

This document explains how to load and test your Office Add-In locally using the **office-addin-debugging tool** and manual sideloading where needed.

---

## Prerequisites

Before loading your add-in:

- **Node.js** (LTS recommended)  
- **npm** or **yarn**  
- Office desktop apps installed (Word, Excel, PowerPoint, Outlook)  
- Your add-in manifest(s) e.g., `manifest-office.xml`, `manifest-outlook.xml`  
- Optional: **Office Add-in CLI** (`office-addin-debugging`) installed globally or run via `npx`

---

## 1. Install & Build

```bash
npm install
npm run build
```

---

## 2. Start the Local Add-In Server

To host your add-in files locally during development:

```bash
npm run dev
```

---

## 3. Loading the Office Add-in in desktop

### Use office-addin-debugging

💡 **Start & Stop Commands**

These commands sideload your add-in into Office desktop. CAUTION! This is not used for Outlook. Only for Word, Excel and etc.

```bash
# Start sideloading & hosting
npx office-addin-debugging start ./office-add-in/manifest-office.xml desktop

# Stop sideloading & unregister
npx office-addin-debugging stop ./office-add-in/manifest-office.xml desktop
```

`desktop` tells the tool to sideload into the Office desktop application.

The tool will open the host(s) defined in the manifest and you will be able to select from these hosts.

**Always run the stop command when you are done to unregister the add-in and stop the server** — closing terminals or Office alone doesn’t clean up registration.

---

## 5. Outlook Add-In – Desktop & Web

Outlook differs slightly from other Office apps — you add the manifest manually.

### Outlook on Mac (Desktop)

1. Open Outlook
2. Go to **Tools > Get Add-ins**
3. Choose **My Add-ins > Add a custom add-in > Add from file**
4. Select your `manifest-outlook.xml`
5. Your add-in should appear in the ribbon or message surface

### Outlook on Windows (Desktop)

1. Open Outlook
2. Go to **Home > Get Add-ins**
3. Click **My Add-ins**
4. Choose **Add a custom add-in > Add from file**
5. Select `manifest-outlook.xml`
6. The add-in will be installed for the current Outlook profile.

If you are using “New Outlook”, the process may be under **Apps > Add Apps** depending on UI updates.

### Outlook on the Web (OWA)

1. Go to the Outlook Client Store in your browser (for most tenants this is [https://outlook.office.com/mail/inclientstore](https://outlook.office.com/mail/inclientstore); for some regional tenants the domain, such as `outlook.office365.com`, may differ)
2. Click **My add-ins/Mijn invoegtoepassingen**
3. Add a custom add-in
4. Select the **manifest-outlook.xml** and install it
5. After installing reload the page

---

## 6. Troubleshooting Tips

- If an add-in doesn’t appear, restart the Office app.
- Always run `npx office-addin-debugging stop` to remove registrations.
- For Outlook add-ins on Mac, auto-sideloading via the CLI may not reliably register — manual manifest install is recommended.

---