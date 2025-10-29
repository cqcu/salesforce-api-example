import { Request, RequestHandler, Response } from 'express';
import { SalesforceClient } from '../clients/salesforceClient';
import logger from '../logger';

const getByAttributes: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const attributes = req.query;
    if (!attributes || Object.keys(attributes).length == 0) {
        res.status(500).send('No filter attributes provided');
        return;
    }
    const queryWhere = SalesforceClient.buildWhere(attributes);
    try {
        const contactQuery = `
            SELECT
                Id,
                AccountId,
                Email,
                FirstName,
                LastName
            FROM Contact
            WHERE 
               ${queryWhere}
            `;

        const contactResults = await SalesforceClient.query(contactQuery);

        if (!contactResults || !contactResults.totalSize) {
            logger.warn(`Contact - getByAttributes - No contacts found with attributes: ${JSON.stringify(attributes)}`);
            res.status(200).json({});
            return;
        }

        const {
            Id: id,
            AccountId: accountId,
            Email: email,
            FirstName: firstName,
            LastName: lastName,
        } = contactResults.records[0];

        const contact = {
            id,
            accountId,
            email,
            firstName,
            lastName,
        };

        res.json(contact);
        return;
    } catch (error) {
        logger.error(
            `Contact - getByAttributes - Error retrieving contact with attributes ${JSON.stringify(attributes)}: ${error}`,
        );
        res.status(500).json(`Error retrieving contact: ${error}`);
        return;
    }
};

interface ContactCreate {
    accountId: string;
    email: string;
    firstName: string;
    lastName: string;
}

function validateContactDetails(req: Request): ContactCreate {
    const contactDetails: ContactCreate = req.body;
    const valid =
        'accountId' in contactDetails &&
        typeof contactDetails.accountId === 'string' &&
        'email' in contactDetails &&
        typeof contactDetails.email === 'string' &&
        'firstName' in contactDetails &&
        typeof contactDetails.firstName === 'string' &&
        'lastName' in contactDetails &&
        typeof contactDetails.lastName === 'string';
    if (valid) {
        return contactDetails;
    } else {
        return null;
    }
}
const create: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    if (Object.keys(req.body).length === 0) {
        logger.error('Contact - create - Request missing body');
        res.status(400).send('Request missing body');
        return;
    }

    const contactDetails: ContactCreate = validateContactDetails(req);
    if (!contactDetails) {
        logger.error('Contact - create - Request body has incorrect payload');
        res.status(400).send('Request body has incorrect payload');
        return;
    }

    try {
        const contactCreateData = {
            AccountId: contactDetails.accountId,
            Email: contactDetails.email,
            FirstName: contactDetails.firstName,
            LastName: contactDetails.lastName,
        };
        const contactCreateResult = await SalesforceClient.createObject('Contact', contactCreateData);
        if (!contactCreateResult || !Object.keys(contactCreateResult).length || !contactCreateResult.success) {
            logger.error(`Contact - create - Failed to create contact ${contactCreateData}`);
            res.status(503).send('Failed to create contact.');
            return;
        }

        res.status(201).json({ id: contactCreateResult.id });
        return;
    } catch (err) {
        logger.error(`Contact - create - Error creating contact: ${err.message || err}`);
        res.status(500).send(`Error creating contact: ${err.message || err}`);
        return;
    }
};

export { getByAttributes, create };
