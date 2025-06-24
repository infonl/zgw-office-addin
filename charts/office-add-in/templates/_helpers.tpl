{{/*
Expand the name of the chart.
*/}}
{{- define "office-add-in.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "office-add-in.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "office-add-in.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified name for frontend service.
We truncate at 57 chars in order to provide space for the suffix
*/}}
{{- define "office-add-in.frontend.fullname" -}}
{{ include "office-add-in.fullname" . | trunc 57 | trimSuffix "-" }}-frontend
{{- end }}

{{/*
Create a default fully qualified name for backend service
We truncate at 57 chars in order to provide space for the suffix
*/}}
{{- define "office-add-in.backend.fullname" -}}
{{ include "office-add-in.fullname" . | trunc 25 | trimSuffix "-" }}-backend
{{- end }}

{{/*
Common labels
*/}}
{{- define "office-add-in.all.labels" -}}
helm.sh/chart: {{ include "office-add-in.chart" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "office-add-in.labels" -}}
{{ include "office-add-in.all.labels" . }}
{{ include "office-add-in.selectorLabels" . }}
{{- end }}

{{- define "office-add-in.frontend.labels" -}}
{{ include "office-add-in.all.labels" . }}
{{ include "office-add-in.frontend.selectorLabels" . }}
{{- end }}

{{- define "office-add-in.backend.labels" -}}
{{ include "office-add-in.all.labels" . }}
{{ include "office-add-in.backend.selectorLabels" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "office-add-in.selectorLabels" -}}
app.kubernetes.io/name: {{ include "office-add-in.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "office-add-in.frontend.selectorLabels" -}}
app.kubernetes.io/name: frontend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "office-add-in.backend.selectorLabels" -}}
app.kubernetes.io/name: backend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
