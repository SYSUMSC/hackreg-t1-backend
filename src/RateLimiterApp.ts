import pm2 from 'pm2';
import { RateLimiterClusterMasterPM2 } from 'rate-limiter-flexible';

new RateLimiterClusterMasterPM2(pm2);
