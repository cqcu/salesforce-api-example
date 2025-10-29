import { Request, RequestHandler, Response } from 'express';
import { SalesforceClient } from '../clients/salesforceClient';
import logger from '../logger';

function toCamelCase(str: string): string {
    const [main] = str.split('__'); // Split on '__' first, if it exists
    const parts = main.split('_'); // Split on underscores
    if (parts[parts.length - 1].length === 1) parts.pop(); // Remove single-letter word at the end

    return parts
        .map((word, index) => {
            if (index === 0) {
                return word.toLowerCase();
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');
}

// Recursive type definition to handle both objects and arrays
type DeepStringObj = { [key: string]: string | DeepStringObj | DeepStringObj[] };

// Main function to format object keys to camelCase
function formatObjectKeysToCamelCase(
    obj: DeepStringObj | DeepStringObj[] | string,
): DeepStringObj | DeepStringObj[] | string {
    if (Array.isArray(obj)) {
        // Recursively format elements in the array
        return obj.map((item) => formatObjectKeysToCamelCase(item) as DeepStringObj);
    } else if (obj !== null && typeof obj === 'object') {
        // Recursively format keys in the object
        const result: DeepStringObj = {};
        for (const key of Object.keys(obj)) {
            const camelKey = toCamelCase(key); // Convert the key to camelCase
            result[camelKey] = formatObjectKeysToCamelCase((obj as { [key: string]: DeepStringObj })[key]); // Recurse for value
        }
        return result;
    }

    // If it's neither an object nor array, return the primitive as is
    return obj as string;
}

const query: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = await req.body.query;
        logger.info(`SalesforceClient - query - Getting query: \n${query}`);

        const queryResults = await SalesforceClient.query(query);
        logger.info(`SalesforceClient - query - Successfully retrieved ${queryResults.records.length}`);
        const result = formatObjectKeysToCamelCase(queryResults.records);
        res.json(result);
        return;
    } catch (error) {
        logger.error(`SalesforceClient - query - Error retrieving results from query ${req.body.query}: ${error}`);
        res.status(500).json(`Error retrieving query: ${error}`);
    }
};

export { query };
