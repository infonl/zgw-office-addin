{{/*
Expand the name of the chart.
*/}}
{{- define "podiumd-office-plugin.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "podiumd-office-plugin.fullname" -}}
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
{{- define "podiumd-office-plugin.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified name for frontend service.
We truncate at 57 chars in order to provide space for the suffix
*/}}
{{- define "podiumd-office-plugin.frontend.fullname" -}}
{{ include "podiumd-office-plugin.fullname" . | trunc 57 | trimSuffix "-" }}-frontend
{{- end }}

{{/*
Create a default fully qualified name for backend service
We truncate at 57 chars in order to provide space for the suffix
*/}}
{{- define "podiumd-office-plugin.backend.fullname" -}}
{{ include "podiumd-office-plugin.fullname" . | trunc 25 | trimSuffix "-" }}-backend
{{- end }}

{{/*
Common labels
*/}}
{{- define "podiumd-office-plugin.all.labels" -}}
helm.sh/chart: {{ include "podiumd-office-plugin.chart" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "podiumd-office-plugin.labels" -}}
{{ include "podiumd-office-plugin.all.labels" . }}
{{ include "podiumd-office-plugin.selectorLabels" . }}
{{- end }}

{{- define "podiumd-office-plugin.frontend.labels" -}}
{{ include "podiumd-office-plugin.all.labels" . }}
{{ include "podiumd-office-plugin.frontend.selectorLabels" . }}
{{- end }}

{{- define "podiumd-office-plugin.backend.labels" -}}
{{ include "podiumd-office-plugin.all.labels" . }}
{{ include "podiumd-office-plugin.backend.selectorLabels" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "podiumd-office-plugin.selectorLabels" -}}
app.kubernetes.io/name: {{ include "podiumd-office-plugin.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "podiumd-office-plugin.frontend.selectorLabels" -}}
app.kubernetes.io/name: frontend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "podiumd-office-plugin.backend.selectorLabels" -}}
app.kubernetes.io/name: backend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
