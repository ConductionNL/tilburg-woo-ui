import { AcLockObject } from '@utils/ac-lock-object';

export const MIMETYPES = AcLockObject({
	CSV: 'text/csv',
	DOC: 'application/msword',
	DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	LST: 'text/plain',
	PDF: 'application/pdf',
	PPT: 'application/vnd.ms-powerpoint',
	PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	RAW: 'application/vnd.rar',
	XLS: 'application/vnd.ms-excel',
	XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	XML: 'application/xml',
	ZIP: 'application/zip',
});
