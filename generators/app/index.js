'use strict';
const Generator = require('yeoman-generator');
var banner = require('./banner')
var nthash = require('smbhash').nthash;

/**
 * This module builds a Docker Compose template to use
 * Alfresco Repository and Search Services
*/
module.exports = class extends Generator {

  // Options to be chosen by the user
  prompting() {

    if (!this.options['skip-install-message']) {
      this.log(banner);
    }

    var commandProps = new Map();

    const prompts = [
      {
        type: 'list',
        name: 'acsVersion',
        message: 'Which ACS version do you want to use?',
        //choices: [ '6.1', '6.2', '7.0', '7.1', '7.2', '7.3' ],
        choices: [ '7.3' ],
        default: '7.3'
      },
      {
        type: 'input',
        name: 'ram',
        message: 'How much RAM is available for Alfresco Services in GB (16 is the minimum recommended)?',
        default: '16'
      },
      {
        type: 'input',
        name: 'serverName',
        message: 'What is the name of your server?',
        default: 'localhost'
      },
//      {
//        type: 'input',
//        name: 'password',
//        message: 'Choose the password for your admin user',
//        default: 'admin'
//      },
      {
        type: 'confirm',
        name: 'https',
        message: 'Do you want to use HTTPs (SSL) for Web Proxy?',
        default: false
      },
      {
        when: function (response) {
          return response.https == false || !commandProps['https'] == false
        },
        type: 'input',
        name: 'port',
        message: 'What HTTP port do you want to use (all the services are using the same port)?',
        default: '80'
      },
      {
        when: function (response) {
          return response.https == true || commandProps['https'] == true
        },
        type: 'input',
        name: 'port',
        message: 'What HTTPs port do you want to use (all the services are using the same port)?',
        default: '443'
      },
      {
        type: 'confirm',
        name: 'ldap',
        message: 'Do you want to create an internal LDAP server?',
        default: false
      },
      {
        type: 'confirm',
        name: 'keycloak',
        message: 'Do you want to use Alfresco Identity Services?',
        default: false
      },
      {
        type: 'confirm',
        name: 'smtp',
        message: 'Do you want to create an internal SMTP server?',
        default: false
      },
//      {
//        type: 'confirm',
//        name: 'ftp',
//        message: 'Do you want to use FTP (port 2121)?',
//        default: false
//      },
//      {
//        type: 'confirm',
//        name: 'mariadb',
//        message: 'Do you want to use MariaDB instead of PostgreSQL?',
//        default: false
//      },
      {
        type: 'list',
        name: 'database',
        message: 'Which database do you want to use?',
        //choices: [ '6.1', '6.2', '7.0', '7.1', '7.2', '7.3' ],
        choices: [ 'MySQL', 'MSSQL', 'Oracle', 'MariaDB','PostgreSQL' ],
        default: 'PostgreSQL'
      },
      {
        type: 'confirm',
        name: 'crossLocale',
        message: 'Are you using different languages (Cross Locale)?',
        default: true
      },
      {
        when: function (response) {
          return response.acsVersion >= '6.1' && response.acsVersion <= '7.0' || commandProps['acsVersion'] >= '6.1' && commandProps['acsVersion'] <= '7.0'
        },
        type: 'list',
        name: 'searchservices',
        message: 'Which Search Services do you want to use?',
        choices: [ 'Search Services (Solr)', 'Search and Insight Engine (Solr + Zeppelin)'],
        default: 'Search Services (Solr)'
      },
      {
        when: function (response) {
          return response.acsVersion >= '7.1' && response.database != 'PostgreSQL' || commandProps['acsVersion'] >= '7.1' && commandProps['database'] != 'PostgreSQL'
        },
        type: 'list',
        name: 'searchservices',
        message: 'Which Search Services do you want to use?',
        choices: [ 'Search Services (Solr)', 'Search and Insight Engine (Solr + Zeppelin)'],
        default: 'Search Services (Solr)'
      },
      {
        when: function (response) {
          return response.acsVersion >= '7.1' && response.database == 'PostgreSQL' || commandProps['acsVersion'] >= '7.1' && commandProps['database'] == 'PostgreSQL'
        },
        type: 'list',
        name: 'searchservices',
        message: 'Which Search Services do you want to use?',
        choices: [ 'Search Services (Solr)', 'Search Enterprise (ElasticSearch)', 'Search and Insight Engine (Solr + Zeppelin)' ],
        default: 'Search Services (Solr)'
      },
      {
        type: 'confirm',
        name: 'enableContentIndexing',
        message: 'Do you want to enable content indexing?',
        default: true
      },
      {
        when: function (response) {
          return response.acsVersion == '7.1' && response.searchservices != 'Search Enterprise (ElasticSearch)' || commandProps['acsVersion'] == '7.1' && commandProps['searchervices'] != 'Search Enterprise (ElasticSearch)'
        },
        type: 'list',
        name: 'solrHttpMode',
        message: 'Would you like to use HTTP, HTTPs or Shared Secret for Alfresco-SOLR communication?',
        choices: [ 'http', 'https', 'secret' ],
        default: 'http'
      },
      {
        when: function (response) {
          return response.acsVersion >= '7.2' && response.searchservices != 'Search Enterprise (ElasticSearch)'  || commandProps['acsVersion'] >= '7.2' && commandProps['searchervices'] != 'Search Enterprise (ElasticSearch)'
        },
        type: 'list',
        name: 'solrHttpMode',
        message: 'Would you like to use Shared Secret or HTTPs for Alfresco-SOLR communication?',
        choices: [ 'secret', 'https' ],
        default: 'secret'
      },
      {
        type: 'confirm',
        name: 'syncservice',
        message: 'Do you want to add the sync service?',
        default: true
      },
      {
        type: 'confirm',
        name: 'ats',
        message: 'Do you want to add the Alfresco Transformation Service?',
        default: true
      },
      {
        when: function (response) {
          return response.ats == false
        },
        type: 'confirm',
        name: 'dte',
        message: 'Do you want to use the Alfresco Document Transformation Engine?',
        default: true
      },
      {
        when: function (response) {
          return response.dte == true
        },
        type: 'list',
        name: 'dteprotocol',
        message: 'How will you connect to DTE?',
        choices: [ 'http', 'https' ],
        default: 'http'
      },
      {
        when: function (response) {
          return response.dte == true
        },
        type: 'input',
        name: 'dtehostname',
        message: 'What is the hostname of the Alfresco Document Transformation Engine?',
        default: ''
      },
      {
        when: function (response) {
          return response.dte == true
        },
        type: 'input',
        name: 'dteport',
        message: 'What is the port of the Alfresco Document Transformation Engine?',
        default: ''
      },
      {
        type: 'confirm',
        name: 'google-docs',
        message: 'Do you want to add the Google Docs Integration?',
        default: false
      },
//      {
//        type: 'checkbox',
//        name: 'addons',
//        pageSize: 10,
//        message: 'Select the addons to be installed:',
//        choices: [
//          {
//            name: 'Google Docs 3.1.0',
//            value: 'google-docs',
//            checked: false
//          },
//          {
//            name: 'JavaScript Console 0.7',
//            value: 'js-console',
//            checked: false
//          },
//          {
//            name: 'Order of the Bee Support Tools 1.0.0.0',
//            value: 'ootbee-support-tools',
//            checked: false
//          },
//          {
//            name: 'Share Site Creators 0.0.8',
//            value: 'share-site-creators',
//            checked: false
//          },
//          {
//            name: 'ESign Cert 1.8.2',
//            value: 'esign-cert',
//            checked: false
//          },
//         {
//            name: 'Edit with LibreOffice in Alfresco Share 0.3.0',
//            value: 'share-online-edition',
//            checked: false
//          },
//          {
//            name: 'Alfresco PDF Toolkit 1.4.4',
//            value: 'alfresco-pdf-toolkit',
//            checked: false
//          }
//        ]
//      },
      {
        type: 'confirm',
        name: 'windows',
        message: 'Are you using a Windows host to run Docker?',
        default: true
      },
//      {
//        type: 'confirm',
//        name: 'startscript',
//        message: 'Do you want to use a start script?',
//        default: false
//      },
//      {
//        // Provide volumes permission script for Linux OS
//        type: 'confirm',
//        name: 'volumesscript',
//        message: 'Do you want to get the script to create host volumes?',
//        default: false
//      }
    ];

    // Read options from command line parameters
    const filteredPrompts = [];
    prompts.forEach(function prompts(prompt) {
      const option = this.options[prompt.name];
      if (option === undefined) {
        filteredPrompts.push(prompt);
      } else {
        commandProps[prompt.name] = normalize(option, prompt);
      }
    }, this);

    // Prompt only for parameters not passed by command line
    return this.prompt(filteredPrompts).then(props => {
      this.props = props;
      Object.assign(props, commandProps);
    });

  }

  // Generate boilerplate from "templates" folder
  writing() {

    // Docker Compose environment variables values
    this.fs.copyTpl(
      this.templatePath(this.props.acsVersion + '/.env'),
      this.destinationPath('.env'),
      {
        serverName: this.props.serverName
      }
    )

    // Copy Docker Compose applying configuration
    this.fs.copyTpl(
      this.templatePath(this.props.acsVersion + '/docker-compose.yml'),
      this.destinationPath('docker-compose.yml'),
      {
        ram: getAvailableMemory(this.props),
        serverName: this.props.serverName,
        https: (this.props.https ? 'true' : 'false'),
        port: this.props.port,
        ldap: (this.props.ldap ? 'true' : 'false'),
        keycloak: (this.props.keycloak ? 'true' : 'false'),
        smtp: (this.props.smtp ? 'true' : 'false'),
        db: this.props.database,
        crossLocale: (this.props.crossLocale ? 'true' : 'false'),
        searchservices: this.props.searchservices,
        disableContentIndexing: (this.props.enableContentIndexing ? 'false' : 'true'),
        solrHttpMode: this.props.solrHttpMode,
        secureComms: (this.props.solrHttpMode == 'http' ? 'none' : this.props.solrHttpMode),
        syncservice: (this.props.syncservice ? 'true' : 'false'),
        ats: (this.props.ats ? 'true' : 'false'),
        dte: (this.props.dte ? 'true' : 'false'),
        dteprotocol: this.props.dteprotocol,
        dtehostname: this.props.dtehostname,
        dteport: this.props.dteport,
        googledocs: (this.props.addons.includes('google-docs') ? 'true' : 'false'),
        windows: (this.props.windows ? 'true' : 'false'),
        //defaulted values
        ftp: ('true'),
        activemq: ('true'),
        activeMqCredentials: ('true'),
        activeMqUser: ('activeMqUser'),
        activeMqPassword: computeHashPassword(tMath.random().toString(36).slice(2)),
        //activeMqPassword: this.props.activeMqPassword,
        // Generate random password for Repo-SOLR secret communication method
        secretPassword: Math.random().toString(36).slice(2),
        password: computeHashPassword(this.props.password)
      }
    );

    // Copy Docker Image for Repository applying configuration
    this.fs.copyTpl(
      this.templatePath('images/alfresco/Dockerfile'),
      this.destinationPath('alfresco/Dockerfile'),
      {
        ftp: ('true'),
        acsVersion: this.props.acsVersion
      }
    );
    this.fs.copyTpl(
      this.templatePath('images/alfresco/modules'),
      this.destinationPath('alfresco/modules')
    );

    // Copy Docker Image for Share applying configuration
    this.fs.copyTpl(
      this.templatePath('images/share'),
      this.destinationPath('share'),
      {
        port: this.props.port,
        https: (this.props.https ? 'true' : 'false'),
        googledocs: (this.props.addons.includes('google-docs') ? 'true' : 'false'),
        acsVersion: this.props.acsVersion
      }
    );

    // Copy Docker Image for Search applying configuration
    this.fs.copyTpl(
      this.templatePath('images/search'),
      this.destinationPath('search')
    );

    // Copy NGINX Configuration
    this.fs.copyTpl(
      this.templatePath('images/config/nginx'),
      this.destinationPath('config'),
      {
        port: this.props.port,
        https: (this.props.https ? 'true' : 'false'),
        solrHttps: (this.props.solrHttpMode == 'https' ? 'true' : 'false')
      }
    );
    if (this.props.https) {
      this.fs.copy(
        this.templatePath('images/config/cert'),
        this.destinationPath('config/cert')
      );
    }

    // Copy mTLS Keystores
    if (this.props.solrHttpMode == 'https') {
      this.fs.copy(
        this.templatePath('keystores'),
        this.destinationPath('keystores')
      );
    }

    // ActiveMQ
    if (!true) {
      this.fs.copy(
        this.templatePath('addons/jars/activemq-broker-*.jar'),
        this.destinationPath('alfresco/modules/jars')
      );      
    }

    // Addons
//    if (this.props.addons.includes('js-console')) {
//      this.fs.copy(
//        this.templatePath('addons/amps/javascript-console-repo-*.amp'),
//        this.destinationPath('alfresco/modules/amps')
//      );
//      this.fs.copy(
//        this.templatePath('addons/amps_share/javascript-console-share-*.amp'),
//        this.destinationPath('share/modules/amps')
//      )
//    }
//
//    if (this.props.addons.includes('ootbee-support-tools')) {
//      this.fs.copy(
//        this.templatePath('addons/amps/support-tools-repo-*.amp'),
//        this.destinationPath('alfresco/modules/amps')
//      );
//      this.fs.copy(
//        this.templatePath('addons/amps_share/support-tools-share-*.amp'),
//        this.destinationPath('share/modules/amps')
//      )
//    }
//
//    if (this.props.addons.includes('share-site-creators')) {
//      this.fs.copy(
//        this.templatePath('addons/amps/share-site-creators-repo-*.amp'),
//        this.destinationPath('alfresco/modules/amps')
//      );
//      this.fs.copy(
//        this.templatePath('addons/amps_share/share-site-creators-share-*.amp'),
//        this.destinationPath('share/modules/amps')
//      )
//    }
//
//
//    if (this.props.addons.includes('esign-cert')) {
//      this.fs.copy(
//        this.templatePath('addons/amps/esign-cert-repo-*.amp'),
//        this.destinationPath('alfresco/modules/amps')
//      );
//      this.fs.copy(
//        this.templatePath('addons/amps_share/esign-cert-share-*.amp'),
//        this.destinationPath('share/modules/amps')
//      )
//    }
//
//    if (this.props.addons.includes('share-online-edition')) {
//      this.fs.copy(
//        this.templatePath('addons/amps_share/zk-libreoffice-addon-share*.amp'),
//        this.destinationPath('share/modules/amps')
//      )
//    }
//
//    if (this.props.addons.includes('alfresco-pdf-toolkit')) {
//      if (this.props.acsVersion.startsWith('7')) {
//        this.fs.copy(
//          this.templatePath('addons/amps/pdf-toolkit-repo-1.4.4-ACS-7*.amp'),
//          this.destinationPath('alfresco/modules/amps')
//        )
//      } else {
//        this.fs.copy(
//         this.templatePath('addons/amps/pdf-toolkit-repo-1.4.4-SNAPSHOT*.amp'),
//          this.destinationPath('alfresco/modules/amps')
//        )
//      }
//      this.fs.copy(
//        this.templatePath('addons/amps_share/pdf-toolkit-share*.amp'),
//        this.destinationPath('share/modules/amps')
//      )
//    }
//
//    if (this.props.startscript) {
//      this.fs.copyTpl(
//        this.templatePath('scripts/start.sh'),
//        this.destinationPath('start.sh'),
//        {
//          port: this.props.port,
//          serverName: this.props.serverName,
//          https: (this.props.https ? 'true' : 'false')
//        }
//      )
//    }
//
//    if (this.props.volumesscript) {
//      this.fs.copy(
//        this.templatePath('scripts/create_volumes.sh'),
//        this.destinationPath('create_volumes.sh')
//      )
//    }
//
//    if (this.props.addons.includes('share-site-creators')) {
//        this.log('\n   ---------------------------------------------------\n' +
//        '   WARNING: You selected the addon share-site-creators. \n' +
//        '   Remember to add any user to group GROUP_SITE_CREATORS \n' +
//        '   ---------------------------------------------------\n');
//    }
//
    if (this.props.https) {
      this.log('\n   ---------------------------------------------------------------\n' +
      '   WARNING: You selected HTTPs for the NGINX Web Proxy. \n' +
      '   Default certificates localhost.cer and localhost.key have been \n' +
      '   provided in config/cert folder. \n' +
      '   You may replace these certificates by your own. \n' +
      '   ---------------------------------------------------------------\n');
    }

    if (this.props.solrHttpMode == 'https') {
      this.log('\n   ---------------------------------------------------------------\n' +
      '   WARNING: You selected HTTPs communication for Alfresco-Solr. \n' +
      '   Default keystores have been provided in keystores folder. \n' +
      '   You may replace these certificates by your own. \n' +
      '   Check https://github.com/Alfresco/alfresco-ssl-generator \n' +
      '   ---------------------------------------------------------------\n');
    }

//    if (this.props.addons.includes('share-online-edition')) {
//      this.log('\n   ---------------------------------------------------\n' +
//      '   WARNING: You selected the addon share-online-edition. \n' +
//      '   Remember to register required protocol in your client computer. \n' +
//      '   Check https://github.com/zylklab/alfresco-share-online-edition-addon#registering-the-protocols \n' +
//      '   ---------------------------------------------------\n');
//    }

  }

};

// Convert parameter string value to boolean value
function normalize(option, prompt) {

  if (prompt.type === 'confirm' && typeof option === 'string') {
    let lc = option.toLowerCase();
    if (lc === 'true' || lc === 'false') {
      return (lc === 'true');
    } else {
      return option;
    }
  }

  return option;

}

// Calculate available memory for Repository, SOLR and Share
function getAvailableMemory(props) {

  var ram = (props.ram - 1) * 1024;

  // Content app and Proxy required RAM
  ram = ram - 256 - 128;

  if (props.acsVersion == '6.2') {
    ram = ram - 2048;
  }

  if (props.smtp) {
    ram = ram - 128;
  }
  if (props.ldap) {
    ram = ram - 256;
  }
  return ram;

}

// Compute NTLMv1 MD4 Hash for Alfresco DB
function computeHashPassword(password) {
  return nthash(password).toLowerCase();
}

