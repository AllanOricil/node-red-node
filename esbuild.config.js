const fs = require("fs-extra");
const path = require("path");
const esbuild = require("esbuild");

const DIST_FOLDER = "./lib";

function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
}

function cleanDist() {
  deleteFolderRecursive(DIST_FOLDER);
  console.log("- dist folder deleted successfully");
}

function listDirFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      listDirFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// TODO: use a stream if there are too many index.html
function bundleHTML() {
  const htmlFiles = listDirFiles(NODES_FOLDER)
    .filter((file) => file.endsWith("index.html"))
    .map((file) => fs.readFileSync(file, "utf8"));

  const combinedHtml = htmlFiles.join("\n");

  fs.writeFileSync(path.join(DIST_FOLDER, "index.html"), combinedHtml);
  console.log("- html bundled successfully");
}

async function bundleJS() {
  // CommonJS build
  await esbuild.build({
    entryPoints: ["src/index.js"],
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile: path.join(DIST_FOLDER, "index.cjs.js"),
    sourcemap: true,
  });

  await esbuild.build({
    entryPoints: ["src/index.js"],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: path.join(DIST_FOLDER, "index.esm.js"),
    sourcemap: true,
  });
  console.log("- js bundled successfully");
}

const main = async () => {
  try {
    cleanDist();
    await bundleJS();
  } catch (err) {
    console.error("error while building", err);
    process.exit(1);
  }
};

main();
