"use strict";

const path = require("path");
const fs = require("fs");

function adjustText(file, callback) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, "utf8");
    content = callback(content);
    fs.writeFileSync(filePath, content);
  }
}

function adjustLines(file, callback) {
  adjustText(file, (content) => {
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
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
  }
}

module.exports = {
  adjustText,
  adjustLines,
  replaceTextPart,
  adjustJSON,
};
