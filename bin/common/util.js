"use strict";

const path = require("path");
const fs = require("fs");
const shelljs = require("shelljs");

function adjustText(file, callback) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, "utf8");
    const newContent = callback(content);
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent);
      return true;
    }
  }
  return false;
}

function adjustLines(file, callback) {
  return adjustText(file, (content) => {
    const newLines = [];
    for (const line of content.split("\n")) {
      const adjustedLine = callback(line);
      if (adjustedLine !== undefined && adjustedLine !== null) {
        if (Array.isArray(adjustedLine)) {
          newLines.push(...adjustedLine);
        } else {
          newLines.push(adjustedLine);
        }
      }
    }
    return newLines.join("\n");
  });
}

function replaceTextPart(content, part, replacement, positionPart, restriction) {
  const position = Math.max(positionPart ? content.indexOf(positionPart) : 0, 0);
  if (restriction >= 0 && !content.slice(position, position + restriction).includes(part)) {
    return content;
  }
  const index = content.indexOf(part, position);
  if (index < 0) {
    return content;
  }
  return content.slice(0, index) + replacement + content.slice(index + part.length);
}

function adjustJSON(file, callback) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(content);
    callback(json);
    const newContent = JSON.stringify(json, null, 2);
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent);
      return true;
    }
  }
  return false;
}

function copyTemplate(folder, files) {
  fs.mkdirSync(folder, { recursive: true });
  for (const file of files) {
    const src = path.join(__dirname, "..", "templates", file);
    const dest = path.join(process.cwd(), file);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
    }
  }
  // eslint-disable-next-line no-console
  console.log(`Folder '${folder}' written.`);
}

function generateHashBrokerPassword() {
  const result = shelljs.exec("npx -y -p @sap/sbf hash-broker-password -b").stdout;
  const parts = result.split("\n");
  const [, clear, , hash] = parts;
  return {
    clear,
    hash,
  };
}

module.exports = {
  adjustText,
  adjustLines,
  replaceTextPart,
  adjustJSON,
  copyTemplate,
  generateHashBrokerPassword,
};
