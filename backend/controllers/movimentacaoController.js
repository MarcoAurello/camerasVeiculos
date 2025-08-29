const { MovimentacaoVeiculo } = require("../models");
const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const placasJson = JSON.parse(fs.readFileSync(path.join(__dirname, "placas.json"), "utf-8"));


exports.registrarMovimentacao = async (req, res) => {
  try {
    const { placa, tipo } = req.body; // "entrada" ou "saida"

    const payload = {
      placa,
      entrada: tipo === "entrada",
      saida: tipo === "saida",
    };

    const mov = await MovimentacaoVeiculo.create(payload);
    return res.status(201).json(mov);
  } catch (error) {
    console.error("Erro ao registrar movimentação:", error);
    return res.status(500).json({ error: "Erro ao registrar movimentação" });
  }
};


exports.buscarPlacasHoje = async (req, res) => {
  try {
    // Buscar todas movimentações, mas só das placas do JSON
    const placasValidas = placasJson.map(p => p.placa);

    const movimentacoes = await MovimentacaoVeiculo.findAll({
      where: {
        placa: {
          [Op.in]: placasValidas,
        },
      },
      attributes: ["placa", "entrada", "saida", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    // Pegar apenas o último registro de cada placa
    const seenPlacas = new Set();
    const placasUnicas = [];

    for (const m of movimentacoes) {
      const placa = m.placa;
      if (!seenPlacas.has(placa)) {
        seenPlacas.add(placa);
        const placaInfo = placasJson.find(p => p.placa === placa);
        placasUnicas.push({
          ...m.toJSON(),
          entrada: !!m.entrada,
          saida: !!m.saida,
          motorista: placaInfo?.motorista || "",
          modelo: placaInfo?.modelo || "",
        });
      }
    }

    return res.status(200).json(placasUnicas);
  } catch (error) {
    console.error("Erro ao buscar placas:", error);
    return res.status(500).json({ error: "Erro ao buscar placas" });
  }
};