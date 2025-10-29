import { Request, RequestHandler, Response } from 'express';
import { SalesforceClient } from '../clients/salesforceClient';
import logger from '../logger';

const getByRefId: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const { referenceId } = req.params;
    try {
        const depositQuery = `
            SELECT
                Id,
                Total_Deposit_Amount_Due__c,
                Amount_Paid__c,
                Due_Date__c,
                Payment_Reference_Id__c,
                Payment_Transaction_Id__c,
                Payment_Status__c,
                Payment_Method__c,
                Payment_Date__c,
                Payment_URL__c,
                Standard_Deposits_Remaining_Balance__c,
                Transaction_Amount__c,
                Square_Location_Payment_Id__c,
                Contract__r.Account.Name,
                Contract__r.Account.BillingStreet,
                Contract__r.Account.BillingCity,
                Contract__r.Account.BillingPostalCode,
                Contract__r.Account.BillingStateCode,
                Contract__r.Account.BillingCountryCode,
                Contract__r.WorkPlace_Property__r.Name,
                Contract__r.WorkPlace_Property__r.Payment_Processor__c,
                Contract__r.WorkPlace_Property__r.Id,
                Contract__r.Book_Code__c,
                Contract__r.CurrencyIsoCode,
                Contract__r.Id,
                Contract__r.StartDate,
                Sales_Invoice__r.ia_crm__Document_Number__c,
                Status__c,
                Total_Processing_Fee__c,
                Processing_Fee_Rate__c,
                Total_Amount_Due_With_Processing_Fee__c
            FROM Deposit__c
            WHERE 
                Payment_Reference_Id__c='${referenceId}'
            `;

        const depositResults = await SalesforceClient.query(depositQuery);

        if (!depositResults || !depositResults.totalSize) {
            logger.error(`Deposit - getByRefId - Failed to get deposit with reference id: ${referenceId}.`);
            res.status(503).send(`Failed to get deposit.`);
            return;
        }

        const {
            Id: id,
            Total_Deposit_Amount_Due__c: amountDue,
            Amount_Paid__c: amountPaid,
            Payment_Date__c: paymentDate,
            Due_Date__c: dueDate,
            Payment_Reference_Id__c: paymentReferenceId,
            Payment_Transaction_Id__c: paymentTransactionId,
            Payment_Status__c: paymentStatus,
            Payment_Method__c: paymentMethod,
            Payment_URL__c: paymentUrl,
            Standard_Deposits_Remaining_Balance__c: remainingContractBalance,
            Transaction_Amount__c: fullTransactionAmount,
            Square_Location_Payment_Id__c: squareLocationId,
            Contract__r: contract,
            Sales_Invoice__r: salesInvoice,
            Status__c: status,
            Total_Processing_Fee__c: totalProcessingFee,
            Processing_Fee_Rate__c: processingFeeRate,
            Total_Amount_Due_With_Processing_Fee__c: totalAmountDueWithProcessingFee,
        } = depositResults.records[0];

        let theSalesInvoice = paymentReferenceId;
        if (salesInvoice && salesInvoice.ia_crm__Document_Number__c) {
            theSalesInvoice = salesInvoice.ia_crm__Document_Number__c;
        }
        const deposit = {
            id,
            amountDue,
            amountPaid,
            paymentDate,
            dueDate,
            paymentReferenceId,
            paymentTransactionId,
            paymentStatus,
            paymentMethod,
            paymentUrl,
            remainingContractBalance,
            fullTransactionAmount,
            squareLocationId,
            status,
            bookingCode: contract.Book_Code__c,
            accountName: contract.Account.Name,
            accountBillingStreet: contract.Account.BillingStreet,
            accountBillingCity: contract.Account.BillingCity,
            accountBillingPostalCode: contract.Account.BillingPostalCode,
            accountBillingStateCode: contract.Account.BillingStateCode,
            accountBillingCountryCode: contract.Account.BillingCountryCode,
            workplacePropertyName: contract.WorkPlace_Property__r.Name,
            paymentProcessor: contract.WorkPlace_Property__r.Payment_Processor__c,
            workplacePropertyId: contract.WorkPlace_Property__r.Id,
            currency: contract.CurrencyIsoCode,
            salesInvoice: theSalesInvoice,
            salesforceUrl: `${SalesforceClient.getInstanceUrl()}/${id}`,
            totalProcessingFee,
            processingFeeRate,
            totalAmountDueWithProcessingFee,
            contractId: contract.Id,
            contractUrl: `${SalesforceClient.getInstanceUrl()}/${contract.Id}`,
            contractStartDate: contract.StartDate,
        };

        res.json(deposit);
        return;
    } catch (error) {
        logger.error(`Deposit - getByRefId - Error retrieving deposit with reference id ${referenceId}: ${error}`);
        res.status(500).json(`Error retrieving deposit: ${error}`);
        return;
    }
};

