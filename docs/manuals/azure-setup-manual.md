# Azure Registration Manual ZGW Office Add-In

## Introduction
This user guide is intended for the administrators of the Azure environment of the respective municipality.
This guide will describe how the add-in can be registered within the Azure environment.

## The Manual
To register an add-in within your azure environment you can follow the official manual of microsoft [here](https://learn.microsoft.com/en-us/office/dev/add-ins/develop/register-sso-add-in-aad-v2). Using this manual there are a few inputs that which can be filled in like the following

## Register the add-in with Microsoft identity platform
For the example we use the name of "zgw-office-add-in".

The redirect URI can be the following.
![Redirect-URI](./images/azure-registratie/redirect_uri.png)

## Expose a web API
Replace client_id with your own client_id. This will have been generated and can be found in the overview page under Applicatien (client) ID.

The application ID URI is "api//zgw-office-addin-dev-frontend.dimpact.lifely.nl/<client_id>".

## Add Microsoft Graph permissions
Select the following permissions
![Machtigingen](./images/azure-registratie/machtigingen.png)