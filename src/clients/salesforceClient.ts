import logger from '../logger';
import * as config from '../config';
import jsforce from 'jsforce';

export class SalesforceClientClass {
    private static instance: SalesforceClientClass;
    public static getInstance() {
        if (!SalesforceClientClass.instance) {
            SalesforceClientClass.instance = new SalesforceClientClass();
        }
        return SalesforceClientClass.instance;
    }

    private conn = null;

    private constructor() {
        this.connect();
    }

    private async connect() {
        try {
            // Connection.login has default refresh functionality built in, no need to pass in refreshFn here
            this.conn = new jsforce.Connection({
                // version: config.getString('salesforce.apiVersion'), // TODO results in Resource not found error
                // logLevel: 'DEBUG', // Uncomment to see the refresh logic logs
                oauth2: {
                    loginUrl: config.getString('salesforce.loginUrl'),
                    clientId: config.getString('salesforce.clientId'),
                    clientSecret: config.getString('salesforce.clientSecret'),
                },
            });

            const userInfo = await this.conn.login(
                config.getString('salesforce.username'),
                config.getString('salesforce.password') + (config.getString('salesforce.apiToken') || ''),
            );
            logger.info(
                `SalesforceClient - connect - Authenticated to Salesforce API - User ID: ${userInfo.id}, Org ID: ${userInfo.organizationId}`,
            );
        } catch (error) {
            logger.error('SalesforceClient - connect - Failed to connect to the Salesforce API: ', error);
            throw error;
        }
    }

    // Client Credentials Flow (OAuth 2.0 Client Credentials Flow)
    // https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_client_credentials_flow.htm&type=5
    // TODO looks like the user associated to the connected app must be API only... which is weird because I get a token in postman just fine
    public async clientCredentialsConnect() {
        try {
            // Connection.authorize default refresh functionality (assumes refresh token exists) will NOT work here, need to pass in own function
            this.conn = new jsforce.Connection({
                oauth2: {
                    clientId: config.getString('salesforce.clientId'),
                    clientSecret: config.getString('salesforce.clientSecret'),
                    loginUrl: config.getString('salesforce.clientCredentialsLoginUrl'),
                },
                async refreshFn(conn, callback) {
                    try {
                        await conn.authorize({ grant_type: 'client_credentials' });
                        if (!conn.accessToken) {
                            throw new Error('Access token not found after login');
                        }
                        callback(null, conn.accessToken!);
                    } catch (err) {
                        callback(err);
                    }
                },
            });
            const userInfo = this.conn.authorize({ grant_type: 'client_credentials' });

            logger.info(
                `Authenticated to Salesforce API - User ID: ${userInfo.id}, Org ID: ${userInfo.organizationId}`,
            );
        } catch (e) {
            logger.error(`Failed to authorize Salesforce client credentials connection: ${(e as Error).message}`);
            throw e;
        }
    }

    public getInstanceUrl() {
        return this.conn.instanceUrl;
    }

    public async query(q: string) {
        try {
            const results = await this.conn.query(q);
            logger.info(`SalesforceClient - query - Successfully queried ${results.records.length} records`);
            return results;
        } catch (err) {
            logger.error(`SalesforceClient - query - Failed to execute query: ${err.message || err}`);
            throw err;
        }
    }

    async createObject(sfdcObjectName, attributes) {
        let createdObject = null;
        try {
            logger.info(`SalesforceDataProvider: Creating sobject using jsforce sfdcObjectName=${sfdcObjectName}`);
            createdObject = await this.conn.sobject(sfdcObjectName).create(attributes);
        } catch (err) {
            logger.error(`SalesforceDataProvider: Failed to create sobject using jsforce ${err.message || err}`);
            throw err;
        }

        return createdObject;
    }

    public async updateObject(sfdcObjectName, attributes) {
        try {
            const updateResult = await this.conn.sobject(sfdcObjectName).update(attributes);
            logger.debug(`SalesforceClient - updateObject - Successfully updated record ${updateResult.id}`);
            return updateResult;
        } catch (err) {
            logger.error(`SalesforceClient - updateObject - Failed to update sobject: ${err.message || err}`);
            throw err;
        }
    }
    public buildWhere(attributes) {
        const clauses = [];
        for (const key in attributes) {
            clauses.push(`${key} = '${attributes[key]}'`);
        }
        return clauses.join(' AND ');
    }
}

export const SalesforceClient = SalesforceClientClass.getInstance();
