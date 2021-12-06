#!/usr/bin/env node
/* eslint global-require: 0 */
'use strict';

const packageData = require('../package.json');
const fs = require('fs');
const pathlib = require('path');
const argv = require('minimist')(process.argv.slice(2));
const msgpack = require('msgpack5')();

let cmd = ((argv._ && argv._[0]) || '').toLowerCase();
if (!cmd) {
    if (argv.license || argv.l) {
        cmd = 'license';
    }

    if (argv.version || argv.v) {
        cmd = 'version';
    }

    if (argv.help || argv.h) {
        cmd = 'help';
    }
}

switch (cmd) {
    case 'encrypt':
        // encrypt account passwords
        require('../encrypt');
        break;

    case 'scan':
        // Scan Redis keys
        require('../scan');
        break;

    case 'help':
        // Show version
        fs.readFile(pathlib.join(__dirname, '..', 'help.txt'), (err, helpText) => {
            if (err) {
                console.error('Failed to load license information');
                console.error(err);
                return process.exit(1);
            }
            console.error(helpText.toString().trim());
            console.error('');
            process.exit();
        });
        break;

    case 'version':
        // Show version
        console.log(`EmailEngine v${packageData.version} (${packageData.license})`);
        break;

    case 'license':
        // Display license information
        fs.readFile(pathlib.join(__dirname, '..', 'LICENSE.txt'), (err, license) => {
            if (err) {
                console.error('Failed to load license information');
                console.error(err);
                return process.exit(1);
            }

            fs.readFile(pathlib.join(__dirname, '..', 'LICENSE_EMAILENGINE.txt'), (err, licenseComm) => {
                if (err) {
                    console.error('Failed to load license information');
                    console.error(err);
                    return process.exit(1);
                }

                console.error('EmailEngine License');
                console.error('===================');

                console.log(`EmailEngine v${packageData.version}`);
                console.error(`(c) 2020-2021 Postal Systems`);
                console.error(`${packageData.license}, full text follows`);
                console.error('');

                console.error('-'.repeat(78));
                console.error(license.toString().trim());

                console.error('');
                console.error('-'.repeat(78));
                console.error('');

                console.error(licenseComm.toString().trim());
                console.error('-'.repeat(78));
                console.error('');

                process.exit();
            });
        });
        break;

    case 'tokens':
        {
            const tokens = require('../lib/tokens');
            let tokensCmd = ((argv._ && argv._[1]) || '').toLowerCase();
            switch (tokensCmd) {
                case 'issue':
                    {
                        let allowedScopes = ['*', 'api', 'metrics'];
                        let scope = (argv.scope || argv.s || '*').toString().toLowerCase();
                        if (!allowedScopes.includes(scope)) {
                            console.error(`Unknown scope: ${scope}`);
                            console.log(`Allowed scopes: "${allowedScopes.join('", "')}"`);
                            process.exit(1);
                        }
                        let description = (argv.description || argv.d || '').toString();
                        if (!description) {
                            description = `Generated at ${new Date().toISOString()}`;
                        }
                        let account = argv.account || argv.a || '';
                        tokens
                            .provision({
                                account,
                                description,
                                scopes: [scope],
                                nolog: true
                            })
                            .then(token => {
                                console.log(token);
                                process.exit();
                            })
                            .catch(err => {
                                console.error(err);
                                process.exit(1);
                            });
                    }
                    break;

                case 'export':
                    {
                        let token = (argv.token || argv.t || '').toString();
                        tokens
                            .getRawData(token)
                            .then(tokenData => {
                                let encoded = msgpack.encode(tokenData);
                                console.log(encoded.toString('base64url'));
                                process.exit();
                            })
                            .catch(err => {
                                console.error(err);
                                process.exit(1);
                            });
                    }
                    break;

                case 'import':
                    {
                        let rawToken = (argv.token || argv.t || '').toString();
                        let tokenData = msgpack.decode(Buffer.from(rawToken, 'base64url'));
                        tokens
                            .setRawData(tokenData)
                            .then(result => {
                                if (!result) {
                                    console.error('Token was not imported');
                                } else {
                                    console.error('Token was imported');
                                }
                                process.exit();
                            })
                            .catch(err => {
                                console.error(err);
                                process.exit(1);
                            });
                    }
                    break;

                default:
                    console.error('Future feature');
                    break;
            }
        }
        break;

    default:
        // run normally
        require('../server');
        break;
}
