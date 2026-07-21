# zgw-office-addin

![Version: 0.0.90](https://img.shields.io/badge/Version-0.0.90-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 0.2.0](https://img.shields.io/badge/AppVersion-0.2.0-informational?style=flat-square)

A Helm chart for deploying the zgw-office-addin (frontend and backend)

## Usage

Make sure you have helm installed.

If you had already added this repo earlier, run `helm repo update` to retrieve
the latest versions of the packages

Now add the ZAC repo:
```
helm repo add zac https://infonl.github.io/zgw-office-addin
```

And install zac:
```
helm install my-release zac/office-add-in
```

## Changes to the helm chart

The Github workflow will perform helm-linting and will bump the version if needed. This `README.md` file is generated automatically as well.

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| backend.affinity | object | `{}` | Affinity rules for the backend deployment |
| backend.image.pullPolicy | string | `"IfNotPresent"` |  |
| backend.image.repository | string | `"ghcr.io/infonl/zgw-office-addin-backend"` |  |
| backend.image.tag | string | `"v0.9.364@sha256:5dd35fa66cc56b2ed3ee67cdb2f40a2a7a1f990fd26badd32cc70b3b5d97994f"` |  |
| backend.imagePullSecrets | list | `[]` | Image pull secrets for the backend deployment |
| backend.msalSecret | string | `""` | Client secret for MSAL authentication towards Azure AD |
| backend.nodeSelector | object | `{}` | Node selector for the backend deployment |
| backend.podAnnotations | object | `{}` | Pod annotations for the backend deployment |
| backend.podLabels | object | `{}` | Extra pod labels for the backend pod (merged over common.podLabels) |
| backend.podSecurityContext | object | `{"fsGroup":10001}` | Pod security context for the backend deployment |
| backend.resources | object | `{"limits":{"cpu":"500m","memory":"256Mi"},"requests":{"cpu":"100m","memory":"128Mi"}}` | Resource limits and requests for the backend container |
| backend.securityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["ALL"]},"readOnlyRootFilesystem":true,"runAsGroup":10001,"runAsNonRoot":true,"runAsUser":10001}` | Security context for the backend container |
| backend.service.port | int | `3003` |  |
| backend.service.type | string | `"ClusterIP"` |  |
| backend.tolerations | list | `[]` | Tolerations for the backend deployment |
| backend.topologySpreadConstraints | list | `[{"labelSelector":{"matchLabels":{"app.kubernetes.io/instance":"RELEASE-NAME","app.kubernetes.io/name":"backend"}},"maxSkew":1,"topologyKey":"kubernetes.io/hostname","whenUnsatisfiable":"DoNotSchedule"}]` | Topology spread constraints for the backend deployment app.kubernetes.io/instance will be dynamically set to the Helm release name at deployment time. |
| backend.zgwApis | object | `{"secret":"","url":"http://localhost:8020"}` | ZGW API configuration for integration with the ZGW APIs provider (OpenZaak) |
| common.appEnv | string | `"production"` | Application environment, where production and local have special meaning. Other values will be used as-is in the add-in manifest and can be used to differentiate between different non-production environments (e.g. Acc, Test) |
| common.frontendUrl | string | `"http://localhost:3000"` | The frontend public URL where the manifest files and static js file are served |
| common.msalClientId | string | `""` | MS Azure Client ID assigned to the Office Add-in application |
| common.msalTenantId | string | `""` | MS Azure Tenant ID of the Organization |
| common.podLabels | object | `{}` | Extra pod labels applied to BOTH the frontend and backend pods. Useful for observability: set e.g. `app` / `service_name` so the pods are attributed to the add-in instead of the Helm release name in Grafana/Loki. |
| frontend.affinity | object | `{}` | Affinity rules for the frontend deployment |
| frontend.enableHttps | bool | `false` | If enabled nginx will also listen on port 443. You will need to volume map a key and certificate valid for your frontendUrl |
| frontend.image.pullPolicy | string | `"IfNotPresent"` |  |
| frontend.image.repository | string | `"ghcr.io/infonl/zgw-office-addin-frontend"` |  |
| frontend.image.tag | string | `"v0.9.364@sha256:cabfe4079267dda7886957c509de521e0e9e631dadd710145404b2d6ee7fdb32"` |  |
| frontend.imagePullSecrets | list | `[]` | Image pull secrets for the frontend deployment |
| frontend.maxBodySize | string | `"80M"` | Maximum content body size (e.g. for attachments) |
| frontend.nodeSelector | object | `{}` | Node selector for the frontend deployment |
| frontend.podAnnotations | object | `{}` | Pod annotations for the frontend deployment |
| frontend.podLabels | object | `{}` | Extra pod labels for the frontend pod (merged over common.podLabels) |
| frontend.podSecurityContext | object | `{"fsGroup":10001}` | Pod security context for the frontend deployment |
| frontend.resources | object | `{"limits":{"cpu":"250m","memory":"128Mi"},"requests":{"cpu":"50m","memory":"64Mi"}}` | Resource limits and requests for the frontend container |
| frontend.securityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["ALL"]},"readOnlyRootFilesystem":true,"runAsGroup":10001,"runAsNonRoot":true,"runAsUser":10001}` | Security context for the frontend container |
| frontend.service.port | int | `80` |  |
| frontend.service.type | string | `"ClusterIP"` |  |
| frontend.tolerations | list | `[]` | Tolerations for the frontend deployment |
| frontend.topologySpreadConstraints | list | `[{"labelSelector":{"matchLabels":{"app.kubernetes.io/instance":"RELEASE-NAME","app.kubernetes.io/name":"frontend"}},"maxSkew":1,"topologyKey":"kubernetes.io/hostname","whenUnsatisfiable":"DoNotSchedule"}]` | Topology spread constraints for the frontend deployment. app.kubernetes.io/instance will be dynamically set to the Helm release name at deployment time. |

----------------------------------------------
Autogenerated from chart metadata using [helm-docs v1.14.2](https://github.com/norwoodj/helm-docs/releases/v1.14.2)
