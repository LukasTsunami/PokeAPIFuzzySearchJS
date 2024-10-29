import { LocalStorage } from 'node-localstorage';

global.localStorage = new LocalStorage('./cache');

function configureCache(req, res, next) {
  next();
}

export default configureCache;