interface DepositPaymentUpdate {
    depositId: string;
    paymentTransactionNumber: string;
    paymentStatus: string;
    paymentMethod: string;
    paymentDate: string;
    amountPaid: number;
    fullTransactionAmount: number;
}

function validatePaymentDetails(req: Request): DepositPaymentUpdate {
    const paymentDetails: DepositPaymentUpdate = req.body;
    const valid =
        'depositId' in paymentDetails &&
        typeof paymentDetails.depositId === 'string' &&
        'paymentTransactionNumber' in paymentDetails &&
        typeof paymentDetails.paymentTransactionNumber === 'string' &&
        'paymentStatus' in paymentDetails &&
        typeof paymentDetails.paymentStatus === 'string' &&
        'paymentMethod' in paymentDetails &&
        typeof paymentDetails.paymentMethod === 'string' &&
        'paymentDate' in paymentDetails &&
        typeof paymentDetails.paymentDate === 'string' &&
        'amountPaid' in paymentDetails &&
        typeof paymentDetails.amountPaid === 'number' &&
        'fullTransactionAmount' in paymentDetails &&
        typeof paymentDetails.fullTransactionAmount === 'number';
    if (valid) {
        return paymentDetails;
    } else {
        return null;
    }
}

const updatePaymentDetails: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    if (Object.keys(req.body).length === 0) {
        logger.error('Deposit - updatePaymentDetails - Request missing body');
        res.status(400).send('Request missing body');
        return;
    }

    const paymentDetails: DepositPaymentUpdate = validatePaymentDetails(req);
    if (!paymentDetails) {
        logger.error('Deposit - updatePaymentDetails - Request body has incorrect payload');
        res.status(400).send('Request body has incorrect payload');
        return;
    }

    const { referenceId } = req.params;

    try {
        const depositUpdate = {
            Id: paymentDetails.depositId,
            Payment_Reference_Id__c: referenceId,
            Payment_Transaction_Id__c: paymentDetails.paymentTransactionNumber,
            Payment_Status__c: paymentDetails.paymentStatus,
            Payment_Method__c: paymentDetails.paymentMethod,
            Payment_Date__c: paymentDetails.paymentDate,
            Amount_Paid__c: paymentDetails.amountPaid,
            Transaction_Amount__c: paymentDetails.fullTransactionAmount,
        };

        const updateToDeposit = await SalesforceClient.updateObject('Deposit__c', depositUpdate);
        if (!updateToDeposit || !Object.keys(updateToDeposit).length || !updateToDeposit.success) {
            logger.error(`Deposit - updatePaymentDetails - Failed to update deposit with ref id ${referenceId}`);
            res.status(503).send('Failed to update deposit payment details.');
            return;
        }

        res.status(201).send();
        return;
    } catch (err) {
        logger.error(`Deposit - updatePaymentDetails - Error updating deposit: ${err.message || err}`);
        res.status(500).send(`Error updating deposit payment details: ${err.message || err}`);
        return;
    }
};

export { updatePaymentDetails, getByRefId };
