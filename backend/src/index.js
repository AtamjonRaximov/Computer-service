import http from 'http';
import { connect } from './utils/mongodb.js';
import { createRoles } from './handleRoutes/stuff.js';
import { login, register, logout } from './handleRoutes/auth.js';
import { createServiceRequest, sendToMaster, updateService, getAllServices, updateServiceStatus, completeService } from './handleRoutes/service.js';
import {createComponent,getAllComponents,} from './handleRoutes/components.js';
import {getAllUsers, getAuthUser, partialUpdateUser} from "./handleRoutes/users.js"
import { getLocationStats, getRequestStats, getVisitorStats } from './handleRoutes/stats.js';


const server = http.createServer(async (req, res) => {
  const { url, method } = req;
  res.setHeader('Access-Control-Allow-Origin', 'https://atamjon.robohouse.tech'); 
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');


  if (method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  if (url === '/api/auth/register' && method === 'POST') register(req, res);
  else if (url === '/api/auth/login' && method === 'POST') login(req, res);
  else if (url === '/api/auth/logout' && method === 'POST') logout(req, res);
  else if (url === '/api/service/create' && method === 'POST') createServiceRequest(req, res);
  else if (url === '/api/auth/current-user' && method === 'GET') getAuthUser(req, res);
  else if (url === "/api/stuff/create") createRoles(req, res);
  else if (url === "/api/users" && method === "GET") getAllUsers(req, res);
  else if (url === "/api/users-profile" && method === "PUT") partialUpdateUser(req, res);
  else if (url.startsWith('/api/service/send') && method === 'POST') sendToMaster(req, res, url);
  else if (url === '/api/service-request' && method === 'GET') getAllServices(req, res);
  else if (url === '/api/service-request/update' && method === 'PUT') updateService(req, res);
  else if (url === '/api/service-request/complete' && method === 'PUT') completeService(req, res);
  else if (url ==="/api/service-request/status/update" && method === 'PUT')updateServiceStatus(req, res)
  else if (url === '/api/components' && method === 'POST') createComponent(req, res)
  else if (url === '/api/components' && method === 'GET') getAllComponents(req, res);
  else if (url === '/api/stats/visitors' && method === 'GET') getVisitorStats(req, res);
  else if (url === '/api/stats/locations' && method === 'GET') getLocationStats(req, res);
  else if (url === '/api/stats/requests' && method === 'GET') getRequestStats(req, res);
 
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Route not found' }));
  }
});

connect().then(() => {
  server.listen(8003, () => {
    console.log('Server running');
  });
});