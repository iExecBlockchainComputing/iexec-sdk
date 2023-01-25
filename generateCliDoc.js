const { exec } = require('child_process');
const { EOL } = require('os');
const fsPromises = require('fs').promises;

const CMD = 'iexec';
const PLACEHOLDER = '%CLI_API_GENERATED_DOC%';
const DOC_TEMPLATE = 'cli_template.md';
const DOC_OUT = 'CLI.md';
const MAIN_HEADER_LEVEL = 1;

const execPromise = (command) =>
  new Promise((res, rej) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        rej(Error(stdout + stderr));
      } else {
        res(stdout);
      }
    });
  });

const getJsonDoc = async (cmd) => {
  const cmdArray = cmd.split(' ');
  const cmdObj = await execPromise(
    `GENERATE_DOC=1 node src/cli/cmd/${cmdArray.join('-')}.js`,
  )
    .then((stdout) => JSON.parse(stdout))
    .catch(() => ({}));

  cmdObj.fullName = cmdArray.join(' ');
  cmdObj.subCommands =
    cmdObj.subCommands &&
    (await Promise.all(
      cmdObj.subCommands.map(async (sub) => {
        const subCommandName = [cmdObj.fullName, sub.name].join(' ');
        const subCmdObj = await getJsonDoc(subCommandName);
        return { ...sub, ...subCmdObj };
      }),
    ));
  return cmdObj;
};

const jsonDocToMd = (jsonDoc) => {
  const getMdHeader = (header, { level = 0 } = {}) =>
    `${Array(MAIN_HEADER_LEVEL + level)
      .fill('#')
      .join('')} ${header}${EOL}${EOL}`;

  const sanitizeStringForMd = (str) =>
    str
      .replaceAll('_', '\\_')
      .replaceAll('*', '\\*')
      .replaceAll('<', '\\<')
      .replaceAll('>', '\\>')
      .replaceAll('[', '\\[')
      .replaceAll(']', '\\]')
      .replaceAll('|', '\\|')
      .replaceAll(EOL, '<br/>');

  const getMdTable = (dataArray, headers) => {
    let mdTable = `| ${headers
      .map(({ name }) => sanitizeStringForMd(name))
      .join(' | ')} |${EOL}`;
    mdTable += `| ${Array(headers.length).fill('---').join(' | ')} |${EOL}`;
    dataArray.forEach((dataRow) => {
      mdTable += `| ${headers
        .map((header) => sanitizeStringForMd(dataRow[header.key]))
        .join(' | ')} |${EOL}`;
    });
    mdTable += EOL;
    return mdTable;
  };

  const getMdInternalLink = (str, link) =>
    `[${str}](#${(link || str).toLowerCase().split(' ').join('-')})`;

  const getCommandsList = (commandsArray) =>
    `${commandsArray
      .map(
        ({ name, fullName }) => `- ${getMdInternalLink(name, fullName)}${EOL}`,
      )
      .join('')}${EOL}`;

  const getOptionsTable = (optionsArray) =>
    getMdTable(optionsArray, [
      {
        key: 'flags',
        name: 'option',
      },
      {
        key: 'description',
        name: 'description',
      },
    ]);

  const createMdDoc = ({
    // name,
    fullName,
    description,
    options,
    subCommands,
  }) => {
    let mdDoc = '';
    mdDoc += getMdHeader(fullName, { level: fullName.split(' ').length });
    if (description) {
      mdDoc += `${sanitizeStringForMd(description)}${EOL}${EOL}`;
    }
    if (options && options.length > 0) {
      mdDoc += `Options:${EOL}${EOL}`;
      mdDoc += getOptionsTable(options);
    }
    if (subCommands && subCommands.length > 0) {
      mdDoc += `Commands:${EOL}${EOL}`;
      mdDoc += getCommandsList(subCommands);
    }
    if (subCommands && subCommands.length > 0) {
      subCommands.forEach((subCmdJson) => {
        mdDoc += createMdDoc(subCmdJson);
      });
    }
    return mdDoc;
  };

  return createMdDoc(jsonDoc);
};

(async () => {
  const [generated, template] = await Promise.all([
    getJsonDoc(CMD).then(jsonDocToMd),
    fsPromises.readFile(DOC_TEMPLATE, { encoding: 'utf8' }),
  ]);
  await fsPromises.writeFile(DOC_OUT, template.replace(PLACEHOLDER, generated));
  console.log(`generated ${CMD} CLI doc in ${DOC_OUT}`);
})();
