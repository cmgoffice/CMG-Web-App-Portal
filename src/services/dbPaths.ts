/**
 * ทุก collection/document อยู่ใต้ /CMG-web-portal/root เสมอ
 *
 *  /CMG-web-portal/root                    <- portal app data (menu/apps)
 *  /CMG-web-portal/root/users/{uid}        <- user profiles
 *  /CMG-web-portal/root/appMeta/config     <- app metadata (firstUser, totalUsers)
 *  /CMG-web-portal/root/projects/{id}      <- projects
 *  /CMG-web-portal/root/activityLogs/{id}  <- activity logs
 */
export const ROOT = 'CMG-web-portal/root';

export const PATHS = {
  users:         `${ROOT}/users`,
  appMeta:       `${ROOT}/appMeta`,
  appMetaConfig: `${ROOT}/appMeta/config`,
  projects:      `${ROOT}/projects`,
  activityLogs:  `${ROOT}/activityLogs`,
};
