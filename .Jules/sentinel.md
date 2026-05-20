## 2024-05-20 - Missing trust proxy for rate limiting behind reverse proxy
**Vulnerability:** The Express application implements IP-based rate limiting but fails to set `app.set('trust proxy', 1)`. Behind a reverse proxy (like Cloud Run or a load balancer), `req.ip` will be the proxy's IP, effectively applying a global rate limit for all users instead of per-user limits, creating a DoS vulnerability.
**Learning:** Always enable `trust proxy` in Express when deploying behind load balancers/proxies if you rely on `req.ip` for security controls like rate limiting.
**Prevention:** Add `app.set('trust proxy', 1);` before setting up rate limiting middlewares in Express applications.

## 2024-05-20 - Missing trust proxy for rate limiting behind reverse proxy
**Vulnerability:** The Express application implements IP-based rate limiting but fails to set `app.set('trust proxy', 1)`. Behind a reverse proxy (like Cloud Run or a load balancer), `req.ip` will be the proxy's IP, effectively applying a global rate limit for all users instead of per-user limits, creating a DoS vulnerability.
**Learning:** Always enable `trust proxy` in Express when deploying behind load balancers/proxies if you rely on `req.ip` for security controls like rate limiting.
**Prevention:** Add `app.set('trust proxy', 1);` before setting up rate limiting middlewares in Express applications.
