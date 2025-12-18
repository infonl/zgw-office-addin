# Manifest

This document describes the errors that can occur when loading the Office Add-in manifest.

For information about bootstrap token errors, see [bootstrap-token.md](bootstrap-token.md).

## Error 300 - Add-in Loading Failed

**Error code:** `300`

**When does this error occur:**
- When loading the add-in
- When attempting to remove the add-in

**Possible causes:**
- The manifest.xml is invalid or contains errors
- The add-in is not correctly registered in Office
- Network problems when fetching add-in files
- Conflicting add-ins
- Corrupt Office cache
- SSL certificate not trusted by the browser
- Incorrect URL configuration in manifest
- Formatter has added line breaks in critical manifest values


**Solutions:**
### 1. Validate the Manifest

Validate the manifests with the commands:
```bash
npm run validate:office
npm run validate:outlook
```

### 2. Clear Office Cache

#### Browser Developer Tools (Office Online/Web)

1. Open the add-in in Office Online
2. Open browser Developer Tools (F12)
3. Go to **Application** tab (Chrome/Edge) or **Storage** tab (Safari)
4. Expand **Local Storage** and **Session Storage**
5. Select all entries and delete them
6. Clear **Cache Storage** as well
7. Refresh the page (Ctrl+F5 / Cmd+Shift+R)

#### Desktop Office Cache (macOS)

```bash
# Close all Office applications first
rm -rf ~/Library/Containers/com.microsoft.Outlook/Data/Documents/wef/
rm -rf ~/Library/Containers/com.microsoft.*/Data/Documents/wef/
```

#### Desktop Office Cache (Windows)

1. Close all Office applications
2. Open File Explorer and navigate to:
```
%LOCALAPPDATA%\Microsoft\Office\16.0\Wef
```
3. Delete all contents of this folder
4. Restart Office application

### 3. Remove and Reinstall the Add-in

To successfully remove an add-in in Office and install a new version:

1. **Clear the Office cache** (see step 2 above)
2. The add-in will be automatically removed after clearing the cache
3. Restart the Office application
4. Install the new version of the add-in

#### For Outlook Specifically

1. Clear the cache as described above
2. Navigate to [https://aka.ms/olksideload](https://aka.ms/olksideload)
3. Remove the existing add-in
4. Add the new version of the add-in
5. Reload the page

### 4. Trust SSL Certificate (Development)

If the taskpane doesn't appear when you open the add-in:

1. Open your browser and navigate to: https://localhost:3000/taskpane.html
2. Your browser will show a security warning
3. Click "Advanced" and then "Proceed to localhost" (or similar option)
4. This tells your browser to trust the self-signed certificate
5. Return to Office and reload the add-in
6. The taskpane should now be displayed

**Note:** You need to trust the certificate for the add-in to load properly in Office.

### 5. Check URL Reachability

1. Ensure your development server is running:
```bash
npm run dev
```
2. Verify the URLs in your manifest are accessible
3. Test if https://localhost:3000 loads in your browser

### 6. Try Another Office Application

Test the add-in in another Office application (Word, Excel) to determine if the issue is application-specific or affects all Office applications.

## References

- [Office Add-ins troubleshooting](https://learn.microsoft.com/en-us/office/dev/add-ins/testing/troubleshoot-manifest)
- [Clear Office cache](https://learn.microsoft.com/en-us/office/dev/add-ins/testing/clear-cache)
- [Sideload Outlook add-ins](https://aka.ms/olksideload)


