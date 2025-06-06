import { Request, Response, NextFunction } from 'express';
import * as AuditService from '../services/audit.service'; // For logging failed attempts

// Example trade limit requiring confirmation (sync with auth.service.ts)
const TRADE_LIMIT_CONFIRMATION = 1000;

/**
 * Middleware to perform initial validation checks for critical operations
 * before they reach the main validation service.
 * Ensures required flags (like confirmation) are present for specific operations.
 */
export const validateCriticalOperationInput = (req: Request, res: Response, next: NextFunction) => {
    const { operationType, operationData, requiresConfirmation } = req.body;
    const userId = req.user?.id;

    // User ID check should be redundant due to authenticateToken middleware, but good practice
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized', message: 'User ID not found.' });
    }
    if (!operationType) {
        return res.status(400).json({ success: false, error: 'Bad Request', message: '"operationType" is required.' });
    }

    let error = null;

    switch (operationType) {
        case 'mode_switch':
            if (operationData?.mode === 'live') {
                console.log(`[Middleware/CriticalOp] Pre-validation for mode_switch to LIVE by User=${userId}`);
                // Could enforce 'requiresConfirmation' flag here if needed universally
                // Example: if (requiresConfirmation !== true) {
                //     error = 'Confirmation flag is required to switch to Live mode.';
                // }
            }
            break;

        case 'trade_execution':
            const tradeAmount = operationData?.amountUSD;
            console.log(`[Middleware/CriticalOp] Pre-validation for trade_execution by User=${userId}, Amount=${tradeAmount}`);
            if (typeof tradeAmount === 'number' && tradeAmount > TRADE_LIMIT_CONFIRMATION) {
                // If trade is above limit, the 'requiresConfirmation' flag MUST be true
                // This ensures the frontend explicitly acknowledged the high value
                if (requiresConfirmation !== true) {
                    error = `Confirmation flag (requiresConfirmation=true) is mandatory for trades exceeding $${TRADE_LIMIT_CONFIRMATION}.`;
                }
            }
            break;

        // Add other operation types if specific input pre-validation is needed
    }

    if (error) {
        console.warn(`[Middleware/CriticalOp] Input validation failed for User=${userId}, Type=${operationType}: ${error}`);
        // Log the failed attempt
        AuditService.logAction(userId, 'validate_operation_fail_middleware', { operationType, reason: error, operationData });
        return res.status(400).json({ // Use 400 Bad Request as input is missing required confirmation flag
            success: false,
            error: 'Bad Request',
            message: error,
            allowed: false, // Explicitly state not allowed
            reason: error
        });
    }

    // Input seems valid for this middleware, proceed to controller/service validation
    next();
};
