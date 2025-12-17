/**
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

export const defaultError = {
  title: "Fout",
  message:
    "Er is een onbekende fout opgetreden bij het verwerken van uw verzoek. Probeer het later opnieuw.",
};

export const errorMessages: Record<number, { title: string; message: string }> = {
  13001: {
    title: "Niet aangemeld bij Office",
    message:
      "U bent niet aangemeld bij Office. Meld u aan met uw werk- of schoolaccount en probeer het opnieuw.",
  },

  13002: {
    title: "Toestemming vereist",
    message:
      "U heeft nog geen toestemming gegeven om deze toepassing te gebruiken. Geef toestemming en probeer het opnieuw.",
  },

  13003: {
    title: "Aanmelding geannuleerd",
    message: "De aanmelding is geannuleerd. Start de aanmelding opnieuw om verder te gaan.",
  },

  13004: {
    title: "Ongeldige configuratie",
    message:
      "De toepassing is onjuist geconfigureerd (ongeldige bron-URL in het manifest). Neem contact op met de beheerder.",
  },

  13006: {
    title: "Automatisch aanmelden niet mogelijk",
    message:
      "Office kan u op dit moment niet automatisch aanmelden. Dit kan worden veroorzaakt door browserinstellingen, privacybeperkingen of meerdere aangemelde accounts. Probeer het opnieuw of meld u opnieuw aan bij Office.",
  },

  13007: {
    title: "Onjuiste toepassingstoegang",
    message:
      "Deze toepassing heeft geen toegang tot de gevraagde resource. Controleer of u bent aangemeld met het juiste account of neem contact op met de beheerder.",
  },

  13012: {
    title: "Niet ondersteund",
    message: "Deze functionaliteit wordt niet ondersteund in deze versie of omgeving van Office.",
  },
};
