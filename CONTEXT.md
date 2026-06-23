# ZGW Office Add-in

A Microsoft Office add-in (Word and Outlook) that lets municipal employees attach documents to ZGW case records without leaving their Office application.

## Language

### Case management (ZGW domain)

**Zaak**:
A case record in the ZGW system, identified by a human-readable `identificatie`. The central entity users search for before attaching documents.
_Avoid_: Case, dossier, ticket

**ZaakType**:
The schema for a zaak — defines which document types (informatieobjecttypen) are permitted for that category of case.
_Avoid_: Case type, zaak category

**InformatieObjectType**:
A permitted document category defined by the zaaktype. The user selects one when uploading a document to a zaak.
_Avoid_: Document type, attachment type

**Informatieobject** (EnkelvoudigInformatieObject):
The actual document stored in Open Zaak's DRC after upload. Created by the backend when the user submits the upload form.
_Avoid_: File, attachment, document record

**Identificatie**:
The human-readable identifier used to search for a zaak (e.g. `"ZAAK-2026-0000000001"`). Not the internal UUID.
_Avoid_: ID, zaak ID, zaak number

**Bronorganisatie**:
The RSIN of the originating organisation. Pulled from the zaak and stamped onto every informatieobject the add-in creates.
_Avoid_: Organisation, RSIN

**Gebruiksrechten**:
Usage rights record required by Open Zaak on every uploaded informatieobject.
_Avoid_: Permissions, rights

### Add-in architecture

**Taskpane**:
The Office add-in panel rendered alongside the document or mail item. The primary UI surface the user interacts with.
_Avoid_: Sidebar, panel, add-in UI

**Bootstrap token**:
The short-lived JWT obtained from `Office.auth.getAccessToken()`. Sent by the frontend to the backend in the `Authorization` header. The backend decodes it (without signature verification) to extract user info.
_Avoid_: Access token, Office token, SSO token

**NLX audit header** (`X-NLX-Logrecord-ID`):
A required header on every call to the ZGW APIs that identifies the request for audit trail purposes. Derived from the correlation ID or user's `uti` claim.
_Avoid_: Correlation ID (that's a different header: `X-Correlation-ID`)

**ZRC** (Zaak Registration Component):
The Open Zaak API surface for reading and managing zaken and zaaktypen.

**DRC** (Document Registration Component):
The Open Zaak API surface for creating and managing informatieobjecten and gebruiksrechten.

## Example dialogue

> **Dev**: When the user clicks "upload", what exactly gets sent to Open Zaak?
>
> **Domain expert**: First we create an informatieobject in the DRC — that's the document itself with its metadata: titel, creatiedatum, bronorganisatie (taken from the zaak), taal (always Dutch), and the base64-encoded file content. Then we attach gebruiksrechten to it. Finally we link the informatieobject to the zaak via a zaakinformatieobject in the ZRC.
>
> **Dev**: So the zaak itself doesn't change?
>
> **Domain expert**: Correct. The zaak record stays as-is; we only add the link between the zaak and the new informatieobject.
>
> **Dev**: And how does the frontend know which informatieobjecttypen to offer the user?
>
> **Domain expert**: We read them from the zaaktype. Each zaaktype declares which informatieobjecttypen are allowed — that list becomes the dropdown in the taskpane.
