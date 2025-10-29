import { Request, RequestHandler, Response } from 'express';
const healthcheckHandler: RequestHandler = (_req: Request, res: Response): void => {
    res.sendStatus(200);
    return;
};

export default healthcheckHandler;
