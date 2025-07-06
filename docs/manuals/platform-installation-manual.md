# ZGW Office Add-In Componenten Installatie

De ZGW Office Add-In bestaat uit verschillende componenten die samen zorgen voor de integratie met Microsoft Word en de 
ZGW APIs. Deze componenten moeten correct worden geïnstalleerd en geconfigureerd om de add-in goed te laten 
functioneren.

## Componenten overzicht
De ZGW Office Add-In bestaat uit de volgende componenten:
- **ZGW Office Add-In**: De add-in die geïnstalleerd is in de Microsoft Word desktop en webversie. Deze add-in is beschikbaar voor installatie vanuit de ZGW Office Frontend Proxy via een `metadata.xml` bestand.
- **ZGW Office Frontend Proxy**: Een proxy service die de communicatie tussen de ZGW Office Add-In en de ZGW Office Backend Service mogelijk maakt. Deze service is verantwoordelijk voor het doorsturen en valideren van verzoeken van de add-in.
- **ZGW Office Backend Service**: De backend service die de communicatie met de ZGW APIs mogelijk maakt. Deze service is verantwoordelijk voor verdere koppelingen binnen het Applications Platform waarin de ZGW APIs en Objecten API draaien.

Zie voor meer informatie de [C4 Context Diagram](https://c4model.com/diagrams/system-context) documentatie.

## Voorbereiding
Voordat u begint met de installatie, zorg ervoor dat u de volgende stappen hebt voltooid:

Zorg dat een URL beschikbaar is waar de ZGW Office Add-In kan worden gehost, deze locatie is nodig voor de 
configuratie.

Maak een secret key aan die gebruikt wordt voor het genereren en valideren van JWT tokens voor veilige communicatie 
tussen de add-in backend en Open Zaak API's. Deze sleutel moet veilig worden bewaard en niet openbaar worden gemaakt.

## Installatie van de ZGW Office Add-In

De installatie van de ZGW Office Add-In bestaat uit het installeren van de frontend en backend componenten. Hiervoor is
een Helm chart beschikbaar die de installatie en configuratie van deze componenten vereenvoudigt.

De Helm chart voor de ZGW Office Add-In is beschikbaar op https://infonl.github.io/zgw-office-addin/ en kan worden toegevoegd aan uw Helm repository met de volgende commando's:

```bash 
helm repo add officeaddin https://infonl.github.io/zgw-office-addin/
helm repo update
```

### Helm chart en values
De definitie van de Helm chart is te vinden in de `charts/office-add-in` directory van de repository, daar staat ook
een [README.md](../../charts/office-add-in/README.md) bestand met meer informatie over de installatie en configuratie 
van de add-in.

Controleer de `values.yaml` file in de Helm chart voor de configuratie opties. De belangrijkste opties die aangepast
moeten worden zijn:
- `backend.apiBaseUrl`: De basis URL van de Open Zaak API's die de add-in gebruikt.
- `backend.jwtSecret`: De secret key die gebruikt wordt voor het genereren en valideren van JWT tokens.
