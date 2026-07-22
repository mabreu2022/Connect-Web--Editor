const express = require('express');
const router = express.Router();
const { login, registro, recuperarSenha, redefinirSenha, me } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.post('/login', login);
router.post('/registro', registro);
router.post('/recuperar-senha', recuperarSenha);
router.post('/redefinir-senha', redefinirSenha);
router.get('/me', authenticate, me);

module.exports = router;
