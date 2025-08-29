const express = require("express");
const router = express.Router();
const movimentacaoController = require("../controllers/movimentacaoController");

// Rota para registrar movimentação
router.post("/registrar", movimentacaoController.registrarMovimentacao);
// Buscar placas cadastradas hoje
router.get("/placas-hoje", movimentacaoController.buscarPlacasHoje);


module.exports = router;
