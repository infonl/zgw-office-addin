#!/bin/bash

#
# SPDX-FileCopyrightText: 2023 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+
#


# note that this script is run as the 'openzaak' user (see the Dockerfile of Open Zaak) so
# we do not need to change any file or directory permissions here

echo -e "Starting OpenZaak.."

/start.sh
