import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.types'; 
import { AppDataSource } from '../config/db';
import { Role } from '../Models/Role';

const roleRepository = AppDataSource.getRepository(Role);

export const authorizeRole = (allowedRoleNames: string[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
     
        if (req.user) {
            console.log('req.user.id_user (from token/authMiddleware):', req.user.id_user);
            console.log('req.user.id_role (from token/authMiddleware):', req.user.id_role);
        } else {
            console.log('req.user is undefined');
        }

        if (!req.user || typeof req.user.id_role === 'undefined') {
            console.log('--- AUTHORIZE ROLE DEBUG ---: Failing due to missing req.user or req.user.id_role');
            res.status(401).json({ message: 'Unauthorized: User not authenticated properly' });
            return;
        }

        try {
            const userRole = await roleRepository.findOneBy({ id_role: req.user.id_role });

            // to knwo where is the error 
            if (userRole) {
                console.log('Fetched userRole from DB:', JSON.stringify(userRole));
                console.log('Comparing userRole.name_role:', `"${userRole.name_role}"`, 'with allowedRoles:', JSON.stringify(allowedRoleNames));
            } else {
                console.log('--- AUTHORIZE ROLE DEBUG ---: userRole not found in DB for id_role:', req.user.id_role);
            }

            if (!userRole) {
                res.status(403).json({ message: 'Forbidden: User role not found' });
                return;
            }

            if (allowedRoleNames.includes(userRole.name_role)) {
                console.log('--- AUTHORIZE ROLE DEBUG ---: Authorization GRANTED for role:', userRole.name_role);
                next();
            } else {
                console.log('--- AUTHORIZE ROLE DEBUG ---: Authorization DENIED. userRole.name_role:', `"${userRole.name_role}"`, 'is not in allowedRoles:', JSON.stringify(allowedRoleNames));
                res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action' });
                return;
            }
        } catch (error) {
            console.error("--- AUTHORIZE ROLE DEBUG ---: Authorization middleware error:", error);
            res.status(500).json({ message: 'Error during authorization' });
            return;
        }
    };
};
