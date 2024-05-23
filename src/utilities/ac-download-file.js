import FileSaver from 'file-saver';

export const AcDownloadFile = (data, filename, mime) => {
	const blob = new Blob([data], { type: mime || 'application/octet-stream' });

	return FileSaver.saveAs(blob, filename);
};

export default AcDownloadFile;
