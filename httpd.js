/**
 * Alveric v1.0
 * Windows Nginx and PHP FastCGI Manager
 *
 * Author: Riyan Widiyanto
 * Created At: 2022-11-02 15:14 +7
 *
 * Copyright (C) 2022 Ridintek Industri.
 */

// CONFIGURABLE
var NGINX_PATH = "nginx-1.23.2";
var PHP_PATH = "php-8.1.12-nts-Win32-vs16-x64";
var SVC_NAME = 'HTTPServer';
var IPC_FILE = "ipc.log";
var LOG_FILE = "httpd.log";
var VERBOSE  = false;

// NOT CONFIGURABLE
var wsapp = new ActiveXObject('Shell.Application');
var fso = new ActiveXObject('Scripting.FileSystemObject');
var ws = new ActiveXObject('WScript.Shell');

var SCRIPT_PATH = fso.getFile(WScript.ScriptFullName).ParentFolder + "\\";
var SIG_INST = 0; // Install
var SIG_ONLO = 0; // Onlogon
var SIG_ONST = 0; // Onstart
var SIG_RELO = 0; // Reload
var SIG_REMO = 0; // Remove
var SIG_RUN  = 0; // Run
var SIG_STOP = 0; // Stop
var SIG_SVC  = 0; // Service
var SIG_TEST = 0; // Test

function echo(str)
{
  WScript.Echo(str);
}

/**
 * Check if script has been elevated.
 *
 * @return bool
 */
function isAdmin()
{
  return (ws.Run("net session", 0, true) == 0 ? true : false);
}

function log(str)
{
  var date = new Date();
  var file = fso.OpenTextFile(LOG_FILE, 8, true);
  file.WriteLine("[" + date.getFullYear() + "-" + zero(date.getMonth() + 1) + "-" + zero(date.getDate()) + " " +
    zero(date.getHours()) + ":" + zero(date.getMinutes()) + ":" + zero(date.getSeconds()) + "] " + str);
  file.Close();
}

function zero(num)
{
  var n = parseInt(num);
  return (n < 10 ? "0" + num : num);
}

function showHelp()
{
  echo("Ridintek Nginx Manager v1.0\n");
  echo("Usage:\n");
  echo("\tcscript.exe /nologo httpd.js [options]\n");
  echo("Options:\n");
  echo("\t--install [name]\tInstall service. Service name is optional.");
  echo("\t--reload\t\tReload configs.");
  echo("\t--remove\t\tRemove service.");
  echo("\t--run\t\t\tRun service.");
  echo("\t--stop\t\t\tStop service.");
}

