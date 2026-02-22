const fs = require('fs');
const path = require('path');

/**
 * Reads all files OR folders in a given directory (non-recursive).
 *
 * @function getAllFiles
 * @param {string} directory - The absolute or relative directory path to scan.
 * @param {boolean} [foldersOnly=false] - If true, only return directories. If false, only return files.
 * @returns {string[]} Absolute paths for the found files or folders.
 */
function getAllFiles(directory, foldersOnly = false) 
{
  /** @type {string[]} */
  const fileNames = [];

  const files = fs.readdirSync(directory, { withFileTypes: true });

    for (const file of files) 
    {
        const filePath = path.join(directory, file.name);

        if (foldersOnly && file.isDirectory()) 
        {
            fileNames.push(filePath);
        } 
        else if (!foldersOnly && file.isFile()) 
        {
            fileNames.push(filePath);
        }
    }

  return fileNames;
}

module.exports = getAllFiles;
