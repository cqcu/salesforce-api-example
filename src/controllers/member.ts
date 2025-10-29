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
        const query = `
            SELECT
                Id,
                Account_ID__c,
                Contact__c,
                Contract__c,
                Member_Email__c,
                Membership_Type__c,
                Status__c,
                First_Name__c,
                Last_Name__c
            FROM Contract_Member__c
            WHERE 
               ${queryWhere}
            `;

        const results = await SalesforceClient.query(query);

        if (!results || !results.totalSize) {
            logger.warn(`Member - getByAttributes - No members found with attributes: ${JSON.stringify(attributes)}`);
            res.status(200).json({});
            return;
        }

        const {
            Id: id,
            Account_ID__c: accountId,
            Contact__c: contactId,
            Contract__c: contractId,
            Member_Email__c: memberEmail,
            Membership_Type__c: membershipType,
            Status__c: status,
            First_Name__c: firstName,
            Last_Name__c: lastName,
        } = results.records[0];

        const member = {
            id,
            accountId,
            contactId,
            contractId,
            memberEmail,
            membershipType,
            status,
            firstName,
            lastName,
        };

        res.json(member);
        return;
    } catch (error) {
        logger.error(
            `Member - getByAttributes - Error retrieving member with attributes ${JSON.stringify(attributes)}: ${error}`,
        );
        res.status(500).json(`Error retrieving member: ${error}`);
    }
};

interface MemberCreate {
    contactId: string;
    contractId: string;
    status: string;
    memberEmail: string;
    membershipType: string;
}

function validateMemberDetails(req: Request): MemberCreate {
    const memberDetails: MemberCreate = req.body;
    const valid =
        'contactId' in memberDetails &&
        typeof memberDetails.contactId === 'string' &&
        'contractId' in memberDetails &&
        typeof memberDetails.contractId === 'string' &&
        'status' in memberDetails &&
        typeof memberDetails.status === 'string' &&
        'memberEmail' in memberDetails &&
        typeof memberDetails.memberEmail === 'string' &&
        'membershipType' in memberDetails &&
        typeof memberDetails.membershipType === 'string';
    if (valid) {
        return memberDetails;
    } else {
        return null;
    }
}
const create: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    if (Object.keys(req.body).length === 0) {
        logger.error('Member - create - Request missing body');
        res.status(400).send('Request missing body');
        return;
    }

    const memberDetails: MemberCreate = validateMemberDetails(req);
    if (!memberDetails) {
        logger.error('Member - create - Request body has incorrect payload');
        res.status(400).send('Request body has incorrect payload');
        return;
    }

    try {
        const memberCreateData = {
            Contact__c: memberDetails.contactId,
            Contract__c: memberDetails.contractId,
            Status__c: memberDetails.status,
            Member_Email__c: memberDetails.memberEmail,
            Membership_Type__c: memberDetails.membershipType,
        };
        const memberCreateResult = await SalesforceClient.createObject('Contract_Member__c', memberCreateData);
        if (!memberCreateResult || !Object.keys(memberCreateResult).length || !memberCreateResult.success) {
            logger.error(`Member - create - Failed to create member ${memberCreateResult}`);
            res.status(503).send('Failed to create member.');
            return;
        }

        res.status(201).json({ id: memberCreateResult.id });
        return;
    } catch (err) {
        logger.error(`Member - create - Error creating member: ${err.message || err}`);
        res.status(500).send(`Error creating member: ${err.message || err}`);
        return;
    }
};
export { getByAttributes, create };
