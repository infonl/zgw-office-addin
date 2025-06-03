-- SPDX-FileCopyrightText: 2025 INFO.nl
-- SPDX-License-Identifier: EUPL-1.2+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO catalogi_catalogus (naam, uuid, domein, rsin, contactpersoon_beheer_naam, contactpersoon_beheer_telefoonnummer, contactpersoon_beheer_emailadres, _etag, begindatum_versie, versie) VALUES
    ('office-add-in', '8225508a-6840-413e-acc9-6422af120db1', 'ALG', '002564440', 'OAI Test Catalogus', '06-12345678', 'noreply@example.com', '_etag', NULL, '');

INSERT INTO authorizations_applicatie (uuid, client_ids, label, heeft_alle_autorisaties) VALUES (uuid_generate_v4(), '{office-add-in}', 'Office Add-in', true);

INSERT INTO vng_api_common_jwtsecret (identifier, secret) VALUES ('office-add-in', 'openzaakOfficeAddInSecret');