var Server = {
  install: function() {
    log("Service '" + SVC_NAME + "' has been created.");
    echo("Service '" + SVC_NAME + "' has been created.\n");
    wsapp.ShellExecute("schtasks.exe", "/create /sc onlogon /tn \"" + SVC_NAME + "\" /tr \"wscript.exe " + WScript.ScriptFullName + " --service\" /rl highest", "", "runas", 0);
  },
  reload: function() {
    log("NGINX has been reloaded.");
    echo("NGINX has been reloaded.\n");
    wsapp.ShellExecute("nginx.exe", "-s reload", SCRIPT_PATH + NGINX_PATH, "runas", 0);
  },
  remove: function() {
    log("Service '" + SVC_NAME + "' has been deleted.\n");
    echo("Service '" + SVC_NAME + "' has been deleted.\n");
    wsapp.ShellExecute("schtasks.exe", "/delete /f /tn \"" + SVC_NAME + "\"", "", "runas", 0);
  },
  run: function() {
    if (fso.FileExists(SCRIPT_PATH + NGINX_PATH + "\\logs\\nginx.pid")) {
      log("NGINX instance is already running.");
      echo("NGINX instance is already running.");
      WScript.Quit();
    }

    log("NGINX instance has been running.");
    echo("NGINX instance has been running.");
    wsapp.ShellExecute("schtasks.exe", "/run /tn \"" + SVC_NAME + "\"", "", "runas", 0);
  },
  service: function() {
    wsapp.ShellExecute("nginx.exe", "", SCRIPT_PATH + NGINX_PATH, "runas", 0);

    var ipc = fso.CreateTextFile(SCRIPT_PATH + IPC_FILE, true);
    ipc.write("run");
    ipc.close();

    log("Service '" + SVC_NAME + "' has been started.");

    // We need php-cgi.exe stay running when closed. So looping is required.
    while(1) {
      ws.Run(SCRIPT_PATH + PHP_PATH + "\\php-cgi.exe -b 127.0.0.1:9000", 0, true);

      if (fso.OpenTextFile(SCRIPT_PATH + IPC_FILE, 1).ReadAll() != "run") {
        break;
      }
    }
  },
  stop: function() {
    if (!fso.FileExists(SCRIPT_PATH + NGINX_PATH + "\\logs\\nginx.pid")) {
      log("NGINX instance is already stopped.");
      echo("NGINX instance is already stopped.");
      WScript.Quit();
    }

    var ipc = fso.CreateTextFile(SCRIPT_PATH + IPC_FILE, true);
    ipc.write("stop");
    ipc.close();

    log("NGINX instance has been stopped.");
    echo("NGINX instance has been stopped.");

    ws.Run("taskkill /f /im php-cgi.exe", 0, true);
    wsapp.ShellExecute("nginx.exe", "-s quit", SCRIPT_PATH + NGINX_PATH, "runas", 0);
    ws.Run("schtasks.exe /end /tn \"" + SVC_NAME + "\"", 0, true);
  },
  test: function() {
    // wsapp.ShellExecute("php-cgi.exe", "-b 127.0.0.1:9000", SCRIPT_PATH + PHP_PATH, "runas", 0);
    // ws.Run(SCRIPT_PATH + PHP_PATH + "\\php-cgi.exe -b 127.0.0.1:9000", 0, true);
    log("Bismillah");
  }
};

// ENTRY POINT
function main(argc, argv)
{
  if (!isAdmin()) {
    log("Require administrator privileges.");
    echo("Require administrator privileges.");
    WScript.Quit();
  }

  if (argc > 0) {
    for (var a = 0; a < argc; a++) {
      if (argv(a) == "--install") {
        SIG_INST = 1;

        if (argc == 2 && argv(a + 1).length > 0 && argv(a + 1).substr(0, 2) != '--') {
          SVC_NAME = argv(a + 1);
        }
      }

      if (argv(a))

      if (argv(a) == '--reload') {
        SIG_RELO = 1;
      }

      if (argv(a) == '--remove') {
        SIG_REMO = 1;

        if (argc == 2 && argv(a + 1).length > 0 && argv(a + 1).substr(0, 2) != '--') {
          SVC_NAME = argv(a + 1);
        }
      }

      if (argv(a) == '--run') {
        SIG_RUN = 1;
      }

      if (argv(a) == '--service') {
        SIG_SVC = 1;
      }

      if (argv(a) == '--stop') {
        SIG_STOP = 1;
      }

      if (argv(a) == '--test') {
        SIG_TEST = 1;
      }
    }

    if (!SIG_INST && !SIG_RELO && !SIG_REMO && !SIG_RUN && !SIG_STOP && !SIG_SVC && !SIG_TEST) {
      log("Unknown command: '" + argv(0) + "'");
      echo("Unknown command: '" + argv(0) + "'");
      showHelp();
    }
  } else {
    showHelp();
  }

  if (SIG_INST) {
    Server.install();
  } else if (SIG_RELO) {
    Server.reload();
  } else if (SIG_REMO) {
    Server.remove();
  } else if (SIG_RUN) {
    Server.run();
  } else if (SIG_STOP) {
    Server.stop();
  } else if (SIG_SVC) {
    Server.service();
  } else if (SIG_TEST) {
    Server.test();
  }
}

// Entrypoint
main(WScript.Arguments.length, WScript.Arguments);
