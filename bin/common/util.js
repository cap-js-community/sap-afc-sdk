"use strict";

const path = require("path");
const fs = require("fs");
const yaml = require("yaml");
const shelljs = require("shelljs");
const xml2js = require("xml2js");

function adjustText(file, callback) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    const newContent = callback(content) ?? content;
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, "utf8");
      return true;
    }
  }
  return false;
}

function adjustLines(file, callback) {
  return adjustText(file, (content) => {
    const newLines = [];
    for (const line of content.split("\n")) {
      const adjustedLine = callback(line) ?? line;
      if (adjustedLine !== null) {
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

function adjustAllLines(file, callback) {
  return adjustText(file, (content) => {
    const lines = content.split("\n");
    const newLines = callback(lines) ?? lines;
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
    const newJson = callback(json) ?? json;
    const newContent = JSON.stringify(newJson, null, 2);
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, "utf8");
      return true;
    }
  }
  return false;
}

function adjustYAML(file, callback) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    const yml = yaml.parse(content);
    const newYml = callback(yml) ?? yml;
    const newContent = yaml.stringify(newYml);
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, "utf8");
      return true;
    }
  }
  return false;
}

function adjustYAMLDocument(file, callback) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    const yml = yaml.parseDocument(content);
    const newYml = callback(yml) ?? yml;
    const newContent = newYml.toString();
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, "utf8");
      return true;
    }
  }
  return false;
}

function adjustYAMLAllDocument(file, callback) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    const ymls = yaml.parseAllDocuments(content);
    const newYmls = [];
    for (const yml of ymls) {
      const newYml = callback(yml);
      if (newYml === null) {
        continue;
      }
      newYmls.push(newYml ?? yml);
    }
    const newContent = newYmls
      .map((yml) => {
        return yml.toString();
      })
      .join("");
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, "utf8");
      return true;
    }
  }
  return false;
}

function adjustXML(file, callback) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    const xml = xml2js.parseString(content);
    const newXml = callback(xml) ?? xml;
    const newContent = xml2js.Builder().includes(newXml);
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, "utf8");
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
  adjustAllLines,
  replaceTextPart,
  adjustJSON,
  adjustYAML,
  adjustYAMLDocument,
  adjustYAMLAllDocument,
  adjustXML,
  copyTemplate,
  generateHashBrokerPassword,
};
