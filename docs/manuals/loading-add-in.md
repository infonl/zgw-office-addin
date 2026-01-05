# Loading the ZGW Office Add-In Locally (Mac & Windows)

This guide explains how to load the ZGW Office Add-In into your local Office environment for development and testing purposes.

---

## Prerequisites

- **Node.js** (LTS version recommended)
- **npm** or **yarn**
- **Office** (Word, Excel, or Outlook) installed
- **Office Add-in CLI** (`office-addin-debugging`)

---

## 1. Install Dependencies

```bash
npm install
```

---

## 2. Build the Add-In

```bash
npm run build
```

---

## 3. Start the Local Server

```bash
npm start
```

---

## 4. Sideload the Add-In

### Mac

#### Word/Excel/Outlook (Desktop)

1. Open the Office app (e.g., Word).
2. Go to **Insert > Add-ins > My Add-ins > Shared Folder**.
3. Choose **Add a shared folder** and select the folder containing your manifest file (`manifest.xml`).
4. The add-in should appear in the list. Click to load it.

#### Outlook (Web)

1. Open [Outlook Web](https://outlook.office.com).
2. Go to **Settings > View all Outlook settings > Mail > Customize actions**.
3. Under **Add-ins**, click **Manage add-ins**.
4. Click **Add a custom add-in > Add from file** and select your `manifest.xml`.

---

### Windows

#### Word/Excel/Outlook (Desktop)

1. Open the Office app.
2. Go to **Insert > My Add-ins > Shared Folder**.
3. Add the folder containing your `manifest.xml`.
4. Select the add-in to load it.

#### Outlook (Web)

Same steps as on Mac (see above).

---

## 5. Troubleshooting

- Ensure your local server is running and accessible.
- If the add-in does not appear, restart Office and try again.
- Check for errors in the Office Add-in task pane or browser console.

---

## References

- [Microsoft: Sideload Office Add-ins for testing](https://learn.microsoft.com/en-us/office/dev/add-ins/testing/sideload-office-add-ins-for-testing)
- [Office Add-in CLI](https://www.npmjs.com/package/office-addin-debugging)

---

**Tip:** For rapid development, use the [Office Add-in CLI](https://www.npmjs.com/package/office-addin-debugging) to sideload and debug your add-in:

```bash
npx office-addin-debugging start
```

---

If you encounter issues, consult the repository README or reach out to your team for support.
