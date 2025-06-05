"use strict";

const path = require("path");
const fs = require("fs");
const yaml = require("yaml");
const shelljs = require("shelljs");
const xml2js = require("xml2js");

function projectName() {
  const packagePath = path.join(process.cwd(), "package.json");
  let name;
  if (fs.existsSync(packagePath)) {
    name = require(packagePath).name;
  }
  if (isJava() && name?.endsWith("-cds")) {
    name = name.slice(0, -4);
  }
  return name;
}

function deriveServiceName(name) {
  return name.replace(/-/g, "");
}

function derivePackageName(name) {
  return name.replace(/-/g, "_");
}

function readJSON(file) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  }
}

function readYAML(file) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    return yaml.parse(content);
  }
}

function adjustText(file, callback) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    const newContent = callback(content) ?? content;
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, "utf8");
    }
    return true;
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

function adjustJSON(file, callback) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(content);
    const newJson = callback(json) ?? json;
    const newContent = JSON.stringify(newJson, null, 2);
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, "utf8");
    }
    return true;
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
    }
    return true;
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
    }
    return true;
  }
  return false;
}

function adjustYAMLAllDocument(file, callback) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    const ymls = yaml.parseAllDocuments(content);
    const newYmls = [];
    let i = 0;
    for (const yml of ymls) {
      const newYml = callback(yml, i++, ymls.length);
      if (newYml === null) {
        continue;
      }
      if (Array.isArray(newYml)) {
        for (const ymlItem of newYml) {
          newYmls.push(ymlItem);
        }
      } else {
        newYmls.push(newYml ?? yml);
      }
    }
    const newContent = newYmls
      .map((yml) => {
        return yml.toString({ directives: true });
      })
      .join("");
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, "utf8");
    }
    return true;
  }
  return false;
}

function adjustYAMLAllDocuments(file, callback) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    const ymls = yaml.parseAllDocuments(content);
    const newYmls = callback(ymls) ?? ymls;
    const newContent = newYmls
      .map((yml) => {
        return yml.toString({ directives: true });
      })
      .join("");
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, "utf8");
    }
    return true;
  }
  return false;
}

function adjustXML(file, callback) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    const xmlParser = new xml2js.Parser({
      async: false,
    });
    let xml;
    xmlParser.parseString(content, (err, _xml) => {
      if (err) {
        throw err;
      }
      xml = _xml;
    });
    const newXml = callback(xml) ?? xml;
    const xmlBuilder = new xml2js.Builder();
    const newContent = xmlBuilder.buildObject(newXml);
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, "utf8");
    }
    return true;
  }
  return false;
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

function copyFolder(src, dest, exclude) {
  const files = fs.readdirSync(src, { withFileTypes: true });
  for (const file of files) {
    if ([".DS_Store"].includes(file.name)) {
      continue;
    }
    const srcPath = path.join(src, file.name);
    const destPath = path.join(dest, file.name);
    if (file.isDirectory()) {
      copyFolder(srcPath, destPath, exclude);
    } else if (!exclude?.files?.includes(file.name) && !exclude?.extensions?.includes(path.extname(file.name))) {
      if (!fs.existsSync(destPath)) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

function copyFolderAdjusted(src, dest, exclude, callback) {
  const files = fs.readdirSync(src, { withFileTypes: true });
  for (const file of files) {
    if ([".DS_Store"].includes(file.name)) {
      continue;
    }
    const srcPath = path.join(src, file.name);
    const destPath = path.join(dest, file.name);
    if (file.isDirectory()) {
      copyFolderAdjusted(srcPath, destPath, exclude, callback);
    } else if (!exclude?.files?.includes(file.name) && !exclude?.extensions?.includes(path.extname(file.name))) {
      if (!fs.existsSync(destPath)) {
        const content = fs.readFileSync(srcPath, "utf8");
        const newContent = callback(content, srcPath, destPath) ?? content;
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        fs.writeFileSync(destPath, newContent, "utf8");
      }
    }
  }
}

function copyFile(srcPath, destPath) {
  if (!fs.existsSync(destPath)) {
    if (!fs.existsSync(path.dirname(destPath))) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
    }
    fs.copyFileSync(srcPath, destPath);
  }
}

function copyFileAdjusted(srcPath, destPath, callback) {
  if (!fs.existsSync(destPath)) {
    const content = fs.readFileSync(srcPath, "utf8");
    const newContent = callback(content, srcPath, destPath) ?? content;
    if (!fs.existsSync(path.dirname(destPath))) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
    }
    fs.writeFileSync(destPath, newContent, "utf8");
  }
}

function isNode(options) {
  return !options?.java && !isJava(options);
}

function isJava(options) {
  return !options?.node && (fs.existsSync(path.join(process.cwd(), "pom.xml")) || !!options?.java);
}

module.exports = {
  projectName,
  deriveServiceName,
  derivePackageName,
  readJSON,
  readYAML,
  adjustText,
  adjustLines,
  adjustAllLines,
  adjustJSON,
  adjustYAML,
  adjustYAMLDocument,
  adjustYAMLAllDocument,
  adjustYAMLAllDocuments,
  adjustXML,
  generateHashBrokerPassword,
  copyFolder,
  copyFolderAdjusted,
  copyFile,
  copyFileAdjusted,
  isNode,
  isJava,
};
