# Azure Registration Manual ZGW Office Add-In

## Introduction
This user guide is intended for the administrators/users of the microsoft Add-In. This guide will describe how the manifest file can be retrieved and configured to load in the office-add-in.
Before following this manual make sure that you have [setup the azure registration](./azure-setup-manual.md) first

## Information about the manifest file
The manifest file serves as a guide for Outlook on how to install and display the add-in. It contains essential information such as the add-in’s title, description, permissions, and the web location where its content is hosted. In this way, the manifest ensures that the add-in is correctly recognized and made available to users within Outlook.

## Retrieve the manifest.xml file
Follow the wollowing steps
1. Open https://zgw-office-addin-dev-frontend.dimpact.lifely.nl/manifest.xml and copy it's content
2. Open a new textfile and paste the content in there
3. In the text file, locate the `<WebApplicationInfo>` section. The values inside this section will need to be updated in the next step.
4. Save the file as "manifest.xml"

## Update the <WebApplicationInfo> values
The `<WebApplicationInfo>` section in the manifest connects the add-in to the correct Azure Active Directory application. You need to replace the placeholder values with the correct information from the registered app in Azure.
Inside the `<WebApplicationInfo>` place the following values

![webAppInfo](./images/setup-manifest/web-app-info.png)

Replace the CLIENT_ID and APP_URI_ID with the correct values from Azure

## Loading the add-in into Office
To load the add-in into office select Add-ins

![Add-Ins](./images/setup-manifest/add-ins.png)

From here select Advanced -> Upload My Add-In -> Browse to your saved manifest.xml and upload it

The Add-In is now available for usage. follow [user-manual](./user-manual.md) for instructions