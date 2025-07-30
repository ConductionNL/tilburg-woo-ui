{{/*
Expand the name of the chart.
*/}}
{{- define "tilburg-woo-ui.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "tilburg-woo-ui.fullname" -}}
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
{{- define "tilburg-woo-ui.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "tilburg-woo-ui.labels" -}}
helm.sh/chart: {{ include "tilburg-woo-ui.chart" . }}
{{ include "tilburg-woo-ui.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "tilburg-woo-ui.selectorLabels" -}}
app.kubernetes.io/name: {{ include "tilburg-woo-ui.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "tilburg-woo-ui.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "tilburg-woo-ui.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Get the service port to use
*/}}
{{- define "tilburg-woo-ui.servicePort" -}}
{{- if .Values.development.enabled }}
{{- .Values.development.service.port | default .Values.service.port }}
{{- else }}
{{- .Values.service.port }}
{{- end }}
{{- end }}

{{/*
Get the service target port to use
*/}}
{{- define "tilburg-woo-ui.serviceTargetPort" -}}
{{- if .Values.development.enabled }}
{{- .Values.development.service.targetPort | default .Values.service.targetPort }}
{{- else }}
{{- .Values.service.targetPort }}
{{- end }}
{{- end }}

{{/*
Get the image repository to use
*/}}
{{- define "tilburg-woo-ui.imageRepository" -}}
{{- if .Values.image.image }}
{{- .Values.image.image }}
{{- else if .Values.development.enabled }}
{{- .Values.development.image.repository | default .Values.image.repository }}
{{- else }}
{{- .Values.image.repository }}
{{- end }}
{{- end }}

{{/*
Get the image tag to use
*/}}
{{- define "tilburg-woo-ui.imageTag" -}}
{{- if .Values.image.image }}
{{- .Values.image.tag | default "latest" }}
{{- else if .Values.development.enabled }}
{{- .Values.development.image.tag | default .Values.image.tag }}
{{- else }}
{{- .Values.image.tag }}
{{- end }}
{{- end }} 