type NotTranslatedProps ={
	nameBlackList:string[]
	currentPath:string
}

function isDirectlyInFolder(filePath: string, folderPath: string): boolean {
	const normalizedFile = filePath.replace(/\\/g, '/');
	const normalizedFolder = folderPath.replace(/\\/g, '/').replace(/\/$/, '');
	const parent = normalizedFile.substring(
		0,
		normalizedFile.lastIndexOf('/')
	);
	return parent === normalizedFolder;
}

export default function notTranslated({nameBlackList, currentPath}:NotTranslatedProps):boolean{
	if (!currentPath) return false;
	return nameBlackList.some(folder =>
		isDirectlyInFolder(currentPath, folder)
	);
}
