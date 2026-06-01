#!/bin/sh
# SPDX-FileCopyrightText: 2026 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

# Seed Open Zaak with the E2E test zaak.
#
# The catalogi data (Catalogus, ZaakType, InformatieObjectType) is already
# created by the SQL files in openzaak-database/database/ which run via
# fill-data-on-startup.sh when the database is first initialised.
#
# This script only creates the Zaak itself, which cannot be done via SQL
# because it requires Open Zaak's Django application to be running.
#
# Idempotent: get_or_create skips creation if ZAAK-2026-0000000001 already exists.

set -e

echo "[init] Seeding ZAAK-2026-0000000001 zaak in Open Zaak..."

python /app/src/manage.py shell << 'EOF'
import datetime, uuid, sys

from openzaak.components.catalogi.models import ZaakType
from openzaak.components.zaken.models import Zaak

# The zaaktype is seeded by 2-setup-zaaktype-test-3.sql
ZAAKTYPE_UUID = "448356ff-dcfb-4504-9501-7fe929077c4f"
E2E_IDENTIFICATIE = "ZAAK-2026-0000000001"

try:
    zaaktype = ZaakType.objects.get(uuid=ZAAKTYPE_UUID)
    print(f"[init] Found zaaktype: {zaaktype.zaaktype_omschrijving}")
except ZaakType.DoesNotExist:
    print(f"[init] ERROR: ZaakType {ZAAKTYPE_UUID} not found — SQL seed may not have run yet", file=sys.stderr)
    sys.exit(1)

zaak, created = Zaak.objects.get_or_create(
    identificatie=E2E_IDENTIFICATIE,
    defaults={
        "uuid": uuid.uuid4(),
        "bronorganisatie": "000000000",
        "omschrijving": "E2E Test Zaak",
        "zaaktype": zaaktype,
        "verantwoordelijke_organisatie": "000000000",
        "startdatum": datetime.date.today(),
        "registratiedatum": datetime.date.today(),
        "archiefstatus": "nog_te_archiveren",
    },
)
print(f"[init] Zaak {E2E_IDENTIFICATIE}: {'created' if created else 'already exists'}")
print("[init] Done.")
EOF
