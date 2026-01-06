
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

## 3. Use office-addin-debugging

💡 **Start & Stop Commands**

These commands sideload your add-in into Office (desktop or web):

```bash
# Start sideloading & hosting
npx office-addin-debugging start ./office-add-in/manifest-office.xml desktop

# Stop sideloading & unregister
npx office-addin-debugging stop ./office-add-in/manifest-office.xml desktop
```

`desktop` tells the tool to sideload into the Office desktop application.

You can specify a host app by adding `--app <app>` (e.g., `--app excel`, `--app word`, `--app outlook`) if you want to target one specific Office host.  
If you don’t specify an app, the tool will open the host(s) defined in the manifest.

**Always run the stop command when you are done to unregister the add-in and stop the server** — closing terminals or Office alone doesn’t clean up registration.

---

## 4. Desktop Office Sideload (Mac & Windows)

Below are the ways to load your add-in manifest locally in desktop Office if the CLI doesn’t automatically open it or you want to test manually.

### 📍 On Mac (Office Desktop)

#### Word/Excel/PowerPoint

You can sideload an add-in by copying the manifest into the application’s WEF folder:

1. Open Finder
2. Go to:
	- `~/Library/Containers/com.microsoft.Word/Data/Documents/wef`
	- `~/Library/Containers/com.microsoft.Excel/Data/Documents/wef`
	- `~/Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef`
3. Copy your `manifest-office.xml` into the appropriate folder
4. Restart the Office app
5. In the application UI:  
	**Insert > Add-ins > My Add-ins** and open your add-in from the list.

If the `wef` folder doesn’t exist, create it manually.

---

### 📍 On Windows (Office Desktop)

On Windows, there isn’t a simple WEF folder method. Instead:

**Using Shared Folder (Trusted Catalog)**

1. Create a local folder (e.g., `C:\OfficeAddInManifests`)
2. Place your manifest(s) there
3. In an Office app (Word, Excel, PowerPoint):
	- **Insert > My Add-ins > Shared Folder > Add a shared folder**
	- Select your folder with the manifest
	- Load the add-in from the list

This method uses a trusted catalog that Office reads for sideloaded add-ins.

📌 For some Office versions, you may need to configure registry keys for Trusted Catalogs. Windows sideloading of manifest files isn’t as automatic as on Mac and relies on shared catalogs or using the office-addin-debugging tool. [See Microsoft Docs](https://learn.microsoft.com/en-us/office/dev/add-ins/testing/create-a-network-shared-folder-catalog-for-task-pane-and-content-add-ins)

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

1. Go to [Outlook Client Store](https://outlook.office365.com/mail/inclientstore)
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

## Summary of Commands

```bash
# Build and serve
npm install
npm run build
npm start

# Sideload via CLI
npx office-addin-debugging start ./office-add-in/manifest-office.xml desktop
npx office-addin-debugging stop ./office-add-in/manifest-office.xml desktop
```

Use these commands whenever you want to load/unload your add-in for testing or debugging.

---

## Links & References

- [Microsoft: Sideload Office Add-ins on Mac](https://learn.microsoft.com/en-us/office/dev/add-ins/testing/sideload-office-add-ins-on-mac)
- [Microsoft: Sideload Outlook Add-ins for testing](https://learn.microsoft.com/en-us/office/dev/add-ins/testing/sideload-outlook-add-ins-for-testing)
- [Microsoft: office-addin-debugging CLI](https://www.npmjs.com/package/office-addin-debugging)

