const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const cmd = require('node-cmd');
const csv = require('fast-csv');
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});
var requestCounter = 0;

const ServerResponse = "ServerResponse";
const SampleRepoResponse = "SampleRepoResponse";
const RepoLinkResponse = "RepoLinkResponse";

const CliExecutablePath = "/Users/limengyang/Workspaces/FinalYearProject/codeqltosouffle/automationtools_py/run.py";

const RepoPathFlag = "--repo_path";
const DemoRepoPath = "/Users/limengyang/Workspaces/FinalYearProject/FYP-Challenge-Demo-Repo"
const CommonsIoRepoPath = "/Users/limengyang/Workspaces/FinalYearProject/commons-io";
const CommonsCsvRepoPath = "/Users/limengyang/Workspaces/FinalYearProject/commons-csv";
const CommonsCompressRepoPath = "/Users/limengyang/Workspaces/FinalYearProject/commons-compress";
const PdfboxRepoPath = "/Users/limengyang/Workspaces/FinalYearProject/pdfbox";
const FlumeRepoPath = "/Users/limengyang/Workspaces/FinalYearProject/flume";

const GitfactsFlag = "--gitfacts_path";
const GitfactsPath = "/Users/limengyang/Workspaces/FinalYearProject/ext-gitfacts";

const OutputPathFlag = "--output_path";
const OutputPathPrefix = "/Users/limengyang/Desktop/output";
const OutputPathResultPath = "/output/query.csv"

const QueryPathFlag = "--query_file_path";
const QueryPathPrefix = "/Users/limengyang/Desktop/query/query";
const QuerypathSuffix = ".txt";

const CodeqltosouffleFlag = "--codeqltosouffle_path";
const CodeqltosoufflePath = "/Users/limengyang/Workspaces/FinalYearProject/codeqltosouffle";

const CslicerFlag = "--cslicer_path";
const CslicerPath = "/Users/limengyang/Workspaces/FinalYearProject/gitslice/target/cslicer-1.0.0-jar-with-dependencies.jar";

const mockData = [
  {caller: "a", callee: "b", version: "1"},
  {caller: "c", callee: "d", version: "2"},
  {caller: "e", callee: "f", version: "3"},
];
class Record {
  constructor(version, methodName) {
    this.version = version;
    this.methodName = methodName;
  }
}

io.on('connection', (socket) => {
  socket.emit(ServerResponse);

  socket.on('sample repo', (repo, query) => {
    socket.emit(SampleRepoResponse, mockData);
  });

  socket.on('repo link', (repoLink, query) => {
    // Step 1: Write query locally
    fs.writeFile(QueryPathPrefix + requestCounter + QuerypathSuffix, query, function(err) {
      if (err) throw err;
      // Step 2: Upon write success, execute command
      cmd.runSync("python3.7 " + CliExecutablePath + " "
                  + RepoPathFlag + " " + DemoRepoPath + " "
                  + GitfactsFlag + " " + GitfactsPath + " "
                  + OutputPathFlag + " " + OutputPathPrefix + requestCounter + " "
                  + QueryPathFlag + " " + QueryPathPrefix + requestCounter + QuerypathSuffix + " "
                  + CodeqltosouffleFlag + " " + CodeqltosoufflePath + " "
                  + CslicerFlag + " " + CslicerPath);
      // Step 3: Read result
      cmd.run(`cat ${OutputPathPrefix + requestCounter + OutputPathResultPath}`, function(err, data, stderr) {
        var result = [];
        lines = data.split(/\n/);
        for (var i = 0; i < lines.length; i++) {
          fields = lines[i].split(/\t/);
          if (fields.length != 2) {
            continue;
          }
          result.push(new Record(fields[0], fields[1]));
        }
        requestCounter++;
        socket.emit(RepoLinkResponse, result);
      })

      // Backup for demo: 
      // cmd.run(`cat ${OutputPathPrefix + 0 + OutputPathResultPath}`, function(err, data, stderr) {
      //   var result = [];
      //   lines = data.split(/\n/);
      //   for (var i = 0; i < lines.length; i++) {
      //     fields = lines[i].split(/\t/);
      //     if (fields.length != 2) {
      //       continue;
      //     }
      //     result.push(new Record(fields[0], fields[1]));
      //   }
      //   requestCounter++;
      //   socket.emit(RepoLinkResponse, result);
      // })
    })
  });
});

http.listen(3000, () => {
  console.log('Listening on *:3000')
})