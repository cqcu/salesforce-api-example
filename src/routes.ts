import * as express from 'express';
import healthcheck from './controllers/healthcheck';
import * as deposit from './controllers/deposit';
import * as contact from './controllers/contact';
import * as member from './controllers/member';
import { query } from './controllers/query';

const basePath = '/api/salesforce-api-svc/v2';

const router = express.Router();

router.get(`${basePath}/healthcheck`, healthcheck);

router.get(`${basePath}/deposit/:referenceId`, deposit.getByRefId);
router.post(`${basePath}/deposit/paymentDetails/:referenceId`, deposit.updatePaymentDetails);

router.get(`${basePath}/contact`, contact.getByAttributes);
router.post(`${basePath}/contact`, contact.create);

router.get(`${basePath}/member`, member.getByAttributes);
router.post(`${basePath}/member`, member.create);

router.post(`${basePath}/query`, query);
export default router;
